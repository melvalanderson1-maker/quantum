const pool = require("../config/db");

exports.obtenerTerrenos = async (req, res) => {

    try {

        const {
            cliente,
            departamento,
            provincia,
            distrito,
            indicador
        } = req.query;

        let where = [];
        let params = [];

        if (cliente)      { where.push(`t.cliente_id = ?`); params.push(cliente); }
        if (departamento) { where.push(`dep.id = ?`);         params.push(departamento); }
        if (provincia)    { where.push(`p.id = ?`);         params.push(provincia); }
        if (distrito)     { where.push(`di.id = ?`);        params.push(distrito); }

        if (indicador) {
            where.push(`EXISTS (
                SELECT 1 FROM nodos_sensor ns2
                LEFT JOIN nodo_indicadores ni2 ON ni2.nodo_id = ns2.id
                LEFT JOIN indicadores i2        ON i2.id = ni2.indicador_id
                WHERE ns2.terreno_id = t.id AND i2.nombre = ?
            )`);
            params.push(indicador);
        }

        const whereSQL = where.length > 0
            ? `WHERE ${where.join(" AND ")}`
            : "";

        const [rows] = await pool.query(`
            SELECT
                t.id,
                t.nombre,
                t.area_hectareas,
                t.latitud,
                t.longitud,
                c.nombre  AS cliente,
                dep.nombre AS departamento,
                p.nombre  AS provincia,
                di.nombre AS distrito,
                COUNT(ns.id) AS sensores
            FROM terrenos t
            INNER JOIN clientes c
                ON c.id = t.cliente_id
            LEFT JOIN distritos di
                ON di.id = t.distrito_id
            LEFT JOIN provincias p
                ON p.id = di.provincia_id
            LEFT JOIN departamentos dep
                ON dep.id = p.departamento_id
            LEFT JOIN nodos_sensor ns
                ON ns.terreno_id = t.id
            ${whereSQL}
            GROUP BY t.id
            ORDER BY t.nombre ASC
        `, params);

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "ERROR_TERRENOS" });
    }
};