const express = require("express");
const router = express.Router();
const Curso = require("../models/curso");
const Inscripcion = require("../models/Inscripcion");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/roleMiddleware");

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
        res.status(500).json(error);
    }
});

// Obtener cursos
router.get("/", verificarToken, async (req, res) => {
    try {
        let filtro = {};
        // Si es estudiante, solo ve cursos publicados
        if (req.usuario.rol === 'estudiante') {
            filtro.estado = 'publicado';
        }
        
        // Búsqueda por nombre o descripción si se proporciona ?search=
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

// Actualizar curso
router.put("/:id", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

        // Solo el dueño o un administrador pueden editar
        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para editar este curso" });
        }

        const cursoActualizado = await Curso.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
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

// Ver inscritos en un curso (solo instructor del curso o admin)
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

// Agregar un módulo a un curso
router.post("/:id/modulos", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

        if (curso.instructor.toString() !== req.usuario.id && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: "No tienes permiso para modificar este curso" });
        }

        const nuevoModulo = {
            titulo: req.body.titulo,
            contenido: req.body.contenido
        };

        curso.modulos.push(nuevoModulo);
        await curso.save();

        const moduloCreado = curso.modulos[curso.modulos.length - 1];
        res.status(201).json({ mensaje: "Módulo agregado", modulo: moduloCreado });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al agregar módulo", error });
    }
});

// Actualizar un módulo específico
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

// Eliminar un módulo específico
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

// Marcar un módulo como completado (solo estudiantes inscritos)
router.post("/:id/completar/:idModulo", verificarToken, verificarRol(['estudiante']), async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

        const modulo = curso.modulos.id(req.params.idModulo);
        if (!modulo) return res.status(404).json({ mensaje: "Módulo no encontrado" });

        const inscripcion = await Inscripcion.findOne({ estudiante: req.usuario.id, curso: req.params.id });
        if (!inscripcion) return res.status(403).json({ mensaje: "No estás inscrito en este curso" });

        // Verificar si ya está completado
        if (!inscripcion.modulosCompletados.includes(req.params.idModulo)) {
            inscripcion.modulosCompletados.push(req.params.idModulo);
            await inscripcion.save();
        }

        res.json({ 
            mensaje: "Módulo marcado como completado", 
            modulosCompletados: inscripcion.modulosCompletados 
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al registrar progreso", error });
    }
});

module.exports = router;