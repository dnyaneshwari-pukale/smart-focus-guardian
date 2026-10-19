const express = require('express');
const router = express.Router();
const lampController = require('../controllers/lampController');
const { authenticateDevice } = require('../middleware/auth');
const { deviceLimiter } = require('../middleware/rateLimiter');

// Frontend triggers command
router.post('/devices/:deviceId/commands/lamp', lampController.postLampCommand);

// Device polling for pending commands
router.get('/devices/:deviceId/commands/pending', deviceLimiter, authenticateDevice, lampController.getPendingCommands);

// Device acknowledges execution
router.post('/devices/:deviceId/commands/:commandId/ack', deviceLimiter, authenticateDevice, lampController.ackLampCommand);

module.exports = router;
