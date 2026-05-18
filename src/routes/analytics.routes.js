const router = require("express").Router();

const controller = require("../controllers/analytics.controller");

const auth = require("../middleware/auth.middleware");

// ======================================================
// KPIS
// ======================================================

router.get(
    "/resumen",
    auth,
    controller.obtenerResumen
);

router.get(
    "/proveedores",
    auth,
    controller.proveedoresTotales
);

// ======================================================
// FILTROS
// ======================================================

router.get(
    "/acuerdos",
    auth,
    controller.obtenerAcuerdos
);

router.get(
    "/anios",
    auth,
    controller.obtenerAnios
);

router.get(
    "/meses",
    auth,
    controller.obtenerMeses
);

module.exports = router;