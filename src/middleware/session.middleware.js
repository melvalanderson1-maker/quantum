const pool = require("../config/db");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "No autorizado" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔥 VALIDAR SESIÓN ACTIVA
        const [sessions] = await pool.query(
            `SELECT * FROM sessions 
             WHERE user_id = ? 
             AND revoked = FALSE 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [decoded.id]
        );

        if (sessions.length === 0) {
            return res.status(401).json({ message: "Sesión inválida" });
        }

        // 🔥 actualizar last_used
        await pool.query(
            `UPDATE sessions SET last_used = NOW() WHERE id = ?`,
            [sessions[0].id]
        );

        req.user = decoded;
        req.session = sessions[0];

        next();

    } catch (err) {
        return res.status(401).json({ message: "Token inválido" });
    }
};