const express = require("express");

const router = express.Router();

const filtrosController = require("../controllers/filtros.controller");

/* =========================================
   INDICADORES
========================================= */

router.get(
    "/indicadores",
    filtrosController.obtenerIndicadores
);

/* =========================================
   DEPARTAMENTOS
========================================= */

router.get(
    "/departamentos",
    filtrosController.obtenerDepartamentos
);

/* =========================================
   PROVINCIAS
========================================= */

router.get(
    "/provincias",
    filtrosController.obtenerProvincias
);

/* =========================================
   DISTRITOS
========================================= */

router.get(
    "/distritos",
    filtrosController.obtenerDistritos
);



/* =========================================
   CLIENTES
========================================= */

router.get(
    "/clientes",
    filtrosController.obtenerClientes
);


module.exports = router;