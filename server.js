const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

app.use(express.json());

app.listen(3000, () => {
    console.log("Servidor corriendo");
});
mongoose.connect(process.env.MONGO_URI).then(() => console.log("Conectado a MongoDB"))