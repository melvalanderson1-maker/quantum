require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const app = require("./app");
const pool = require("./src/config/db");

const PORT = 3000;

const server = http.createServer(app);

server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;

// ======================================================
// SOCKET IO
// ======================================================

const io = new Server(server, {

    cors: {
        origin: [
            "https://quantum.gruecolimp.com",

           
        ],
        methods: ["GET", "POST"],
        credentials: true
    },

    transports: ["websocket"]

});

app.set("io", io);

app.set("trust proxy", 1);

// ======================================================
// 🔐 SOCKET AUTH MIDDLEWARE
// ======================================================

io.use((socket, next) => {

    try {

        // =========================================
        // LEER COOKIES
        // =========================================

        const cookies = cookie.parse(
            socket.handshake.headers.cookie || ""
        );

        // =========================================
        // TOKEN
        // =========================================

        const token = cookies.token;

        if (!token) {

            console.log("❌ SOCKET SIN TOKEN");

            return next(
                new Error("Unauthorized")
            );

        }

        // =========================================
        // VALIDAR JWT
        // =========================================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // =========================================
        // GUARDAR USER
        // =========================================

        socket.user = decoded;

        console.log(
            "✅ SOCKET AUTH:",
            decoded.id
        );

        next();

    } catch (error) {

        console.log("❌ SOCKET TOKEN INVALIDO");

        return next(
            new Error("Invalid token")
        );

    }

});

// ======================================================
// CONNECTION
// ======================================================

io.on("connection", (socket) => {

    console.log(
        "🟢 usuario conectado:",
        socket.user.id
    );

    // ==================================================
    // ROOM USER
    // ==================================================

    socket.on("join_user_room", (userId) => {

        console.log("JWT USER:", socket.user.id);

        console.log("ROOM USER:", userId);

        if (
            Number(socket.user.id) !== Number(userId)
        ) {

            console.log("❌ ROOM NO AUTORIZADA");

            return;

        }

        socket.join(`user_${userId}`);

    });

    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on("disconnect", (reason) => {

        console.log(
            `🔴 usuario desconectado ${socket.user.id}`
        );

        console.log("RAZON:", reason);

    });

});

// ======================================================
// START SERVER
// ======================================================

async function iniciarServidor() {

    try {

        console.log("🔌 Probando conexión MySQL...");

        const connection = await pool.getConnection();

        console.log("✅ MYSQL CONECTADO CORRECTAMENTE");

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