// src/utils/oauthState.js
const jwt = require("jsonwebtoken");
const config = require("./config");

function signState(payload, expiresIn = "5m") {
  return jwt.sign(payload, config.OAUTH_STATE_SECRET, { expiresIn });
}
function verifyState(token) {
  return jwt.verify(token, config.OAUTH_STATE_SECRET);
}

module.exports = { signState, verifyState };
