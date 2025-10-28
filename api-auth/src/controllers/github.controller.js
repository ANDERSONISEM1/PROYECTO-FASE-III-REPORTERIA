// src/controllers/github.controller.js
const githubService = require("../services/github.service");
const { signState, verifyState } = require("../utils/oauthState");
const config = require("../utils/config");

async function getGithubUrl(_req, res) {
  // state firmado (expira en 5 min)
  const state = signState({ typ: "gh_oauth" }, "5m");
  const authorizeUrl = githubService.buildAuthorizeUrl({
    clientId: config.GITHUB_CLIENT_ID,
    redirectUri: config.GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
    state,
  });
  return res.json({ authorizeUrl, state });
}

async function exchangeGithubCode(req, res) {
  const { code, state } = req.body || {};
  if (!code || !state) {
    return res.status(400).json({ error: "Faltan code/state" });
  }

  // valida state (stateless)
  try {
    verifyState(state);
  } catch {
    return res.status(400).json({ error: "State inválido o expirado" });
  }

  // negocio: intercambiar con GitHub, upsert usuario y emitir JWT propio
  const result = await githubService.exchangeAndLogin({ code });
  // result: { accessToken, expiresAtUtc, username, roles }
  return res.json(result);
}

module.exports = { getGithubUrl, exchangeGithubCode };
