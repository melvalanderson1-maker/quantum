const pool = require("../config/db");

// ==============================
// RESUMEN POR ACUERDO + CATÁLOGO
// ==============================

exports.obtenerResumen = async (req, res) => {
    try {

        const { acuerdo_marco, catalogo } = req.query;

        let where = "WHERE 1=1";

        if (acuerdo_marco)
            where += ` AND acuerdo_marco = '${acuerdo_marco}'`;

        if (catalogo)
            where += ` AND catalogo = '${catalogo}'`;

        const [[data]] = await pool.query(`
            SELECT
                acuerdo_marco,
                catalogo,

                COUNT(DISTINCT orden_electronica) AS ordenes,

                SUM(monto_total_entrega) AS total_ventas,

                COUNT(DISTINCT descripcion_ficha_producto) AS productos,

                COUNT(DISTINCT marca_ficha_producto) AS marcas

            FROM ordenes_electronicas
            ${where}
            GROUP BY acuerdo_marco, catalogo
        `);

        res.json(data);

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "error resumen" });
    }
};

// ==============================
// PRODUCTOS (FICHA + PRECIO)
// ==============================

exports.productosTop = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                descripcion_ficha_producto AS producto,
                marca_ficha_producto AS marca,
                precio_unitario AS precio,

                SUM(cantidad_entrega) AS cantidad,

                SUM(monto_total_entrega) AS total

            FROM ordenes_electronicas
            GROUP BY producto, marca, precio
            ORDER BY total DESC
            LIMIT 15
        `);

        res.json(rows);

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "error productos" });
    }
};

// ==============================
// VENTAS POR CATÁLOGO + ACUERDO
// ==============================

exports.ventasPorSegmento = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT
                acuerdo_marco,
                catalogo,

                SUM(monto_total_entrega) AS ventas

            FROM ordenes_electronicas
            GROUP BY acuerdo_marco, catalogo
            ORDER BY ventas DESC
        `);

        res.json(rows);

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "error segmento" });
    }
};