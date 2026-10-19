/**
 * Device Controller
 */
const deviceService = require('../services/deviceService');
const sensorService = require('../services/sensorService');
const lampService = require('../services/lampService');

async function getDevices(req, res, next) {
  try {
    const devices = await deviceService.getAllDevices();
    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    next(err);
  }
}

async function getDevice(req, res, next) {
  try {
    const device = await deviceService.getDeviceById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ success: false, error: `Device "${req.params.deviceId}" not found.` });
    }
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
}

async function createDevice(req, res, next) {
  try {
    const { deviceId, name, deviceType, isDemo, deviceToken } = req.body;

    if (!deviceId || !/^[A-Za-z0-9_-]{3,24}$/.test(deviceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deviceId. Must be 3-24 alphanumeric characters, underscores, or hyphens.'
      });
    }

    const existing = await deviceService.getDeviceById(deviceId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Device "${deviceId}" already exists.`
      });
    }

    const newDevice = await deviceService.registerDevice({
      deviceId,
      name,
      deviceType,
      isDemo: Boolean(isDemo),
      deviceToken
    });

    res.status(201).json({ success: true, data: newDevice });
  } catch (err) {
    next(err);
  }
}

async function getDeviceStatus(req, res, next) {
  try {
    const device = await deviceService.getDeviceById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ success: false, error: `Device "${req.params.deviceId}" not found.` });
    }

    const latestReading = await sensorService.getLatestReading(req.params.deviceId);
    const pendingCommands = await lampService.getPendingCommands(req.params.deviceId);

    res.json({
      success: true,
      data: {
        device,
        latestReading,
        pendingCommandsCount: pendingCommands.length,
        status: device.effectiveStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDevices,
  getDevice,
  createDevice,
  getDeviceStatus
};
