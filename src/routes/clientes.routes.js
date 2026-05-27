const router = require("express").Router();
const controller = require("../controllers/clientes.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.obtenerClientes);
router.get("/:id", auth, controller.obtenerCliente);
router.post("/", auth, controller.crearCliente);
router.put("/:id", auth, controller.actualizarCliente);
router.delete("/:id", auth, controller.eliminarCliente);

module.exports = router;