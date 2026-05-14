const router = require("express").Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// 🔥 IMPORTANTE: TE FALTABA ESTO
const authController = require("../controllers/auth.controller");


// ======================
// LOGIN
// ======================
router.post("/login", authController.login);


router.post("/logout", async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.sendStatus(401);

    // 🔥 revocar sesión real
    await pool.query(
        `UPDATE sessions 
         SET revoked = TRUE 
         WHERE revoked = FALSE`
    );

    res.clearCookie("token");
    res.clearCookie("refreshToken");

    return res.json({ ok: true });
});
// ======================
// REFRESH TOKEN PRO
// ======================
router.post("/refresh", async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.sendStatus(401);
    }

    try {

        // =========================
        // VERIFICAR JWT
        // =========================
        const payload = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // =========================
        // BUSCAR SESIONES ACTIVAS
        // =========================
        const [sessions] = await pool.query(
            `SELECT * FROM sessions
             WHERE user_id = ?
             AND revoked = FALSE
             AND expires_at > NOW()`,
            [payload.id]
        );

        // =========================
        // VERIFICAR HASH
        // =========================
        let validSession = null;

        for (const session of sessions) {

            const valid = await require("bcryptjs").compare(
                refreshToken,
                session.refresh_token_hash
            );

            if (valid) {
                validSession = session;
                break;
            }
        }

        if (!validSession) {
            return res.sendStatus(403);
        }

        // =========================
        // 🔥 ROTATION
        // =========================

        // REVOCAR TOKEN VIEJO
        await pool.query(
            `UPDATE sessions
             SET revoked = TRUE
             WHERE id = ?`,
            [validSession.id]
        );

        // NUEVO ACCESS TOKEN
        const newAccessToken = jwt.sign(
            { id: payload.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // NUEVO REFRESH TOKEN
        const newRefreshToken = jwt.sign(
            { id: payload.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // HASH NUEVO
        const hashedRefreshToken = await require("bcryptjs").hash(
            newRefreshToken,
            10
        );

        // NUEVA SESSION
        const sessionId = require("crypto").randomUUID();

        await pool.query(
            `INSERT INTO sessions
            (
                id,
                user_id,
                refresh_token_hash,
                ip,
                user_agent,
                expires_at,
                revoked
            )
            VALUES
            (
                ?, ?, ?, ?, ?,
                DATE_ADD(NOW(), INTERVAL 7 DAY),
                FALSE
            )`,
            [
                sessionId,
                payload.id,
                hashedRefreshToken,
                req.ip,
                req.headers["user-agent"]
            ]
        );

        // =========================
        // COOKIES NUEVAS
        // =========================

        res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            ok: true
        });

    } catch (err) {

        return res.sendStatus(403);

    }
});
module.exports = router;