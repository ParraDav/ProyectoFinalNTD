const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Registro
router.post("/register", async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        const hash = await bcrypt.hash(password, 10);

        const user = new Usuario({
            nombre,
            email,
            password: hash
        });

        await user.save();
        res.json({ mensaje: "Usuario registrado" });

    } catch (error) {
        res.status(500).json(error);
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("EMAIL:", email);
        console.log("PASSWORD:", password);

        const user = await Usuario.findOne({ email });
        console.log("USER:", user);

        if (!user) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        console.log("PASSWORD BD:", user.password);

        const valid = await bcrypt.compare(password, user.password);
        console.log("VALID:", valid);

        if (!valid) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });

    } catch (error) {
        console.log("ERROR LOGIN:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
});

module.exports = router;