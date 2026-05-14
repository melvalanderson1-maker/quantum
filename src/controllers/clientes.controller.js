const pool = require("../config/db");

// LISTAR
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

        const [result] = await pool.query(
            `INSERT INTO clientes (nombre, correo, telefono, empresa, estado)
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, correo, telefono, empresa, estado || "Potencial"]
        );

        // 🔥 traer objeto real de DB (IMPORTANTE PRO)
        const [rows] = await pool.query(
            "SELECT * FROM clientes WHERE id = ?",
            [result.insertId]
        );

        const nuevoCliente = rows[0];

        req.app.get("io").emit("cliente:created", nuevoCliente);

        res.json(nuevoCliente);
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

        // 🔥 SIEMPRE DEVOLVER DATA REAL
        const [rows] = await pool.query(
            "SELECT * FROM clientes WHERE id = ?",
            [id]
        );

        const clienteActualizado = rows[0];

        req.app.get("io").emit("cliente:updated", clienteActualizado);

        res.json(clienteActualizado);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar cliente" });
    }
};

// ELIMINAR
exports.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM clientes WHERE id = ?", [id]);

        req.app.get("io").emit("cliente:deleted", {
            id: Number(id)
        });

        res.json({ message: "Cliente eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar cliente" });
    }
};