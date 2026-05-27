const pool = require("../config/db");

exports.obtenerSensores = async (req, res) => {

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

        if (cliente)      { where.push(`c.id = ?`);   params.push(cliente); }
        if (departamento) { where.push(`dep.id = ?`); params.push(departamento); }
        if (provincia)    { where.push(`p.id = ?`);   params.push(provincia); }
        if (distrito)     { where.push(`di.id = ?`);  params.push(distrito); }
        if (indicador)    { where.push(`i.nombre = ?`); params.push(indicador); }

        const whereSQL = where.length > 0
            ? `WHERE ${where.join(" AND ")}`
            : "";

        const [sensores] = await pool.query(`
            SELECT
                ns.*,
                t.nombre   AS terreno_nombre,
                di.nombre  AS terreno_distrito,
                c.nombre   AS cliente_nombre,
                GROUP_CONCAT(
                    DISTINCT i.nombre
                    ORDER BY i.nombre
                    SEPARATOR ', '
                ) AS indicadores
            FROM nodos_sensor ns
            LEFT JOIN terrenos t
                ON ns.terreno_id = t.id
            LEFT JOIN clientes c
                ON t.cliente_id = c.id
            LEFT JOIN distritos di
                ON t.distrito_id = di.id
            LEFT JOIN provincias p
                ON di.provincia_id = p.id
            LEFT JOIN departamentos dep
                ON p.departamento_id = dep.id
            LEFT JOIN nodo_indicadores ni
                ON ni.nodo_id = ns.id
            LEFT JOIN indicadores i
                ON i.id = ni.indicador_id
            ${whereSQL}
            GROUP BY ns.id
            ORDER BY ns.nombre ASC
        `, params);

        res.json(sensores);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error obteniendo sensores" });
    }
};

exports.crearSensor = async (req, res) => {
    const { nombre } = req.body;
    const [r] = await pool.query(
        "INSERT INTO sensores(nombre) VALUES (?)",
        [nombre]
    );
    res.json({ id: r.insertId });
};