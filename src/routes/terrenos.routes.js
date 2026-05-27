const router = require("express").Router();

const controller = require("../controllers/terrenos.controller");

const auth = require("../middleware/auth.middleware");

// 🌎 OBTENER TERRENOS
router.get("/", auth, controller.obtenerTerrenos);

module.exports = router;