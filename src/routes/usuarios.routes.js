const router = require("express").Router();

const pool = require("../config/db");

const authMiddleware = require("../middleware/auth.middleware");

const permisos = require("../middleware/permisos.middleware");


// ========================================
// OBTENER USUARIOS
// ========================================
router.get(
    "/",
    authMiddleware,
    permisos("usuarios"),

    async (req, res) => {

        try {

            const [rows] = await pool.query(`
                SELECT
                    id,
                    nombre,
                    email,
                    rol
                FROM usuarios
            `);

            res.json(rows);

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message: "Error servidor"
            });

        }

    }
);


// ========================================
// OBTENER PERMISOS DE UN USUARIO
// ========================================
router.get(
    "/:id/permisos",
    authMiddleware,
    permisos("usuarios"),

    async (req, res) => {

        try {

            const { id } = req.params;

            const [rows] = await pool.query(`
                SELECT p.codigo
                FROM usuario_permisos up
                INNER JOIN permisos p
                    ON p.id = up.permiso_id
                WHERE up.usuario_id = ?
            `, [id]);

            res.json(rows);

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message: "Error servidor"
            });

        }

    }
);


// ========================================
// ACTUALIZAR PERMISOS USUARIO
// ========================================
router.post(
    "/:id/permisos",
    authMiddleware,
    permisos("usuarios"),

    async (req, res) => {

        try {

            const { id } = req.params;

            const { permisos: permisosFrontend } = req.body;

            // ====================================
            // ELIMINAR PERMISOS ACTUALES
            // ====================================
            await pool.query(
                `DELETE FROM usuario_permisos
                 WHERE usuario_id = ?`,
                [id]
            );

            // ====================================
            // INSERTAR NUEVOS
            // ====================================

            for (const codigo of permisosFrontend) {

                // buscar permiso id
                const [permisoRows] = await pool.query(`
                    SELECT id
                    FROM permisos
                    WHERE codigo = ?
                `, [codigo]);

                if (permisoRows.length > 0) {

                    await pool.query(`
                        INSERT INTO usuario_permisos
                        (
                            usuario_id,
                            permiso_id
                        )
                        VALUES (?, ?)
                    `, [
                        id,
                        permisoRows[0].id
                    ]);
                }
            }

            // ====================================
            // 🔥 REALTIME SOCKET.IO
            // ====================================

            req.io
                .to(`user_${id}`)
                .emit("permisos_actualizados");

            res.json({
                ok: true
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message: "Error servidor"
            });

        }

    }
);

module.exports = router;