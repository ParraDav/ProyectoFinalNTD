const express = require("express");
const router = express.Router();
const Curso = require("../models/curso");
const Inscripcion = require("../models/Inscripcion");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/roleMiddleware");

// ─── RUTA PÚBLICA (sin token) ────────────────────────────────────────────────
// Obtener cursos publicados para home/ver-curso sin login
router.get("/publicos", async (req, res) => {
    try {
        const cursos = await Curso.find({ estado: 'publicado' })
            .populate("instructor", "nombre email");
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener cursos", error });
    }
});

// Obtener un curso público por ID (para ver-curso sin login)
router.get("/publicos/:id", async (req, res) => {
    try {
        const curso = await Curso.findOne({ _id: req.params.id, estado: 'publicado' })
            .populate("instructor", "nombre email");
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        res.json(curso);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener el curso", error });
    }
});

// ─── RUTAS PROTEGIDAS ────────────────────────────────────────────────────────

// Crear curso
router.post("/", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = new Curso({
            ...req.body,
            instructor: req.usuario.id
        });
        await curso.save();
        res.json(curso);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear curso" });
    }
});

// Obtener cursos (autenticado)
router.get("/", verificarToken, async (req, res) => {
    try {
        let filtro = {};
        if (req.usuario.rol === 'estudiante') {
            filtro.estado = 'publicado';
        }
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filtro.$or = [
                { nombre: searchRegex },
                { descripcion: searchRegex }
            ];
        }
        const cursos = await Curso.find(filtro).populate("instructor", "nombre email");
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener cursos", error });
    }
});

// Obtener un curso por ID (autenticado)
router.get("/:id", verificarToken, async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id)
            .populate("instructor", "nombre email");
        if (!curso) {
            return res.status(404).json({ mensaje: "Curso no encontrado" });
        }
        // Si el curso es borrador, solo el instructor dueño o el admin pueden verlo, o si el estudiante está inscrito
        if (curso.estado === 'borrador') {
            const instructorId = curso.instructor._id ? curso.instructor._id.toString() : curso.instructor.toString();
            if (instructorId !== req.usuario.id && req.usuario.rol !== 'administrador') {
                const inscripcion = await Inscripcion.findOne({ estudiante: req.usuario.id, curso: curso._id });
                if (!inscripcion) {
                    return res.status(403).json({ mensaje: "No tienes permiso para ver este curso en borrador" });
                }
            }
        }
        res.json(curso);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener el curso", error });
    }
});

// Actualizar curso
router.put("/:id", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para editar este curso" });
        }
        const cursoActualizado = await Curso.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(cursoActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar curso", error });
    }
});

// Eliminar curso
router.delete("/:id", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para eliminar este curso" });
        }
        await Curso.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Curso eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar curso", error });
    }
});

// Inscribirse a un curso (solo estudiantes)
router.post("/:id/inscribir", verificarToken, verificarRol(['estudiante']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso || curso.estado !== 'publicado') {
            return res.status(404).json({ mensaje: "Curso no encontrado o no disponible" });
        }
        const inscripcion = new Inscripcion({
            estudiante: req.usuario.id,
            curso: curso._id
        });
        await inscripcion.save();
        res.json({ mensaje: "Inscrito correctamente al curso", inscripcion });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ mensaje: "Ya estás inscrito en este curso" });
        }
        res.status(500).json({ mensaje: "Error al inscribirse", error });
    }
});

// Ver inscritos en un curso
router.get("/:id/inscritos", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para ver los inscritos de este curso" });
        }
        const inscripciones = await Inscripcion.find({ curso: req.params.id })
            .populate('estudiante', 'nombre email')
            .select('-curso');
        res.json(inscripciones);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener inscritos", error });
    }
});

// Agregar módulo
router.post("/:id/modulos", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para modificar este curso" });
        }
        curso.modulos.push({ titulo: req.body.titulo, contenido: req.body.contenido });
        await curso.save();
        const moduloCreado = curso.modulos[curso.modulos.length - 1];
        res.status(201).json({ mensaje: "Módulo agregado", modulo: moduloCreado });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al agregar módulo", error });
    }
});

// Actualizar módulo
router.put("/:id/modulos/:idModulo", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para modificar este curso" });
        }
        const modulo = curso.modulos.id(req.params.idModulo);
        if (!modulo) return res.status(404).json({ mensaje: "Módulo no encontrado" });
        if (req.body.titulo) modulo.titulo = req.body.titulo;
        if (req.body.contenido) modulo.contenido = req.body.contenido;
        await curso.save();
        res.json({ mensaje: "Módulo actualizado", modulo });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar módulo", error });
    }
});

// Eliminar módulo
router.delete("/:id/modulos/:idModulo", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para modificar este curso" });
        }
        const modulo = curso.modulos.id(req.params.idModulo);
        if (!modulo) return res.status(404).json({ mensaje: "Módulo no encontrado" });
        curso.modulos.pull({ _id: req.params.idModulo });
        await curso.save();
        res.json({ mensaje: "Módulo eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar módulo", error });
    }
});

// Marcar módulo como completado
router.post("/:id/completar/:idModulo", verificarToken, verificarRol(['estudiante']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });
        const modulo = curso.modulos.id(req.params.idModulo);
        if (!modulo) return res.status(404).json({ mensaje: "Módulo no encontrado" });
        const inscripcion = await Inscripcion.findOne({ estudiante: req.usuario.id, curso: req.params.id });
        if (!inscripcion) return res.status(403).json({ mensaje: "No estás inscrito en este curso" });
        if (!inscripcion.modulosCompletados.includes(req.params.idModulo)) {
            inscripcion.modulosCompletados.push(req.params.idModulo);
            await inscripcion.save();
        }
        res.json({ mensaje: "Módulo marcado como completado", modulosCompletados: inscripcion.modulosCompletados });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al registrar progreso", error });
    }
});

// Solicitar certificado (estudiante)
router.post("/:id/solicitar-certificado", verificarToken, verificarRol(['estudiante']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

        const inscripcion = await Inscripcion.findOne({ estudiante: req.usuario.id, curso: req.params.id });
        if (!inscripcion) return res.status(403).json({ mensaje: "No estás inscrito en este curso" });

        if (!curso.modulos || curso.modulos.length === 0) {
            return res.status(400).json({ mensaje: "Este curso no contiene módulos y no genera certificados" });
        }

        const completadosCount = inscripcion.modulosCompletados ? inscripcion.modulosCompletados.length : 0;
        if (completadosCount < curso.modulos.length) {
            return res.status(400).json({ mensaje: "Debes completar el 100% de los módulos para solicitar el certificado" });
        }

        inscripcion.estadoCertificado = 'solicitado';
        await inscripcion.save();

        res.json({ 
            mensaje: "Certificado solicitado con éxito", 
            estadoCertificado: inscripcion.estadoCertificado 
        });
    } catch (error) {
        console.error("Error en solicitar-certificado:", error);
        res.status(500).json({ mensaje: "Error al solicitar el certificado", error: error.message || error });
    }
});

// Aprobar certificado (instructor / administrador)
router.post("/:id/aprobar-certificado/:idInscripcion", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

        // Verificar permisos del instructor dueño o administrador
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para aprobar certificados en este curso" });
        }

        const inscripcion = await Inscripcion.findById(req.params.idInscripcion).populate('estudiante', 'nombre email');
        if (!inscripcion) return res.status(404).json({ mensaje: "Inscripción no encontrada" });

        if (inscripcion.curso.toString() !== req.params.id) {
            return res.status(400).json({ mensaje: "La inscripción no corresponde al curso especificado" });
        }

        inscripcion.estadoCertificado = 'aprobado';
        inscripcion.fechaAprobacionCertificado = new Date();
        await inscripcion.save();

        res.json({ 
            mensaje: "Certificado aprobado con éxito", 
            estadoCertificado: inscripcion.estadoCertificado,
            inscripcion
        });
    } catch (error) {
        console.error("Error en aprobar-certificado:", error);
        res.status(500).json({ mensaje: "Error al aprobar el certificado", error: error.message || error });
    }
});

module.exports = router;