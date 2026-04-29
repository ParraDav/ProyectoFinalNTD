const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Middleware
app.use(express.json());
app.use(cors()); 

app.get("/", (req, res) => {
    res.send("API funcionando correctamente 🚀");
});

// Rutas
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cursos", require("./routes/cursoRoutes"));
app.use("/api/usuarios", require("./routes/usuarioRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Conexion con MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Conectado a MongoDB");

    app.listen(process.env.PORT || 3000, () => {
        console.log("Servidor corriendo en puerto " + (process.env.PORT || 3000));
    });
})
.catch(err => console.log(err));