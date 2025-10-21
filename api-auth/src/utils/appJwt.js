// src/utils/appJwt.js
const jwt = require("jsonwebtoken");
const config = require("./config");

function signAppJwt(payload, expiresInSeconds) {
  return jwt.sign(payload, config.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: expiresInSeconds,
  });
}

module.exports = { signAppJwt };
