const bcrypt = require("bcryptjs");

async function generarHash() {
    const password = "Datapro2026#";

    const hash = await bcrypt.hash(password, 10);

    console.log("Password:", password);
    console.log("Hash:", hash);
}

generarHash();