const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//crear curso
router.post("/", async (req, res) => {
    const curso = new Curso(req.body);
    await curso.save();
    res.json(curso);
});