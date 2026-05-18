const pool = require("../config/db");

// ======================================================
// BUILDER FILTROS
// ======================================================

const construirFiltros = (query) => {

    const {
        acuerdo_marco,
        anio,
        mes,
        dia,
        proveedor
    } = query;

    let where = [];
    let params = [];

    // =========================================
    // ACUERDO
    // =========================================

    if (acuerdo_marco) {

        where.push(`
            acuerdo_marco = ?
        `);

        params.push(acuerdo_marco);
    }

    // =========================================
    // AÑO
    // =========================================

    if (anio) {

        where.push(`
            YEAR(fecha_aceptacion) = ?
        `);

        params.push(anio);
    }

    // =========================================
    // MES
    // =========================================

    if (mes) {

        where.push(`
            MONTH(fecha_aceptacion) = ?
        `);

        params.push(mes);
    }

    // =========================================
    // DIA
    // =========================================

    if (dia) {

        where.push(`
            DAY(fecha_aceptacion) = ?
        `);

        params.push(dia);
    }

    // =========================================
    // PROVEEDOR
    // =========================================

    if (proveedor) {

        where.push(`
            razon_social_proveedor = ?
        `);

        params.push(proveedor);
    }

    const whereSQL =
        where.length > 0
            ? `WHERE ${where.join(" AND ")}`
            : "";

    return {
        whereSQL,
        params
    };
};

// ======================================================
// RESUMEN
// ======================================================

exports.obtenerResumen = async (req, res) => {

    try {

        const {
            whereSQL,
            params
        } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT

                COUNT(*) AS registros,

                COUNT(DISTINCT orden_electronica)
                AS ordenes,

                ROUND(
                    SUM(monto_total_entrega),
                    2
                ) AS ventas,

                COUNT(DISTINCT ruc_entidad)
                AS entidades,

                COUNT(DISTINCT marca_ficha_producto)
                AS marcas

            FROM ordenes_electronicas

            ${whereSQL}
        `, params);

        res.json(rows[0]);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_RESUMEN"
        });
    }
};

// ======================================================
// PROVEEDORES + SUBTOTAL
// ======================================================

exports.proveedoresTotales = async (req, res) => {

    try {

        const {
            whereSQL,
            params
        } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT

                razon_social_proveedor
                AS proveedor,

                ROUND(
                    SUM(monto_total_entrega),
                    2
                ) AS subtotal,

                COUNT(DISTINCT orden_electronica)
                AS ordenes

            FROM ordenes_electronicas

            ${whereSQL}

            GROUP BY razon_social_proveedor

            ORDER BY subtotal DESC

            LIMIT 100
        `, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_PROVEEDORES"
        });
    }
};

// ======================================================
// ACUERDOS
// ======================================================

exports.obtenerAcuerdos = async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT DISTINCT acuerdo_marco

            FROM ordenes_electronicas

            WHERE acuerdo_marco IS NOT NULL
            AND acuerdo_marco <> ''

            ORDER BY acuerdo_marco ASC
        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_ACUERDOS"
        });
    }
};

// ======================================================
// AÑOS
// ======================================================

exports.obtenerAnios = async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT DISTINCT
                YEAR(fecha_aceptacion)
                AS anio

            FROM ordenes_electronicas

            WHERE fecha_aceptacion
            IS NOT NULL

            ORDER BY anio DESC
        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_ANIOS"
        });
    }
};

// ======================================================
// MESES
// ======================================================

exports.obtenerMeses = async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT DISTINCT
                MONTH(fecha_aceptacion)
                AS mes

            FROM ordenes_electronicas

            WHERE fecha_aceptacion
            IS NOT NULL

            ORDER BY mes ASC
        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_MESES"
        });
    }
};