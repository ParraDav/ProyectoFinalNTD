const mongoose = require("mongoose");

const moduloSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    contenido: { type: String, required: true }
});

const cursoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    instructor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['borrador', 'publicado'], 
        default: 'borrador' 
    },
    modulos: [moduloSchema]
}, { timestamps: true });

module.exports = mongoose.model("Curso", cursoSchema);