const router = require("express").Router();
const controller = require("../controllers/alertas.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.obtenerAlertas);

module.exports = router;