const router = require("express").Router();
const controller = require("../controllers/analytics.controller");
const auth = require("../middleware/auth.middleware");

// =========================
// NUEVAS RUTAS BI
// =========================

router.get("/resumen", auth, controller.obtenerResumen);

router.get("/productos-top", auth, controller.productosTop);

router.get("/ventas-segmento", auth, controller.ventasPorSegmento);

module.exports = router;