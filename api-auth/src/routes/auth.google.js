const express = require("express");
const { rateLimitOauth } = require("../middleware/rateLimit");
const {
  getGoogleUrl,
  exchangeGoogleCode,
} = require("../controllers/google.controller");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();


router.get("/auth/google/url", rateLimitOauth, asyncHandler(getGoogleUrl));


router.post(
  "/auth/google/exchange",
  rateLimitOauth,
  asyncHandler(exchangeGoogleCode)
);

module.exports = router;
