/**
 * Sensor Controller
 * Validates incoming sensor payloads from ESP8266 or simulator,
 * and provides queries for readings and motion events.
 */
const sensorService = require('../services/sensorService');
const deviceService = require('../services/deviceService');

async function postDeviceData(req, res, next) {
  try {
    const {
      deviceId,
      pir,
      pirMotion,
      motionDetected,
      ldr,
      ldrValue,
      light,
      relativeLight,
      lamp,
      lampState,
      lampOn,
      source,
      diagnostics
    } = req.body;

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "deviceId" in payload.'
      });
    }

    // PIR motion validation (accepts boolean, 0/1, or string 0/1)
    const rawPir = pir !== undefined ? pir : (pirMotion !== undefined ? pirMotion : motionDetected);
    if (rawPir === undefined || rawPir === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing PIR motion field ("pir" or "pirMotion" or "motionDetected").'
      });
    }

    // LDR light validation (accepts numeric reading)
    const rawLdr = ldr !== undefined ? ldr : (ldrValue !== undefined ? ldrValue : (light !== undefined ? light : relativeLight));
    if (rawLdr === undefined || rawLdr === null || isNaN(Number(rawLdr))) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid LDR light field ("ldr", "ldrValue", or "light"). Must be a number.'
      });
    }

    // Auto-register device if not already registered
    let dev = await deviceService.getDeviceById(deviceId);
    if (!dev) {
      dev = await deviceService.registerDevice({
        deviceId,
        name: `Device ${deviceId}`,
        deviceType: 'NodeMCU ESP8266',
        isDemo: source === 'DEMO'
      });
    }

    const rawLamp = lamp !== undefined ? lamp : (lampState !== undefined ? lampState : lampOn);

    const reading = await sensorService.saveSensorReading({
      deviceId,
      pirMotion: rawPir,
      ldrValue: rawLdr,
      lampState: rawLamp !== undefined ? rawLamp : 0,
      source: source || 'HARDWARE',
      diagnostics: diagnostics || null
    });

    res.status(201).json({
      success: true,
      message: 'Sensor data recorded successfully.',
      data: reading
    });
  } catch (err) {
    next(err);
  }
}

async function getLatestReading(req, res, next) {
  try {
    const reading = await sensorService.getLatestReading(req.params.deviceId);
    if (!reading) {
      return res.status(404).json({
        success: false,
        error: `No sensor readings found for device "${req.params.deviceId}".`
      });
    }
    res.json({ success: true, data: reading });
  } catch (err) {
    next(err);
  }
}

async function getReadings(req, res, next) {
  try {
    const readings = await sensorService.getReadings(req.params.deviceId, req.query.limit);
    res.json({ success: true, count: readings.length, data: readings });
  } catch (err) {
    next(err);
  }
}

async function getMotionEvents(req, res, next) {
  try {
    const events = await sensorService.getMotionEvents(req.params.deviceId, req.query.limit);
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postDeviceData,
  getLatestReading,
  getReadings,
  getMotionEvents
};
