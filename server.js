const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
// Middleware
app.use(express.json());
app.use(cors()); 

// Rutas
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cursos", require("./routes/cursoRoutes"));

//Conexion con MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Conectado a MongoDB");

    app.listen(process.env.PORT, () => {
        console.log("Servidor corriendo en puerto " + process.env.PORT);
    });
})
.catch(err => console.log(err));