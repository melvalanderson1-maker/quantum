const router = require("express").Router();

const controller = require("../controllers/sensores.controller");
const auth = require("../middleware/auth.middleware");

// 🔐 protegido como analytics
router.get("/", auth, controller.obtenerSensores);

module.exports = router;