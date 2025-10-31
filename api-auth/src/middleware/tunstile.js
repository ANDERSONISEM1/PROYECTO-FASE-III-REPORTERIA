// src/middleware/turnstile.js
const axios = require("axios");

/**
 * Middleware para validar Cloudflare Turnstile
 * Se usa en /auth/login y /auth/register
 */
async function verifyTurnstile(req, res, next) {
  try {
    const token = req.body["cf-turnstile-response"];
    if (!token) {
      return res.status(400).json({ error: "Falta cf-turnstile-response" });
    }

    const secretKey = "0x4AAAAAAB9_1zbO63CuvaKiSUqhpPrWzWI"; // <- tu clave secreta
    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    const { data } = await axios.post(
      verifyUrl,
      new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: req.ip || "",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!data.success) {
      console.error("❌ Falló verificación Turnstile:", data);
      return res.status(403).json({ error: "Verificación Turnstile inválida" });
    }

    next();
  } catch (err) {
    console.error("❌ Error verificando Turnstile:", err);
    return res.status(500).json({ error: "Error validando Turnstile" });
  }
}

module.exports = verifyTurnstile;
