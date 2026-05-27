const router = require("express").Router();
const controller = require("../controllers/quantum.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.obtenerEstadoQuantum);

module.exports = router;