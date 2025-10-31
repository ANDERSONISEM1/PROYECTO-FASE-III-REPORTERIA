const express = require('express');
const { login } = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimit');
const verifyTurnstile = require('../middleware/turnstile');
const router = express.Router();

router.post('/login', loginLimiter, verifyTurnstile, login);

module.exports = router;
