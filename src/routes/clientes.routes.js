const router = require("express").Router();

const controller = require("../controllers/clientes.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// TODOS (ADMIN y USER)
router.get("/", auth, controller.obtenerClientes);
router.get("/:id", auth, controller.obtenerClienteById);

// SOLO ADMIN
router.post("/", auth, role("ADMIN"), controller.crearCliente);
router.put("/:id", auth, role("ADMIN"), controller.actualizarCliente);
router.delete("/:id", auth, role("ADMIN"), controller.eliminarCliente);

module.exports = router;