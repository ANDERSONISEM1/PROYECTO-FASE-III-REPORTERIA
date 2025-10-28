const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// GET /health
router.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    db: states[dbState] || 'desconocido',
    timestamp: new Date()
  });
});

module.exports = router;
