const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/roleMiddleware");

// Aplica los middlewares a todas las rutas de este archivo
router.use(verificarToken);
router.use(verificarRol(['administrador']));

// Obtener todos los usuarios
router.get("/usuarios", async (req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password");
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener usuarios", error });
    }
});

// Actualizar rol de un usuario (u otra info)
router.put("/usuarios/:id", async (req, res) => {
    try {
        const { rol } = req.body;
        // Solo actualizamos el rol por simplicidad, o permitimos mas campos si se envían
        const camposValidos = {};
        if (rol) camposValidos.rol = rol;

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id,
            { $set: camposValidos },
            { new: true }
        ).select("-password");

        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        res.json(usuarioActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar usuario", error });
    }
});

// Eliminar un usuario
router.delete("/usuarios/:id", async (req, res) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!usuarioEliminado) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }
        res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar usuario", error });
    }
});

module.exports = router;
