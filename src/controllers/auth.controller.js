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
    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict"
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
    });
};