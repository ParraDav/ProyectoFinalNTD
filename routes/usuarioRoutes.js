const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const Inscripcion = require("../models/Inscripcion");
const verificarToken = require("../middleware/authMiddleware");

// Obtener el perfil del usuario autenticado
router.get("/perfil", verificarToken, async (req, res) => {
    try {
        // req.usuario.id viene del token verificado
        const usuario = await Usuario.findById(req.usuario.id).select("-password");
        
        if (!usuario) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }
        
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener el perfil", error });
    }
});

// Obtener los cursos a los que el estudiante está inscrito
router.get("/mis-cursos", verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'estudiante') {
            return res.status(403).json({ mensaje: "Solo los estudiantes tienen cursos inscritos" });
        }

        const inscripciones = await Inscripcion.find({ estudiante: req.usuario.id })
            .populate({
                path: 'curso',
                populate: { path: 'instructor', select: 'nombre email' }
            });

        // Extraer solo la información de los cursos de las inscripciones
        const misCursos = inscripciones.map(inscripcion => inscripcion.curso);
        
        res.json(misCursos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener tus cursos", error });
    }
});

module.exports = router;
