// src/services/github.service.js
const axios = require("axios");
const User = require("../models/user");
const { signAppJwt } = require("../utils/appJwt");
const config = require("../utils/config");

function buildAuthorizeUrl({ clientId, redirectUri, scope, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForGithubToken({ code }) {
  const resp = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: config.GITHUB_CLIENT_ID,
      client_secret: config.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: config.GITHUB_CALLBACK_URL,
    },
    { headers: { Accept: "application/json" } }
  );
  const token = resp.data?.access_token;
  if (!token) throw new Error("No access token de GitHub");
  return token;
}

async function fetchGithubProfile(accessToken) {
  const u = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  return u.data; // { id, login, name, avatar_url, email? }
}

async function fetchGithubEmailIfNeeded(accessToken, profile) {
  if (profile.email) return profile.email;
  const e = await axios.get("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  const primary =
    (e.data || []).find((x) => x.primary && x.verified) ||
    (e.data || []).find((x) => x.verified);
  return primary?.email || null;
}

async function upsertUserFromGithub({ profile, email }) {
  const normalizedEmail = email ? email.toLowerCase().trim() : null;
  let user = await User.findOne({ githubId: String(profile.id) });
  if (!user && normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail });
  }

  if (!user) {
    // crear usuario OAuth (sin passwordHash)
    const payload = {
      nombre: profile.name || profile.login,
      githubId: String(profile.id),
      avatarUrl: profile.avatar_url,
      role: "USUARIO",
    };
    if (normalizedEmail) payload.email = normalizedEmail;
    user = await User.create(payload);
  } else {
    // actualizar datos útiles
    let updated = false;
    if (!user.githubId) {
      user.githubId = String(profile.id);
      updated = true;
    }
    if (!user.avatarUrl && profile.avatar_url) {
      user.avatarUrl = profile.avatar_url;
      updated = true;
    }
    if (!user.email && normalizedEmail) {
      user.email = normalizedEmail;
      updated = true;
    }
    if (updated) await user.save();
  }
  return user;
}

async function exchangeAndLogin({ code }) {
  // 1) Intercambio con GitHub
  const ghAccessToken = await exchangeCodeForGithubToken({ code });

  // 2) Perfil + email
  const profile = await fetchGithubProfile(ghAccessToken);
  const email = await fetchGithubEmailIfNeeded(ghAccessToken, profile);

  // 3) Upsert usuario
  const user = await upsertUserFromGithub({ profile, email });

  // 4) Emitir JWT de la app
  const expiresInSeconds = 24 * 60 * 60;
  const accessExpires = new Date(
    Date.now() + expiresInSeconds * 1000
  ).toISOString();
  const appToken = signAppJwt(
    {
      sub: String(user._id),
      name: user.nombre,
      role: [user.role],
      email: user.email,
      iss: config.JWT_ISSUER,
      aud: config.JWT_AUDIENCE,
    },
    expiresInSeconds
  );

  return {
    accessToken: appToken,
    expiresAtUtc: accessExpires,
    username: user.email,
    roles: [user.role],
  };
}

module.exports = {
  buildAuthorizeUrl,
  exchangeAndLogin,
};
