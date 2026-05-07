const pool = require("../config/db");

exports.obtenerProductos = async (req, res) => {

    const [rows] = await pool.query(
        "SELECT * FROM productos"
    );

    res.json(rows);
};

exports.crearProducto = async (req, res) => {

    const { nombre, precio, stock } = req.body;

    await pool.query(
        "INSERT INTO productos(nombre,precio,stock) VALUES(?,?,?)",
        [nombre, precio, stock]
    );

    res.json({
        message: "Producto creado"
    });
};