const pool = require("../config/db");

exports.obtenerClientes = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM clientes");
    res.json(rows);
};

exports.obtenerCliente = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM clientes WHERE id=?", [req.params.id]);
    res.json(rows[0]);
};

exports.crearCliente = async (req, res) => {
    const { nombre } = req.body;
    const [r] = await pool.query("INSERT INTO clientes(nombre) VALUES (?)", [nombre]);
    res.json({ id: r.insertId });
};

exports.actualizarCliente = async (req, res) => {
    await pool.query("UPDATE clientes SET nombre=? WHERE id=?", [req.body.nombre, req.params.id]);
    res.json({ ok: true });
};

exports.eliminarCliente = async (req, res) => {
    await pool.query("DELETE FROM clientes WHERE id=?", [req.params.id]);
    res.json({ ok: true });
};