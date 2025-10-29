// src/utils/config.js
const required = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "JWT_SECRET",
  "JWT_ISSUER",
  "JWT_AUDIENCE",
  "OAUTH_STATE_SECRET",

  // === GOOGLE OAUTH ===
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
];

for (const k of required) {
  if (!process.env[k]) throw new Error(`Falta variable de entorno ${k}`);
}

module.exports = {
  // === GOOGLE OAUTH ===
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  // === GITHUB OAUTH ===
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
};
