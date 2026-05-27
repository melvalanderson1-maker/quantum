const pool = require("../config/db");

exports.obtenerDashboard = async (req, res) => {
    try {

        const {
            departamento,
            provincia,
            distrito,
            cliente,
            indicador
        } = req.query;

        // ============================================
        // JOINS Y WHERE PARA SENSORES
        // ============================================
        let sJoins = `
            LEFT JOIN terrenos t      ON t.id = ns.terreno_id
            LEFT JOIN clientes c      ON c.id = t.cliente_id
            LEFT JOIN distritos di    ON di.id = t.distrito_id
            LEFT JOIN provincias p    ON p.id = di.provincia_id
            LEFT JOIN departamentos dep ON dep.id = p.departamento_id
            LEFT JOIN nodo_indicadores ni ON ni.nodo_id = ns.id
            LEFT JOIN indicadores i       ON i.id = ni.indicador_id
        `;

        let sWhere  = [];
        let sParams = [];

        if (cliente)      { sWhere.push(`c.id = ?`);       sParams.push(cliente); }
        if (departamento) { sWhere.push(`dep.id = ?`);     sParams.push(departamento); }
        if (provincia)    { sWhere.push(`p.id = ?`);       sParams.push(provincia); }
        if (distrito)     { sWhere.push(`di.id = ?`);      sParams.push(distrito); }
        if (indicador)    { sWhere.push(`i.nombre = ?`);   sParams.push(indicador); }

        const sWhereSQL = sWhere.length > 0
            ? `WHERE ${sWhere.join(" AND ")}`
            : "";

        // ============================================
        // JOINS Y WHERE PARA TERRENOS / CULTIVOS
        // ============================================
        let tJoins = `
            LEFT JOIN clientes c        ON c.id = t.cliente_id
            LEFT JOIN distritos di      ON di.id = t.distrito_id
            LEFT JOIN provincias p      ON p.id = di.provincia_id
            LEFT JOIN departamentos dep ON dep.id = p.departamento_id
        `;

        let tWhere  = [];
        let tParams = [];

        if (cliente)      { tWhere.push(`c.id = ?`);   tParams.push(cliente); }
        if (departamento) { tWhere.push(`dep.id = ?`); tParams.push(departamento); }
        if (provincia)    { tWhere.push(`p.id = ?`);   tParams.push(provincia); }
        if (distrito)     { tWhere.push(`di.id = ?`);  tParams.push(distrito); }

        const tWhereSQL = tWhere.length > 0
            ? `WHERE ${tWhere.join(" AND ")}`
            : "";

        // ============================================
        // HELPER: agregar condición extra al WHERE
        // ============================================
        const addCond = (whereSQL, cond) =>
            whereSQL
                ? `${whereSQL} AND ${cond}`
                : `WHERE ${cond}`;

        // ============================================
        // QUERIES
        // ============================================

        // Total sensores
        const [[sensores]] = await pool.query(
            `SELECT COUNT(DISTINCT ns.id) AS total
             FROM nodos_sensor ns ${sJoins} ${sWhereSQL}`,
            sParams
        );

        // Sensores activos
        const [[sensoresActivos]] = await pool.query(
            `SELECT COUNT(DISTINCT ns.id) AS total
             FROM nodos_sensor ns ${sJoins}
             ${addCond(sWhereSQL, "ns.estado = 'activo'")}`,
            sParams
        );

        // Sensores batería baja
        const [[sensoresBateriaBaja]] = await pool.query(
            `SELECT COUNT(DISTINCT ns.id) AS total
             FROM nodos_sensor ns ${sJoins}
             ${addCond(sWhereSQL, "ns.bateria_pct < 20")}`,
            sParams
        );

        // Sensores offline
        const [[sensoresOffline]] = await pool.query(
            `SELECT COUNT(DISTINCT ns.id) AS total
             FROM nodos_sensor ns ${sJoins}
             ${addCond(sWhereSQL, "ns.estado = 'offline'")}`,
            sParams
        );

        // Total terrenos
        const [[terrenos]] = await pool.query(
            `SELECT COUNT(DISTINCT t.id) AS total
             FROM terrenos t ${tJoins} ${tWhereSQL}`,
            tParams
        );

        // Total cultivos
// Total cultivos relacionados a terrenos filtrados
        const [[cultivos]] = await pool.query(
            `SELECT COUNT(DISTINCT rc.cultivo_id) AS total
             FROM recomendaciones_cultivos rc
             LEFT JOIN terrenos t        ON t.id = rc.terreno_id
             LEFT JOIN clientes c        ON c.id = t.cliente_id
             LEFT JOIN distritos di      ON di.id = t.distrito_id
             LEFT JOIN provincias p      ON p.id = di.provincia_id
             LEFT JOIN departamentos dep ON dep.id = p.departamento_id
             ${tWhereSQL}`,
            tParams
        );
        // Alertas (sin filtro por ahora)
        const [[alertas]] = await pool.query(
            `SELECT COUNT(*) AS total FROM reglas_alerta WHERE activa = 1`
        );

        return res.json({
            sensores:           sensores.total,
            sensoresActivos:    sensoresActivos.total,
            sensoresBateriaBaja: sensoresBateriaBaja.total,
            sensoresOffline:    sensoresOffline.total,
            alertas:            alertas.total,
            cultivos:           cultivos.total,
            terrenos:           terrenos.total
        });

    } catch (error) {
        console.log("DASHBOARD ERROR:", error);
        return res.status(500).json({ message: "ERROR_DASHBOARD" });
    }
};