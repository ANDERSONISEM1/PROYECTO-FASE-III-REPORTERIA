// src/db.js
const mongoose = require('mongoose');


async function connect() {
const url = process.env.MONGO_URL;
if (!url) throw new Error('Falta MONGO_URL en .env');
await mongoose.connect(url);
console.log('Conectado a MongoDB');
}


module.exports = { connect };