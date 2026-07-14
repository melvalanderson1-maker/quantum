// controllers/lecturas.controller.js
const pool = require("../config/db");

exports.lecturasPorNodo = async (req, res) => {
  try {
    const { nodo_id, dias = 30 } = req.query;

    if (!nodo_id) {
      return res.status(400).json({ error: "nodo_id requerido" });
    }

    const [rows] = await pool.query(
      `SELECT
         DATE(l.timestamp_utc)     AS fecha,
         TIME(l.timestamp_utc)     AS hora,
         l.timestamp_utc,
         i.nombre                  AS indicador,
         i.unidad,
         AVG(l.valor)              AS valor_promedio,
         MIN(l.valor)              AS valor_min,
         MAX(l.valor)              AS valor_max,
         l.calidad
       FROM lecturas_sensor l
       INNER JOIN indicadores i ON i.id = l.indicador_id
       WHERE l.nodo_id = ?
         AND l.timestamp_utc >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND l.calidad != 'error'
       GROUP BY DATE(l.timestamp_utc), l.indicador_id
       ORDER BY l.timestamp_utc ASC`,
      [nodo_id, dias]
    );

    const agrupado = {};
    for (const row of rows) {
      if (!agrupado[row.indicador]) {
        agrupado[row.indicador] = { unidad: row.unidad, datos: [] };
      }
      agrupado[row.indicador].datos.push({
        fecha:     row.fecha,
        hora:      row.hora,
        timestamp: row.timestamp_utc,
        valor:     parseFloat(row.valor_promedio),
        min:       parseFloat(row.valor_min),
        max:       parseFloat(row.valor_max),
        calidad:   row.calidad
      });
    }

    res.json({ nodo_id, agrupado });
  } catch (err) {
    console.error("LECTURAS ERROR:", err);
    res.status(500).json({ error: "Error al obtener lecturas" });
  }
};


exports.lecturasPorTerreno = async (req, res) => {
  try {
    const { terreno_id, dias = 30 } = req.query;

    if (!terreno_id) {
      return res.status(400).json({ error: "terreno_id requerido" });
    }

    const [rows] = await pool.query(
      `SELECT
         n.id                      AS nodo_id,
         n.nombre                  AS nodo_nombre,
         n.latitud,
         n.longitud,
         DATE(l.timestamp_utc)     AS fecha,
         l.timestamp_utc,
         i.nombre                  AS indicador,
         i.unidad,
         AVG(l.valor)              AS valor_promedio,
         l.calidad
       FROM lecturas_sensor l
       INNER JOIN nodos_sensor n  ON n.id = l.nodo_id
       INNER JOIN indicadores i   ON i.id = l.indicador_id
       WHERE l.terreno_id = ?
         AND l.timestamp_utc >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND l.calidad != 'error'
       GROUP BY l.nodo_id, DATE(l.timestamp_utc), l.indicador_id
       ORDER BY n.id, i.nombre, l.timestamp_utc ASC`,
      [terreno_id, dias]
    );

    const porNodo = {};
    for (const row of rows) {
      if (!porNodo[row.nodo_id]) {
        porNodo[row.nodo_id] = {
          nombre:      row.nodo_nombre,
          latitud:     row.latitud,
          longitud:    row.longitud,
          indicadores: {}
        };
      }
      if (!porNodo[row.nodo_id].indicadores[row.indicador]) {
        porNodo[row.nodo_id].indicadores[row.indicador] = {
          unidad: row.unidad,
          datos:  []
        };
      }
      porNodo[row.nodo_id].indicadores[row.indicador].datos.push({
        fecha:     row.fecha,
        timestamp: row.timestamp_utc,
        valor:     parseFloat(row.valor_promedio),
        calidad:   row.calidad
      });
    }

    res.json({ terreno_id, porNodo });
  } catch (err) {
    console.error("LECTURAS TERRENO ERROR:", err);
    res.status(500).json({ error: "Error al obtener lecturas del terreno" });
  }
};