// src/utils/config.js
const required = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "JWT_SECRET",
  "JWT_ISSUER",
  "JWT_AUDIENCE",
  "OAUTH_STATE_SECRET",
];

for (const k of required) {
  if (!process.env[k]) throw new Error(`Falta variable de entorno ${k}`);
}

module.exports = {
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
};
