const express = require("express");
const router = express.Router();
const Curso = require("../models/curso");
const Inscripcion = require("../models/Inscripcion");
const Usuario = require("../models/Usuario");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/roleMiddleware");

router.use(verificarToken);

// Obtener métricas para el instructor
router.get("/instructor", verificarRol(['instructor', 'administrador']), async (req, res) => {
    try {
        const cursosDelInstructor = await Curso.find({ instructor: req.usuario.id });
        const idsCursos = cursosDelInstructor.map(c => c._id);
        
        const totalInscripciones = await Inscripcion.countDocuments({ curso: { $in: idsCursos } });
        
        // Calcular total de módulos (opcional)
        const totalModulos = cursosDelInstructor.reduce((acc, curso) => acc + curso.modulos.length, 0);

        res.json({
            totalCursos: cursosDelInstructor.length,
            totalEstudiantesInscritos: totalInscripciones,
            totalModulos: totalModulos
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener métricas", error });
    }
});

// Obtener métricas globales para el administrador
router.get("/admin", verificarRol(['administrador']), async (req, res) => {
    try {
        const totalUsuarios = await Usuario.countDocuments();
        const totalCursos = await Curso.countDocuments();
        const totalInscripciones = await Inscripcion.countDocuments();

        res.json({
            totalUsuarios,
            totalCursos,
            totalInscripciones
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener métricas globales", error });
    }
});

module.exports = router;
