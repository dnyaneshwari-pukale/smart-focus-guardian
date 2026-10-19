const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { authenticateDevice } = require('../middleware/auth');
const { deviceLimiter } = require('../middleware/rateLimiter');

// Ingestion endpoint for ESP8266 & Simulator
router.post('/device-data', deviceLimiter, authenticateDevice, sensorController.postDeviceData);

// Query endpoints for dashboard and analytics
router.get('/devices/:deviceId/readings/latest', sensorController.getLatestReading);
router.get('/devices/:deviceId/readings', sensorController.getReadings);
router.get('/devices/:deviceId/motion-events', sensorController.getMotionEvents);

module.exports = router;
