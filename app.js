const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./src/routes/auth.routes");
const productoRoutes = require("./src/routes/producto.routes");
const clientesRoutes = require("./src/routes/clientes.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");
const compression = require("compression");
const analyticsRoutes = require("./src/routes/analytics.routes");


const dashboardRoutes = require("./src/routes/dashboard.routes");

const sensoresRoutes = require("./src/routes/sensores.routes");

const terrenosRoutes = require("./src/routes/terrenos.routes");

const filtrosRoutes = require("./src/routes/filtros.routes");



const app = express();


app.use(compression());
const helmet = require("helmet");





app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://quantum.gruecolimp.com"
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


app.use("/api/dashboard", dashboardRoutes);

app.use("/api/sensores", sensoresRoutes);


app.use("/api/terrenos", terrenosRoutes);

app.use("/api/filtros", filtrosRoutes);

module.exports = app;