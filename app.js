const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

/* 🔥 OPTIONS PRE-FLIGHT */
app.options("*", cors());

/* 🔥 CORS */
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://fygradev.gruecolimp.com"
        ];

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("CORS bloqueado"));
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({ message: "API funcionando correctamente 🚀" });
});

module.exports = app;