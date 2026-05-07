const router = require("express").Router();

const controller = require("../controllers/producto.controller");

const auth = require("../middleware/auth.middleware");

const role = require("../middleware/role.middleware");

router.get(
    "/",
    auth,
    controller.obtenerProductos
);

router.post(
    "/",
    auth,
    role("ADMIN"),
    controller.crearProducto
);

module.exports = router;