const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Orígenes permitidos — agrega los que necesites
const allowedOrigins = [
    "http://localhost:4200",        // Angular dev
    "http://localhost:4000",        // Angular alt
    process.env.FRONTEND_URL        // Producción (ponlo en .env)
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (Postman, curl, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS bloqueado para origen: ${origin}`));
        }
    },
    credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API funcionando correctamente 🚀");
});

// Rutas
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cursos", require("./routes/cursoRoutes"));
app.use("/api/usuarios", require("./routes/usuarioRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/metricas", require("./routes/metricasRoutes"));

// Conexión con MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Conectado a MongoDB");
        app.listen(process.env.PORT || 3000, () => {
            console.log("Servidor corriendo en puerto " + (process.env.PORT || 3000));
        });
    })
    .catch(err => console.log(err));