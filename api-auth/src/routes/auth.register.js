const express = require('express');
const { register } = require('../controllers/auth.controller');
const { registerLimiter } = require('../middleware/rateLimit');
const verifyTurnstile = require('../middleware/turnstile');
const router = express.Router();

router.post('/register', registerLimiter, verifyTurnstile, register);

module.exports = router;
