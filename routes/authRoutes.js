const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Registro
router.post("/register", async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        const hash = await bcrypt.hash(password, 10);

        const user = new Usuario({
            nombre,
            email,
            password: hash,
            rol: rol || 'estudiante'
        });

        await user.save();
        res.json({ mensaje: "Usuario registrado" });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Usuario.findOne({ email });

        if (!user) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: user._id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token, rol: user.rol });

    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
});

module.exports = router;