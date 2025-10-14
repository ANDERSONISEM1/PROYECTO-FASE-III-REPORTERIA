const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


function ensureJwtSecret() {
if (!process.env.JWT_SECRET) {
const err = new Error('Falta JWT_SECRET en variables de entorno');
err.code = 'CONFIG_JWT_SECRET';
throw err;
}
}


/**
* Registro de usuario
* @param {{nombre: string, email: string, password: string, direccion?: string}} data
* @returns {Promise<{ id: string, nombre: string, email: string, direccion: (string|null) }>}
*/
async function register({ nombre, email, password, direccion = null }) {
const normalizedEmail = email.toLowerCase().trim();


const existing = await User.findOne({ email: normalizedEmail }).lean();
if (existing) {
const err = new Error('Email duplicado');
err.code = 'EMAIL_DUPLICADO';
throw err;
}


const passwordHash = await bcrypt.hash(password, 12);
try {
const user = await User.create({ nombre, email: normalizedEmail, passwordHash, direccion });
return { id: user._id, nombre: user.nombre, email: user.email, direccion: user.direccion ?? null };
} catch (e) {
// Carrera por índice único
if (e && e.code === 11000) {
const err = new Error('Email duplicado');
err.code = 'EMAIL_DUPLICADO';
throw err;
}
throw e;
}
}


/**
* Login de usuario
* @param {{email: string, password: string}} data
* @returns {Promise<{ token: string }>}
*/
async function login({ email, password }) {
ensureJwtSecret();
const normalizedEmail = email.toLowerCase().trim();


const user = await User.findOne({ email: normalizedEmail });
if (!user) {
const err = new Error('Credenciales inválidas');
err.code = 'CREDENCIALES_INVALIDAS';
throw err;
}


const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) {
const err = new Error('Credenciales inválidas');
err.code = 'CREDENCIALES_INVALIDAS';
throw err;
}


const token = jwt.sign(
{ email: user.email, nombre: user.nombre },
process.env.JWT_SECRET,
{ subject: String(user._id), expiresIn: '7d' }
);


return { token };
}


module.exports = { register, login };