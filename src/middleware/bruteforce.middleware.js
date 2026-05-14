const pool = require("../config/db");

const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 1 * 60 * 1000; // 1 minuto

async function checkBruteForce(ip, email) {

    const [rows] = await pool.query(
        `SELECT * FROM login_attempts
         WHERE ip = ? AND email = ?`,
        [ip, email]
    );

    // =========================
    // 1. NO HAY REGISTRO → OK
    // =========================
    if (rows.length === 0) {
        return true;
    }

    const attempt = rows[0];

    const lastTime = new Date(attempt.last_attempt).getTime();
    const now = Date.now();

    const diff = now - lastTime;

    // =========================
    // 2. SI YA PASÓ EL BLOQUEO → RESET
    // =========================
    if (diff > BLOCK_TIME) {

        await pool.query(
            `UPDATE login_attempts
            SET attempts = 0,
                last_attempt = NOW()
            WHERE ip = ? AND email = ?`,
            [ip, email]
        );
        return true;
    }

    // =========================
    // 3. SI AÚN ESTÁ DENTRO DEL TIEMPO Y YA LLEGÓ AL MÁXIMO → BLOQUEO
    // =========================
    if (attempt.attempts >= MAX_ATTEMPTS) {
        return false;
    }

    return true;
}

module.exports = { checkBruteForce };