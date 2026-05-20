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
        proveedor,
        entidad,
        categoria,
        departamento,
        provincia,
        distrito,
        nro_parte
    } = query;

    let where = [];
    let params = [];

    // =========================
    // ACUERDO
    // =========================
    if (acuerdo_marco) {
        where.push(`oe.acuerdo_marco = ?`);
        params.push(acuerdo_marco);
    }

    // =========================
    // AÑO
    // =========================
    if (anio) {
        where.push(`YEAR(oe.fecha_aceptacion) = ?`);
        params.push(anio);
    }

    // =========================
    // MES
    // =========================
    if (mes) {
        where.push(`MONTH(oe.fecha_aceptacion) = ?`);
        params.push(mes);
    }

    // =========================
    // DIA
    // =========================
    if (dia) {
        where.push(`DAY(oe.fecha_aceptacion) = ?`);
        params.push(dia);
    }

    // =========================
    // PROVEEDOR
    // =========================
    if (proveedor) {
        where.push(`oe.razon_social_proveedor = ?`);
        params.push(proveedor);
    }

    // =========================
    // ENTIDAD (NUEVO)
    // =========================
    if (entidad) {
        where.push(`oe.razon_social_entidad = ?`);
        params.push(entidad);
    }

    // =========================
    // CATEGORIA (NUEVO)
    // =========================
    if (categoria) {
        where.push(`oe.categoria = ?`);
        params.push(categoria);
    }

    // =========================
    // DEPARTAMENTO (NUEVO)
    // =========================
    if (departamento) {
        where.push(`oe.dep_entrega = ?`);
        params.push(departamento);
    }

    // =========================
    // PROVINCIA (NUEVO)
    // =========================
    if (provincia) {
        where.push(`oe.prov_entrega = ?`);
        params.push(provincia);
    }

    // =========================
    // DISTRITO (NUEVO)
    // =========================
    if (distrito) {
        where.push(`oe.dist_entrega = ?`);
        params.push(distrito);
    }

    // =========================
    // NRO PARTE
    // =========================

    if (nro_parte) {

        const nroParteLimpio = nro_parte
            .trim()
            .replace(/\s+/g, "")
            .replace(/-/g, "")
            .toUpperCase();

        where.push(`oe.nro_parte_clean = ?`);

        params.push(nroParteLimpio);
    }

    const whereSQL =
        where.length > 0
            ? `WHERE ${where.join(" AND ")}`
            : "";

    return { whereSQL, params };
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
                    SUM(subtotal),
                    2
                ) AS ventas,

                COUNT(DISTINCT ruc_entidad)
                AS entidades,

                COUNT(DISTINCT marca_ficha_producto)
                AS marcas

            FROM ordenes_electronicas oe

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

                oe.razon_social_proveedor
                AS proveedor,

                ROUND(
                    SUM(oe.subtotal),
                    2
                ) AS subtotal,

                COUNT(DISTINCT oe.orden_electronica)
                AS ordenes

            FROM ordenes_electronicas oe

            ${whereSQL}

            GROUP BY oe.razon_social_proveedor

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



exports.obtenerEntidades = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT razon_social_entidad
            FROM ordenes_electronicas
            WHERE razon_social_entidad IS NOT NULL
            AND razon_social_entidad <> ''
            ORDER BY razon_social_entidad ASC
        `);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_ENTIDADES" });
    }
};


exports.obtenerListaProveedores = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT razon_social_proveedor
            FROM ordenes_electronicas
            WHERE razon_social_proveedor IS NOT NULL
            AND razon_social_proveedor <> ''
            ORDER BY razon_social_proveedor ASC
        `);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_PROVEEDORES_LISTA" });
    }
};


exports.obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT categoria
            FROM ordenes_electronicas
            WHERE categoria IS NOT NULL
            AND categoria <> ''
            ORDER BY categoria ASC
        `);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_CATEGORIAS" });
    }
};



exports.obtenerDepartamentos = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT dep_entrega
            FROM ordenes_electronicas
            WHERE dep_entrega IS NOT NULL
            AND dep_entrega <> ''
            ORDER BY dep_entrega ASC
        `);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_DEP" });
    }
};





exports.obtenerProvincias = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT prov_entrega
            FROM ordenes_electronicas
            WHERE prov_entrega IS NOT NULL
            AND prov_entrega <> ''
            ORDER BY prov_entrega ASC
        `);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_PROV" });
    }
};



exports.obtenerDistritos = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT dist_entrega
            FROM ordenes_electronicas
            WHERE dist_entrega IS NOT NULL
            AND dist_entrega <> ''
            ORDER BY dist_entrega ASC
        `);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_DIST" });
    }
};



exports.obtenerOrdenesDetalle = async (req, res) => {

    try {

        const { whereSQL, params } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT
                

                pi.imagen_url,

                pi.ficha_url,

                oe.categoria,

                oe.nro_parte,

                oe.razon_social_proveedor,

                oe.razon_social_entidad,

                oe.precio_unitario,

                oe.cantidad_entrega,

                oe.subtotal,

                oe.fecha_aceptacion,

                oe.orden_digitalizada,

                oe.informe_sustento
            FROM ordenes_electronicas oe

            LEFT JOIN productos_imagenes pi
            ON oe.nro_parte_clean = pi.nro_parte_clean

            ${whereSQL}
            ORDER BY oe.fecha_aceptacion DESC
            LIMIT 500
        `, params);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_DETALLE_ORDENES" });
    }
};



exports.entidadesTotales = async (req, res) => {

    try {

        const { whereSQL, params } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT

                oe.razon_social_entidad AS entidad,

                ROUND(SUM(oe.subtotal), 2) AS subtotal,

                COUNT(DISTINCT oe.orden_electronica) AS ordenes

            FROM ordenes_electronicas oe

            ${whereSQL}

            GROUP BY oe.razon_social_entidad

            ORDER BY subtotal DESC

            LIMIT 100
        `, params);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_ENTIDADES_TOTALES" });
    }
};




// ======================================================
// BUSCAR NRO PARTE
// ======================================================

// ======================================================
// BUSCAR NRO PARTE
// ======================================================

exports.buscarNroParte = async (req, res) => {

    try {

        const {
            nro_parte,
            acuerdo_marco,
            anio,
            mes,
            proveedor,
            entidad,
            categoria,
            departamento,
            provincia,
            distrito
        } = req.query;

        // =========================
        // VALIDACION
        // =========================

        if (!nro_parte || nro_parte.trim() === "") {

            return res.json({
                encontrado: false
            });
        }

        // =========================
        // LIMPIAR NRO PARTE
        // =========================

        const nroParteLimpio = nro_parte
            .trim()
            .replace(/\s+/g, "")
            .replace(/-/g, "")
            .toUpperCase();

        // =========================
        // FILTROS
        // =========================

        const {
            whereSQL,
            params
        } = construirFiltros({
            acuerdo_marco,
            anio,
            mes,
            proveedor,
            entidad,
            categoria,
            departamento,
            provincia,
            distrito
        });

        // =========================
        // QUERY
        // =========================

        const [rows] = await pool.query(`

            SELECT

                MAX(pi.imagen_url) AS imagen_url,

                MIN(oe.precio_unitario)
                AS precio_minimo,

                ROUND(
                    AVG(oe.precio_unitario),
                    2
                ) AS precio_promedio,

                MAX(oe.precio_unitario)
                AS precio_maximo,

                COUNT(*) AS registros

            FROM ordenes_electronicas oe

            LEFT JOIN productos_imagenes pi
            ON oe.nro_parte_clean = pi.nro_parte_clean

            WHERE oe.nro_parte_clean = ?

            ${whereSQL
                ? `AND ${whereSQL.replace("WHERE", "")}`
                : ""
            }

            AND oe.precio_unitario IS NOT NULL

        `, [nroParteLimpio, ...params]);

        // =========================
        // RESPUESTA
        // =========================

        res.json({
            nro_parte: nro_parte,
            imagen_url: rows[0]?.imagen_url || null,

            
            precio_minimo: rows[0]?.precio_minimo || 0,
            precio_promedio: rows[0]?.precio_promedio || 0,
            precio_maximo: rows[0]?.precio_maximo || 0,
            registros: rows[0]?.registros || 0
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_BUSCAR_NRO_PARTE"
        });
    }
};