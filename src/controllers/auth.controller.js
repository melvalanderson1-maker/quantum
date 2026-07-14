const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { checkBruteForce } = require("../middleware/bruteforce.middleware");
const { canLog } = require("../middleware/loginLogsLimiter");

exports.login = async (req, res) => {

    const { email, password } = req.body;

    let ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";

    ip = ip.replace("::ffff:", "");

    const userAgent = req.headers["user-agent"];

    console.log("LOGIN IP FINAL:", ip);

    // 🔐 BLOQUEO BRUTE FORCE
    const allowed = await checkBruteForce(ip, email);

    if (!allowed) {
        return res.status(429).json({
            message: "Demasiados intentos, bloqueado 1 min"
        });
    }

    // =========================
    // 1. BUSCAR USUARIO
    // =========================
    const [rows] = await pool.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [email]
    );

    if (rows.length === 0) {

        // 🔥 registrar ataque/spam controlado
        if (await canLog(ip, email)) {

            await pool.query(
                `INSERT INTO security_events
                (ip, email, event_type, details)
                VALUES (?, ?, 'FAILED_UNKNOWN_USER', 'Usuario no existe')`,
                [ip, email]
            );

        }

        return res.status(401).json({
            message: "Credenciales inválidas"
        });
    }

    const user = rows[0];


    // =========================
    // PERMISOS USUARIO
    // =========================

    const [permisosRows] = await pool.query(`
        SELECT p.codigo
        FROM usuario_permisos up
        INNER JOIN permisos p
            ON p.id = up.permiso_id
        WHERE up.usuario_id = ?
    `, [user.id]);

    const permisos = permisosRows.map(p => p.codigo);

    // =========================
    // 2. PASSWORD
    // =========================
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {

        // 🔥 intento fallido normal
        await pool.query(
            `INSERT INTO login_attempts 
            (ip, email, attempts, last_attempt)
            VALUES (?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
            attempts = attempts + 1,
            last_attempt = NOW()`,
            [ip, email]
        );

        // 🔥 registrar evento seguridad SOLO rate-limited
        if (await canLog(ip, email)) {

            await pool.query(
                `INSERT INTO security_events
                (ip, email, event_type, details)
                VALUES (?, ?, 'FAILED_PASSWORD', 'Password incorrecto')`,
                [ip, email]
            );

        }

        return res.status(401).json({
            message: "Credenciales inválidas"
        });
    }

    // =========================
    // RESET INTENTOS
    // =========================
    await pool.query(
        "DELETE FROM login_attempts WHERE ip = ? AND email = ?",
        [ip, email]
    );

    // =========================
    // TOKENS
    // =========================
    const token = jwt.sign(
        { id: user.id, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );


    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // =========================
    // LOG SUCCESS
    // =========================
    await pool.query(
        `INSERT INTO login_logs (user_id, ip, status, user_agent)
        VALUES (?, ?, 'SUCCESS', ?)`,
        [user.id, ip, userAgent]
    );

    // =========================
    // 🔥 SESSION SYSTEM (BANCO REAL)
    // =========================

    // 🔥 REVOCAR TODAS LAS SESIONES (LOGIN SOLO 1 DISPOSITIVO = BANCO STYLE)
    await pool.query(
        "UPDATE sessions SET revoked = TRUE WHERE user_id = ?",
        [user.id]
    );

    // 🔥 CREAR NUEVA SESIÓN SEGURA
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
        VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), FALSE)`,
        [
            sessionId,
            user.id,
            hashedRefreshToken,
            ip,
            userAgent
        ]
    );

    // =========================
    // RESPUESTA SEGURA
    // =========================
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    return res.json({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        permisos
    });
};


exports.refresh = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "No hay sesión" });
    }

    let payload;

    try {
        payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        return res.status(401).json({ message: "Sesión expirada" });
    }

    const [sessionsRows] = await pool.query(
        `SELECT * FROM sessions
         WHERE user_id = ? AND revoked = FALSE AND expires_at > NOW()
         ORDER BY expires_at DESC LIMIT 1`,
        [payload.id]
    );

    if (sessionsRows.length === 0) {
        return res.status(401).json({ message: "Sesión revocada o expirada" });
    }

    const session = sessionsRows[0];

    const matches = await bcrypt.compare(refreshToken, session.refresh_token_hash);

    if (!matches) {
        return res.status(401).json({ message: "Token inválido" });
    }

    const [userRows] = await pool.query(
        "SELECT * FROM usuarios WHERE id = ?",
        [payload.id]
    );

    if (userRows.length === 0) {
        return res.status(401).json({ message: "Usuario no existe" });
    }

    const user = userRows[0];

    const newToken = jwt.sign(
        { id: user.id, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", newToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    });

    return res.json({ ok: true });
};