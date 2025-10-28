// src/routes/auth.github.js
const express = require("express");
const { rateLimitOauth } = require("../middleware/rateLimit");
const {
  getGithubUrl,
  exchangeGithubCode,
} = require("../controllers/github.controller");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Devuelve authorizeUrl y state firmado
router.get("/auth/github/url", rateLimitOauth, asyncHandler(getGithubUrl));

// Intercambia code+state por el JWT de tu app (JSON)
router.post(
  "/auth/github/exchange",
  rateLimitOauth,
  asyncHandler(exchangeGithubCode)
);

module.exports = router;
