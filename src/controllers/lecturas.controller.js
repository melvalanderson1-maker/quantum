const pool = require("../config/db");

// =====================================================
// BUILDER FILTROS
// =====================================================

const construirFiltros = (query) => {

    const {
        terreno_id,
        cliente_id,
        fecha_inicio,
        fecha_fin,
        departamento,
        provincia,
        distrito
    } = query;

    let where = [];
    let params = [];

    // ======================================
    // TERRENO
    // ======================================

    if (terreno_id) {

        where.push(`t.id = ?`);

        params.push(terreno_id);
    }

    // ======================================
    // CLIENTE
    // ======================================

    if (cliente_id) {

        where.push(`c.id = ?`);

        params.push(cliente_id);
    }

    // ======================================
    // FECHA INICIO
    // ======================================

    if (fecha_inicio) {

        where.push(`ls.fecha_lectura >= ?`);

        params.push(fecha_inicio);
    }

    // ======================================
    // FECHA FIN
    // ======================================

    if (fecha_fin) {

        where.push(`ls.fecha_lectura <= ?`);

        params.push(fecha_fin);
    }

    // ======================================
    // DEPARTAMENTO
    // ======================================

    if (departamento) {

        where.push(`dep.nombre = ?`);

        params.push(departamento);
    }

    // ======================================
    // PROVINCIA
    // ======================================

    if (provincia) {

        where.push(`prov.nombre = ?`);

        params.push(provincia);
    }

    // ======================================
    // DISTRITO
    // ======================================

    if (distrito) {

        where.push(`dist.nombre = ?`);

        params.push(distrito);
    }

    const whereSQL = where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    return {
        whereSQL,
        params
    };
};

// =====================================================
// GRAFICO HUMEDAD
// =====================================================

exports.graficoHumedad = async (req, res) => {

    try {

        const {
            whereSQL,
            params
        } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT
                DATE(ls.fecha_lectura) AS fecha,
                ROUND(AVG(ls.humedad_suelo), 2) AS valor
            FROM lecturas_sensor ls
            INNER JOIN nodos_sensor ns
                ON ns.id = ls.nodo_sensor_id
            INNER JOIN terrenos t
                ON t.id = ns.terreno_id
            INNER JOIN clientes c
                ON c.id = t.cliente_id
            LEFT JOIN departamentos dep
                ON dep.id = t.departamento_id
            LEFT JOIN provincias prov
                ON prov.id = t.provincia_id
            LEFT JOIN distritos dist
                ON dist.id = t.distrito_id
            ${whereSQL}
            GROUP BY DATE(ls.fecha_lectura)
            ORDER BY fecha ASC
        `, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_GRAFICO_HUMEDAD"
        });
    }
};

// =====================================================
// GRAFICO TEMPERATURA
// =====================================================

exports.graficoTemperatura = async (req, res) => {

    try {

        const {
            whereSQL,
            params
        } = construirFiltros(req.query);

        const [rows] = await pool.query(`
            SELECT
                DATE(ls.fecha_lectura) AS fecha,
                ROUND(AVG(ls.temperatura), 2) AS valor
            FROM lecturas_sensor ls
            INNER JOIN nodos_sensor ns
                ON ns.id = ls.nodo_sensor_id
            INNER JOIN terrenos t
                ON t.id = ns.terreno_id
            INNER JOIN clientes c
                ON c.id = t.cliente_id
            LEFT JOIN departamentos dep
                ON dep.id = t.departamento_id
            LEFT JOIN provincias prov
                ON prov.id = t.provincia_id
            LEFT JOIN distritos dist
                ON dist.id = t.distrito_id
            ${whereSQL}
            GROUP BY DATE(ls.fecha_lectura)
            ORDER BY fecha ASC
        `, params);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "ERROR_GRAFICO_TEMPERATURA"
        });
    }
};