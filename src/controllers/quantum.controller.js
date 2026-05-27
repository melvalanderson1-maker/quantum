exports.obtenerEstadoQuantum = async (req, res) => {
    res.json({
        status: "ok",
        qubits: 4
    });
};