const jwt = require("jwt");

const verificarToken = (req, res) => {
    const token = req.headers["Authorization"];

    if (!token) {
        return res.status(401).json({ mensaje: "Token requerido" });
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