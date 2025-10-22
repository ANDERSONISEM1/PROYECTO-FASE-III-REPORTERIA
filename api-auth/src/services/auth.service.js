const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { ROLES } = require("../constants/roles");

// --- Helpers de configuración ---
function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const err = new Error("Falta JWT_SECRET en variables de entorno");
    err.code = "CONFIG_JWT_SECRET";
    throw err;
  }
}
function ensureIssuerAudience() {
  const { JWT_ISSUER, JWT_AUDIENCE } = process.env;
  if (!JWT_ISSUER || !JWT_AUDIENCE) {
    const err = new Error("Faltan JWT_ISSUER o JWT_AUDIENCE en variables de entorno");
    err.code = "CONFIG_JWT_ISS_AUD";
    throw err;
  }
}

/**
 * Registro de usuario
 * @param {{nombre: string, email: string, password: string, direccion?: string, role?: string}} data
 * @returns {Promise<{ id: string, nombre: string, email: string, direccion: (string|null), role: string }>}
 */
<<<<<<< HEAD
async function register({
  nombre,
  email,
  password,
  direccion = null,
  role = null,
}) {
  const normalizedEmail = email.toLowerCase().trim();
=======
async function register({ nombre, email, password, direccion = null, role = "USUARIO" }) {
  const normalizedEmail = (email || "").toLowerCase().trim();
>>>>>>> 398cb06 (Actualizaciones realizadas directamente desde la VPS (auth, environment, docker-compose, etc.))

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    const err = new Error("Email duplicado");
    err.code = "EMAIL_DUPLICADO";
    throw err;
  }

  // ✅ role ya viene como parámetro; valida contra la lista
  const safeRole = ROLES.includes(role) ? role : "USUARIO";

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({
      nombre,
      email: normalizedEmail,
      passwordHash,
      direccion,
      role: safeRole,
    });
    return {
      id: String(user._id),
      nombre: user.nombre,
      email: user.email,
      direccion: user.direccion ?? null,
      role: user.role,
    };
  } catch (e) {
    if (e && e.code === 11000) {
      const err = new Error("Email duplicado");
      err.code = "EMAIL_DUPLICADO";
      throw err;
    }
    throw e;
  }
}

/**
 * Login de usuario
 * @param {{email: string, password: string}} data
 * @returns {Promise<{ accessToken: string, expiresAtUtc: string, username: string, roles: string[] }>}
 */
async function login({ email, password }) {
  ensureJwtSecret();
  ensureIssuerAudience();
  const { JWT_ISSUER, JWT_AUDIENCE, JWT_EXPIRES_SECONDS } = process.env;

  const normalizedEmail = (email || "").toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash"
  );
  if (!user || !user.passwordHash) {
    const err = new Error("Credenciales inválidas");
    err.code = "CREDENCIALES_INVALIDAS";
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Credenciales inválidas");
    err.code = "CREDENCIALES_INVALIDAS";
    throw err;
  }

  // Expiración (por defecto 24h)
  const expiresInSeconds = Number(JWT_EXPIRES_SECONDS || 24 * 60 * 60);
  const accessExpires = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  // Importante: tu backend .NET espera "role" como array en el claim
  const rolesArray = user.role ? [user.role] : [];

  const token = jwt.sign(
    {
      sub: String(user._id),
      name: user.nombre,
      role: rolesArray,              // ← array
      email: user.email,
      iss: JWT_ISSUER,               // p.ej. "https://apilogin.mundoalonzo.com/"
      aud: JWT_AUDIENCE,             // p.ej. "https://uniondeprofesionales.com/api"
    },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: expiresInSeconds }
  );

  return {
    accessToken: token,
    expiresAtUtc: accessExpires,
    username: user.email,
    roles: rolesArray,
  };
}

module.exports = { register, login };

