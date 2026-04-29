const express = require("express");
const router = express.Router();
const Curso = require("../models/curso");
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
    const cursos = await Curso.find();
    res.json(cursos);
});

// Actualizar curso
router.put("/:id", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    const curso = await Curso.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(curso);
});

// Eliminar curso
router.delete("/:id", verificarToken, verificarRol(['instructor', 'administrador']), async (req, res) => {
    await Curso.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Curso eliminado" });
});

module.exports = router;