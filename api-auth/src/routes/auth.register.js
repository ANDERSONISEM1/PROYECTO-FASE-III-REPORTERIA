const express = require('express');
const { register } = require('../controllers/auth.controller');
const { registerLimiter } = require('../middleware/rateLimit');
const router = express.Router();


router.post('/register', registerLimiter, register);


module.exports = router;