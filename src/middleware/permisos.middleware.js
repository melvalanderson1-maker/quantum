const pool = require("../config/db");

module.exports = function (permiso) {

    return async (req, res, next) => {

        try {

            const [rows] = await pool.query(`
                SELECT p.codigo
                FROM usuario_permisos up
                INNER JOIN permisos p
                    ON p.id = up.permiso_id
                WHERE up.usuario_id = ?
            `, [req.usuario.id]);

            const permisos = rows.map(
                r => r.codigo
            );

            if (!permisos.includes(permiso)) {

                return res.status(403).json({
                    message: "Sin permisos"
                });

            }

            next();

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                message: "Error permisos"
            });

        }

    };

};