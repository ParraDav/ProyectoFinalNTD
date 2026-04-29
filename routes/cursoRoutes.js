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
        // Si es instructor, podría querer ver sus propios cursos y los publicados? 
        // Por simplicidad: si es estudiante -> publicados. Sino (admin/instructor) -> todos.
        // Opcional: el instructor solo ve sus propios cursos o todos? 
        // Para la plataforma, dejaremos que vean todos, pero solo editen los propios.
        
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

module.exports = router;