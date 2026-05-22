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



    // =========================
    // NORMALIZAR ARRAYS
    // =========================

    const anios = Array.isArray(anio)
        ? anio
        : anio
            ? String(anio).split(",")
            : [];

    const meses = Array.isArray(mes)
        ? mes
        : mes
            ? String(mes).split(",")
            : [];

    let where = [];
    let params = [];

    // =========================
    // ACUERDO
    // =========================
    if (acuerdo_marco) {
        where.push(`oe.codigo_acuerdo_marco = ?`);
        params.push(acuerdo_marco);
    }

    // =========================
    // AÑO
    // =========================
    // =========================
    // FECHA OPTIMIZADA
    // =========================

// =========================
// AÑO
// =========================
// =========================
// FECHA OPTIMIZADA
// =========================

if (anios.length > 0) {

    const anioMin = Math.min(...anios.map(Number));
    const anioMax = Math.max(...anios.map(Number));

    // =====================================
    // SI VIENEN MESES
    // =====================================

    if (meses.length > 0) {

        const mesMin = Math.min(...meses.map(Number));
        const mesMax = Math.max(...meses.map(Number));

        const fechaInicio =
            `${anioMin}-${String(mesMin).padStart(2, "0")}-01`;

        // siguiente mes
        let nextMonth = mesMax + 1;
        let nextYear = anioMax;

        if (nextMonth === 13) {
            nextMonth = 1;
            nextYear++;
        }

        const fechaFin =
            `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

        where.push(`
            oe.fecha_aceptacion >= ?
            AND oe.fecha_aceptacion < ?
        `);

        params.push(fechaInicio, fechaFin);

    }

    // =====================================
    // SOLO AÑO
    // =====================================

    else {

        where.push(`
            oe.fecha_aceptacion >= ?
            AND oe.fecha_aceptacion < ?
        `);

        params.push(
            `${anioMin}-01-01`,
            `${anioMax + 1}-01-01`
        );
    }
}
    
    // =========================
    // PROVEEDOR
    // =========================
    // =========================
    // PROVEEDOR
    // =========================
    if (proveedor) {

        const lista = proveedor
            .split(",")
            .map(p => p.trim())
            .filter(Boolean);

        const condiciones = [];

        lista.forEach(p => {

            const clean = p.trim();

            const isRuc = clean.length <= 11 && /^\d+$/.test(clean);

            // 🔥 SI ES RUC
            if (isRuc) {

                condiciones.push(`
                    oe.ruc_proveedor LIKE ?
                `);

                params.push(`${clean}%`);

            } else {

                // 🔥 FULLTEXT
                condiciones.push(`
                    MATCH(oe.razon_social_proveedor)
                    AGAINST(? IN BOOLEAN MODE)
                `);

                params.push(`${clean}*`);
            }
        });

        where.push(`(${condiciones.join(" OR ")})`);
    }

    // =========================
    // ENTIDAD
    // =========================
    // =========================
    // ENTIDAD (FIX EXACTO)
    // =========================
    if (entidad) {

        const lista = entidad
            .split(",")
            .map(e => e.trim())
            .filter(Boolean);

        where.push(`
            oe.ruc_entidad IN (${lista.map(() => "?").join(",")})
        `);

        params.push(...lista);
    }

    // =========================
    // CATEGORIA (NUEVO)
    // =========================
// =========================
// CATEGORIA (FIX ROBUSTO)
// =========================
// =========================
// CATEGORIA (FIX REAL)
// =========================
// =========================
// CATEGORIA (MULTISELECT CORRECTO)
// =========================
if (categoria) {

    const lista = categoria
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);

        const condiciones = [];



    const clean = lista
        .map(v => v.trim())
        .filter(Boolean);

    if (clean.length > 0) {

        where.push(`
            oe.categoria IN (${clean.map(() => "?").join(",")})
        `);

        params.push(...clean);
    }
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

        where.push(`
            oe.nro_parte_clean LIKE ?
        `);

        params.push(`%${nroParteLimpio}%`);
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

                oe.ruc_proveedor,

                MAX(oe.razon_social_proveedor) AS proveedor,

                ROUND(SUM(oe.subtotal), 2) AS subtotal,

                COUNT(*) AS partes,

                COUNT(DISTINCT oe.orden_electronica) AS ocams

            FROM ordenes_electronicas oe

            FORCE INDEX (idx_dashboard_ultra)

            ${whereSQL}

            GROUP BY oe.ruc_proveedor

            ORDER BY subtotal DESC

            LIMIT 100;
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
            SELECT DISTINCT codigo_acuerdo_marco

            FROM ordenes_electronicas

            WHERE codigo_acuerdo_marco IS NOT NULL
            AND codigo_acuerdo_marco <> ''

            ORDER BY codigo_acuerdo_marco ASC
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

        const search = (req.query.search || "").trim();

        let sql = `
            SELECT

                ruc_entidad,
                razon_social_entidad

            FROM ordenes_electronicas

       

            WHERE
        `;

        let params = [];

        // ======================================
        // SI SEARCH VIENE VACIO
        // ======================================

        if (!search) {

            sql += `
                razon_social_entidad IS NOT NULL
                AND razon_social_entidad <> ''
            `;

        }

        // ======================================
        // SI ES RUC
        // ======================================

        else if (/^\d+$/.test(search)) {

            sql += `
                ruc_entidad LIKE ?
            `;

            const booleanSearch = search
                .split(" ")
                .filter(Boolean)
                .map(word => `+${word}*`)
                .join(" ");

            params.push(booleanSearch);

        }

        // ======================================
        // FULLTEXT
        // ======================================

        else {

            const words = search
                .split(/\s+/)
                .filter(Boolean);

            const matchQuery = words
                .map(w => `+${w}*`)
                .join(" ");

            const likeConditions = words.map(() =>
                `razon_social_entidad LIKE ?`
            );

            sql += `
                (
                    MATCH(razon_social_entidad)
                    AGAINST(? IN BOOLEAN MODE)
                    OR
                    (${likeConditions.join(" AND ")})
                )
            `;

            params.push(matchQuery);

            words.forEach(w => {
                params.push(`%${w}%`);
            });
        }

        sql += `

            GROUP BY
                ruc_entidad,
                razon_social_entidad

            ORDER BY razon_social_entidad ASC

            LIMIT 50
        `;

        const [rows] = await pool.query(sql, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_ENTIDADES"
        });
    }
};


exports.obtenerListaProveedores = async (req, res) => {

    try {

        const search = (req.query.search || "").trim();

        const isRuc = /^\d+$/.test(search);

        let where = [];
        let params = [];

        // =========================
        // VACIO
        // =========================

        if (!search) {

            where.push(`
                razon_social_proveedor IS NOT NULL
                AND razon_social_proveedor <> ''
            `);

        }

        // =========================
        // RUC
        // =========================
        else if (isRuc) {

            where.push(`
                ruc_proveedor LIKE ?
            `);

            params.push(`${search}%`);

        }

        // =========================
        // FULLTEXT
        // =========================

        else {

            // =========================
            // SMART SEARCH (CORRECTO)
            // =========================

            const words = search
                .trim()
                .split(/\s+/)
                .filter(Boolean);

            const likeConditions = [];

            words.forEach(word => {

                likeConditions.push(`
                    razon_social_proveedor LIKE ?
                `);

                params.push(`%${word}%`);
            });

            where.push(`
                (
                    ${likeConditions.join(" AND ")}
                )
            `);
        }
        params.push(search);
        params.push(search);
        params.push(search);



        const sql = `

            SELECT

                ruc_proveedor,
                razon_social_proveedor

            FROM ordenes_electronicas

            WHERE ${where.join(" AND ")}

            GROUP BY
                ruc_proveedor,
                razon_social_proveedor

            ORDER BY
                CASE
                    WHEN razon_social_proveedor LIKE CONCAT(?, '%') THEN 0
                    WHEN razon_social_proveedor LIKE CONCAT('%', ?, '%') THEN 1
                    WHEN ruc_proveedor LIKE CONCAT(?, '%') THEN 2
                    ELSE 3
                END,
                LENGTH(razon_social_proveedor) ASC

            LIMIT 50
        `;

        const [rows] = await pool.query(sql, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_PROVEEDORES_LISTA"
        });
    }
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT categoria

            FROM ordenes_electronicas

            WHERE categoria IS NOT NULL
            AND categoria <> ''

            GROUP BY categoria

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

        const filtros = {
            ...req.query,

            // 🔥 IGNORAR DEP
            departamento: ""
        };

        const {
            whereSQL,
            params
        } = construirFiltros(filtros);

        const extraWhere = whereSQL
            ? `${whereSQL} AND`
            : `WHERE`;
        // =========================
        // QUERY
        // =========================

        const [rows] = await pool.query(`

            SELECT DISTINCT
                oe.dep_entrega

            FROM ordenes_electronicas oe

            ${extraWhere}

            oe.dep_entrega IS NOT NULL

            AND oe.dep_entrega <> ''

            ORDER BY oe.dep_entrega ASC

        `, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_DEP"
        });
    }
};




exports.obtenerProvincias = async (req, res) => {

    try {

        const filtros = {
            ...req.query,

            // 🔥 NO FILTRARSE A SI MISMO
            provincia: ""
        };

        const {
            whereSQL,
            params
        } = construirFiltros(filtros);

        const extraWhere = whereSQL
            ? `${whereSQL} AND`
            : `WHERE`;

        const [rows] = await pool.query(`

            SELECT DISTINCT
                oe.prov_entrega

            FROM ordenes_electronicas oe

            ${extraWhere}

            oe.prov_entrega IS NOT NULL

            AND oe.prov_entrega <> ''

            ORDER BY oe.prov_entrega ASC

        `, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_PROV"
        });
    }
};


exports.obtenerDistritos = async (req, res) => {

    try {

        const filtros = {
            ...req.query,

            distrito: ""
        };

        const {
            whereSQL,
            params
        } = construirFiltros(filtros);

        const extraWhere = whereSQL
            ? `${whereSQL} AND`
            : `WHERE`;

        const [rows] = await pool.query(`

            SELECT DISTINCT
                oe.dist_entrega

            FROM ordenes_electronicas oe

            ${extraWhere}

            oe.dist_entrega IS NOT NULL

            AND oe.dist_entrega <> ''

            ORDER BY oe.dist_entrega ASC

        `, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_DIST"
        });
    }
};


exports.obtenerFiltrosDinamicos = async (req, res) => {

    try {

        const {
            whereSQL,
            params
        } = construirFiltros(req.query);

        // 🔥 SI YA EXISTE WHERE -> usar AND
        // 🔥 SI NO EXISTE -> crear WHERE
        const extraWhere = whereSQL
            ? `${whereSQL} AND`
            : `WHERE`;

        const [
            categorias,
            departamentos,
            provincias,
            distritos
        ] = await Promise.all([

            pool.query(`
                SELECT categoria

                FROM ordenes_electronicas oe

                ${extraWhere}

                categoria IS NOT NULL
                AND categoria <> ''

                GROUP BY categoria

                ORDER BY categoria ASC
            `, params),

            pool.query(`
                SELECT dep_entrega

                FROM ordenes_electronicas oe

                ${extraWhere}

                dep_entrega IS NOT NULL
                AND dep_entrega <> ''

                GROUP BY dep_entrega

                ORDER BY dep_entrega ASC
            `, params),

            pool.query(`
                SELECT prov_entrega

                FROM ordenes_electronicas oe

                ${extraWhere}

                prov_entrega IS NOT NULL
                AND prov_entrega <> ''

                GROUP BY prov_entrega

                ORDER BY prov_entrega ASC
            `, params),

            pool.query(`
                SELECT dist_entrega

                FROM ordenes_electronicas oe

                ${extraWhere}

                dist_entrega IS NOT NULL
                AND dist_entrega <> ''

                GROUP BY dist_entrega

                ORDER BY dist_entrega ASC
            `, params)

        ]);

        res.json({

            categorias: categorias[0],

            departamentos: departamentos[0],

            provincias: provincias[0],

            distritos: distritos[0]

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_FILTROS_DINAMICOS"
        });
    }
};



exports.obtenerOrdenesDetalle = async (req, res) => {


    const page = Number(req.query.page || 1);

    const limit = 50;

    const offset = (page - 1) * limit;

    try {

        const { whereSQL, params } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT
                

                pi.imagen_url,

                pi.ficha_url,


                oe.orden_electronica AS ocam,   -- 🔥 AÑADIR ESTO

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
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

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

            GROUP BY oe.ruc_entidad, oe.razon_social_entidad

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