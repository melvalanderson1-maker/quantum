module.exports = (rol) => {

    return (req, res, next) => {

        if(req.user.rol !== rol){

            return res.status(403).json({
                message: "Sin permisos"
            });
        }

        next();
    };
};