const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const Inscripcion = require("../models/Inscripcion");
const verificarToken = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

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

        const misCursos = inscripciones.map(inscripcion => {
            if (!inscripcion.curso) return null;
            const cursoObj = inscripcion.curso.toObject();
            cursoObj.modulosCompletados = inscripcion.modulosCompletados || [];
            cursoObj.estadoCertificado = inscripcion.estadoCertificado || 'no_solicitado';
            cursoObj.fechaAprobacionCertificado = inscripcion.fechaAprobacionCertificado || null;
            return cursoObj;
        }).filter(Boolean);
        
        res.json(misCursos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener tus cursos", error });
    }
});

// Actualizar el perfil del usuario autenticado
router.put("/perfil", verificarToken, async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        // Si se cambia el email, verificar que no esté en uso por otro
        if (email && email !== usuario.email) {
            const existeEmail = await Usuario.findOne({ email });
            if (existeEmail) {
                return res.status(400).json({ mensaje: "El correo electrónico ya está en uso" });
            }
            usuario.email = email;
        }

        if (nombre) usuario.nombre = nombre;

        // Si se proporciona contraseña, hashearla y actualizarla
        if (password && password.trim() !== "") {
            usuario.password = await bcrypt.hash(password, 10);
        }

        await usuario.save();
        
        const usuarioActualizado = usuario.toObject();
        delete usuarioActualizado.password;
        
        res.json({ mensaje: "Perfil actualizado con éxito", usuario: usuarioActualizado });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ mensaje: "Error al actualizar el perfil", error });
    }
});

module.exports = router;
