const router = require("express").Router();
const controller = require("../controllers/cultivos.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.obtenerCultivos);

module.exports = router;