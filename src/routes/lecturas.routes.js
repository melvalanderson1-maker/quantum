const router = require("express").Router();

const controller = require("../controllers/lecturas.controller");
const auth = require("../middleware/auth.middleware");

// 📊 GRÁFICO HUMEDAD
router.get("/grafico-humedad", auth, controller.graficoHumedad);

// 🌡 GRÁFICO TEMPERATURA
router.get("/grafico-temperatura", auth, controller.graficoTemperatura);

module.exports = router;