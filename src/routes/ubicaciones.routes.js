const router = require("express").Router();
const controller = require("../controllers/ubicaciones.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.obtenerUbicaciones);

module.exports = router;