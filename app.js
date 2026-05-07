const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./src/routes/auth.routes");
const productoRoutes = require("./src/routes/producto.routes");

const app = express();

// 🔥 CORS (ojo luego te explico producción)
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://apidev.gruecolimp.com"
    ],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

/* =========================
   🔥 RUTA PRINCIPAL API
   ========================= */
app.get("/", (req, res) => {
    res.json({
        message: "API funcionando correctamente 🚀"
    });
});

/* =========================
   RUTAS DEL SISTEMA
   ========================= */
app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);

module.exports = app;