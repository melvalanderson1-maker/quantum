const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {

    const { email, password } = req.body;

    const [rows] = await pool.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [email]
    );

    if(rows.length === 0){
        return res.status(401).json({
            message: "Usuario no existe"
        });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if(!validPassword){
        return res.status(401).json({
            message: "Password incorrecto"
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            rol: user.rol
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "8h"
        }
    );

    // 🔥 TOKEN EN COOKIE SEGURA
    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict"
    });

    res.json({
        nombre: user.nombre,
        rol: user.rol
    });
};