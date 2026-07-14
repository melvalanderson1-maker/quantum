// routes/lecturas.router.js
const router = require("express").Router();
const ctrl   = require("../controllers/lecturas.controller");
const auth   = require("../middleware/auth.middleware");

// GET /api/lecturas?nodo_id=5&dias=30
router.get("/", auth, ctrl.lecturasPorNodo);

// GET /api/lecturas/terreno?terreno_id=3&dias=30
router.get("/terreno", auth, ctrl.lecturasPorTerreno);

module.exports = router;