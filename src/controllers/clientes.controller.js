const pool = require("../config/db");

// LISTAR TODOS
exports.obtenerClientes = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM clientes");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener clientes" });
    }
};

// POR ID
exports.obtenerClienteById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM clientes WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener cliente" });
    }
};

// CREAR
exports.crearCliente = async (req, res) => {
    try {
        const { nombre, correo, telefono, empresa, estado } = req.body;

        await pool.query(
            `INSERT INTO clientes 
            (nombre, correo, telefono, empresa, estado)
            VALUES (?, ?, ?, ?, ?)`,
            [nombre, correo, telefono, empresa, estado || "Potencial"]
        );

        res.json({ message: "Cliente creado" });
    } catch (error) {
        res.status(500).json({ message: "Error al crear cliente" });
    }
};

// ACTUALIZAR
exports.actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, telefono, empresa, estado } = req.body;

        await pool.query(
            `UPDATE clientes 
             SET nombre=?, correo=?, telefono=?, empresa=?, estado=?
             WHERE id=?`,
            [nombre, correo, telefono, empresa, estado, id]
        );

        res.json({ message: "Cliente actualizado" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar cliente" });
    }
};

// ELIMINAR
exports.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "DELETE FROM clientes WHERE id = ?",
            [id]
        );

        res.json({ message: "Cliente eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar cliente" });
    }
};