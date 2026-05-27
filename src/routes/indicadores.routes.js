const router = require("express").Router();
const controller = require("../controllers/indicadores.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.obtenerIndicadores);

module.exports = router;