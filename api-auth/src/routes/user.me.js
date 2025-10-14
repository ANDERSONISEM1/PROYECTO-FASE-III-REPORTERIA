const express = require('express');
const { me } = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const router = express.Router();


router.get('/me', auth, me);


module.exports = router;