// src/middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 min
  max: 20, // 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60, // 1 hora
  max: 10, // 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Limita intentos de OAuth para evitar abuso
const rateLimitOauth = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 40, // 60 req/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit excedido" },
});

module.exports = { loginLimiter, registerLimiter, rateLimitOauth };
