// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,                  // 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,                   // 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { loginLimiter, registerLimiter };