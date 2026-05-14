require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const pool = require("./src/config/db");

const PORT = 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 Usuario desconectado:", socket.id);
    });
});

async function iniciarServidor() {

    try {

        console.log("🔌 Probando conexión MySQL...");

        const connection = await pool.getConnection();

        console.log("✅ MYSQL CONECTADO CORRECTAMENTE");

        const [rows] = await connection.query("SELECT NOW() AS fecha");

        console.log("🕒 Hora MySQL:");
        console.log(rows[0].fecha);

        connection.release();

        server.listen(PORT, () => {

            console.log("=================================");
            console.log(`🚀 API + SOCKET.IO en puerto ${PORT}`);
            console.log(`🌐 http://localhost:${PORT}`);
            console.log("=================================");

        });

    } catch (error) {
        console.log("❌ ERROR MYSQL");
        console.log(error);
    }
}

iniciarServidor();