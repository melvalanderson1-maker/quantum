const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./src/routes/auth.routes");
const productoRoutes = require("./src/routes/producto.routes");
const clientesRoutes = require("./src/routes/clientes.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");

const analyticsRoutes = require("./src/routes/analytics.routes");

const app = express();

const helmet = require("helmet");



app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://fygradev.gruecolimp.com"
    ],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);



const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Demasiados intentos, intenta más tarde"
});

app.get("/", (req, res) => {
    res.json({
        message: "API POWER funcionando correctamente ",
        status: "OK"
    });
});
// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.use("/api/analytics", analyticsRoutes);

module.exports = app;