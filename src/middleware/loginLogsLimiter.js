const pool = require("../config/db");

const cache = new Map(); // IP + email temporal

async function canLog(ip, email) {
    const key = `${ip}_${email}`;
    const now = Date.now();

    const last = cache.get(key);

    // 🔥 si ya logueó en los últimos 30 segundos, NO insertes
    if (last && now - last < 30 * 1000) {
        return false;
    }

    cache.set(key, now);
    return true;
}

module.exports = { canLog };