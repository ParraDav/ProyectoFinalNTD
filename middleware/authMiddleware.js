const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    let token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ mensaje: "Token requerido" });
    }

    // Remover el prefijo 'Bearer ' si está presente
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({ mensaje: "Token inválido" });
    }
};

module.exports = verificarToken;