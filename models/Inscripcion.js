const mongoose = require("mongoose");

const inscripcionSchema = new mongoose.Schema({
    estudiante: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    curso: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso', 
        required: true 
    },
    fechaInscripcion: { 
        type: Date, 
        default: Date.now 
    },
    modulosCompletados: [{
        type: mongoose.Schema.Types.ObjectId
    }]
}, { timestamps: true });

// Evitar que un estudiante se inscriba dos veces al mismo curso
inscripcionSchema.index({ estudiante: 1, curso: 1 }, { unique: true });

module.exports = mongoose.model("Inscripcion", inscripcionSchema);
