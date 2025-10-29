const googleService = require("../services/google.service");
const { signState, verifyState } = require("../utils/oauthState");
const config = require("../utils/config");

async function getGoogleUrl(_req, res) {
  const state = signState({ typ: "google_oauth" }, "5m");
  const authorizeUrl = googleService.buildAuthorizeUrl({
    clientId: config.GOOGLE_CLIENT_ID,
    redirectUri: config.GOOGLE_CALLBACK_URL,
    scope: "openid profile email",
    state,
  });
  res.json({ authorizeUrl, state });
}

async function exchangeGoogleCode(req, res) {
  const { code, state } = req.body || {};
  if (!code || !state) return res.status(400).json({ error: "Faltan code/state" });

  try {
    verifyState(state);
  } catch {
    return res.status(400).json({ error: "State inválido o expirado" });
  }

  const result = await googleService.exchangeAndLogin({ code });
  res.json(result);
}

module.exports = { getGoogleUrl, exchangeGoogleCode };
