require("dotenv").config();


const app = require("./app");
const pool = require("./src/config/db");

// =====================================================
// PUERTO API
// =====================================================

const PORT = 3000;

// =====================================================
// INICIAR SERVIDOR
// =====================================================

async function iniciarServidor() {

    try {

        console.log("🔌 Probando conexión MySQL...");

        // =====================================================
        // TEST CONEXIÓN
        // =====================================================

        const connection = await pool.getConnection();

        console.log("✅ MYSQL CONECTADO CORRECTAMENTE");

        // =====================================================
        // QUERY TEST
        // =====================================================

        const [rows] = await connection.query(
            "SELECT NOW() AS fecha"
        );

        console.log("🕒 Hora MySQL:");
        console.log(rows[0].fecha);

        // =====================================================
        // LIBERAR CONEXIÓN
        // =====================================================

        connection.release();

        console.log("🔒 Conexión liberada");

        // =====================================================
        // LEVANTAR EXPRESS
        // =====================================================

        app.listen(PORT, () => {

            console.log("=================================");
            console.log(`🚀 API corriendo en puerto ${PORT}`);
            console.log(`🌐 http://localhost:${PORT}`);
            console.log("=================================");

        });

    } catch (error) {

        console.log("❌ ERROR MYSQL");
        console.log(error);

    }

}

iniciarServidor();