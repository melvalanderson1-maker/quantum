const router = require("express").Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// 🔥 IMPORTANTE: TE FALTABA ESTO
const authController = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");


// ======================
// LOGIN
// ======================
router.post("/login", authController.login);

router.get(
    "/me",
    authMiddleware,
    async (req, res) => {

        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE id = ?",
            [req.usuario.id]
        );

        const user = rows[0];

        const [permisosRows] = await pool.query(`
            SELECT p.codigo
            FROM usuario_permisos up
            INNER JOIN permisos p
                ON p.id = up.permiso_id
            WHERE up.usuario_id = ?
        `, [user.id]);

        const permisos = permisosRows.map(
            p => p.codigo
        );

        return res.json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            permisos
        });

    }
);


router.post("/logout", async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.sendStatus(401);

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        await pool.query(
            `UPDATE sessions 
             SET revoked = TRUE 
             WHERE user_id = ? AND revoked = FALSE`,
            [payload.id]
        );
    } catch (err) {
        // token inválido o expirado, igual limpiamos cookies
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken");

    return res.json({ ok: true });
});
// ======================
// REFRESH TOKEN PRO
// ======================
// ======================
// REFRESH TOKEN
// ======================
router.post("/refresh", authController.refresh);
module.exports = router;