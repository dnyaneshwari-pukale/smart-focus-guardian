const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/devices', deviceController.getDevices);
router.post('/devices', deviceController.createDevice);
router.get('/devices/:deviceId', deviceController.getDevice);
router.put('/devices/:deviceId', deviceController.updateDevice);
router.patch('/devices/:deviceId', deviceController.updateDevice);
router.delete('/devices/:deviceId', deviceController.deleteDevice);
router.get('/devices/:deviceId/status', deviceController.getDeviceStatus);

module.exports = router;
