const mongoose = require("mongoose");

const cursoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true }
});

module.exports = mongoose.model("Curso", cursoSchema);