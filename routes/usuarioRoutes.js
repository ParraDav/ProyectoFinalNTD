const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
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

module.exports = router;
