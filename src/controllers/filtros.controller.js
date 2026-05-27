const pool = require("../config/db");

/* =========================================
   INDICADORES
========================================= */

exports.obtenerIndicadores = async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT
                id,
                codigo,
                nombre
            FROM indicadores
            WHERE activo = 1
            ORDER BY nombre ASC

        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error obteniendo indicadores"
        });
    }
};

/* =========================================
   DEPARTAMENTOS
========================================= */

exports.obtenerDepartamentos = async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT
                id,
                nombre
            FROM departamentos
            ORDER BY nombre ASC

        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error obteniendo departamentos"
        });
    }
};

/* =========================================
   PROVINCIAS
========================================= */

exports.obtenerProvincias = async (req, res) => {

    try {

        const departamentoId = req.query.departamento_id;

        const [rows] = await pool.query(`

            SELECT
                id,
                nombre
            FROM provincias
            WHERE departamento_id = ?
            ORDER BY nombre ASC

        `, [departamentoId]);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error obteniendo provincias"
        });
    }
};

/* =========================================
   DISTRITOS
========================================= */

exports.obtenerDistritos = async (req, res) => {

    try {

        const provinciaId = req.query.provincia_id;

        const [rows] = await pool.query(`

            SELECT
                id,
                nombre
            FROM distritos
            WHERE provincia_id = ?
            ORDER BY nombre ASC

        `, [provinciaId]);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error obteniendo distritos"
        });
    }
};


/* =========================================
   CLIENTES
========================================= */

exports.obtenerClientes = async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT
                id,
                nombre
            FROM clientes
            ORDER BY nombre ASC

        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error obteniendo clientes"
        });
    }
};