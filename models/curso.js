const mongoose = require("mongose");

const cursoSchema =  mongoose.Schema({
    nombre: { type: "String", required: true },
    descripcion: { type: String, required: true }
});

module.exports = mongoose.model("Curso", cursoSchema);