const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Crear curso
router.post("/", verificarToken, async (req, res) => {
    const curso = new Curso(req.body);
    await curso.save();
    res.json(curso);
});

// Obtener cursos
router.get("/", verificarToken, async (req, res) => {
    const cursos = await Curso.find();
    res.json(cursos);
});

// Actualizar curso
router.put("/:id", verificarToken, async (req, res) => {
    const curso = await Curso.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(curso);
});

// Eliminar curso
router.delete("/:id", verificarToken, async (req, res) => {
    await Curso.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Curso eliminado" });
});

module.exports = router;