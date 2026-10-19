/**
 * Sensor Service
 * Ingests and queries PIR motion and LDR ambient light readings.
 * Ensures state-transition deduplication for motion events.
 */
const db = require('../config/database');
const deviceService = require('./deviceService');

async function saveSensorReading({
  deviceId,
  pirMotion,
  ldrValue,
  lampState = 0,
  source = 'HARDWARE',
  diagnostics = null
}) {
  // Normalize PIR motion to 0 or 1
  const isMotion = pirMotion === true || pirMotion === 1 || pirMotion === '1' ? 1 : 0;

  // Normalize LDR value (0 to 1023 analog or 0 to 100 relative index)
  let relativeLight = Number(ldrValue);
  if (isNaN(relativeLight)) relativeLight = 50;
  // If sensor reports raw 10-bit ADC (0 - 1023), scale to 0 - 100
  if (relativeLight > 100) {
    relativeLight = Math.round((relativeLight / 1023) * 100);
  }
  relativeLight = Math.max(0, Math.min(100, relativeLight));

  // Classify lighting
  let lightingCategory = 'ADEQUATE';
  if (relativeLight < 30) lightingCategory = 'DIM';
  else if (relativeLight > 75) lightingCategory = 'BRIGHT';

  const lampOn = lampState === true || lampState === 1 || lampState === '1' ? 1 : 0;

  // Insert reading
  await db.query(
    'INSERT INTO sensor_readings (device_id, pir_motion, ldr_value, lighting_category, lamp_state, source, diagnostics) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [deviceId, isMotion, relativeLight, lightingCategory, lampOn, source, diagnostics]
  );

  // Check previous motion status to detect state transitions
  if (isMotion === 1) {
    const recentEvents = await db.query(
      'SELECT id, occurred_at FROM motion_events WHERE device_id = ? AND occurred_at >= NOW() - INTERVAL 10 SECOND ORDER BY occurred_at DESC LIMIT 1',
      [deviceId]
    );

    // Only record if no motion event was recorded in the last 10 seconds (throttle duplicate triggers)
    if (!recentEvents || recentEvents.length === 0) {
      await db.query(
        'INSERT INTO motion_events (device_id, event_type, source) VALUES (?, ?, ?)',
        [deviceId, 'MOTION_DETECTED', source]
      );
    }
  }

  // Update device heartbeat
  await deviceService.updateDeviceHeartbeat(deviceId, source === 'DEMO');

  return {
    deviceId,
    pirMotion: isMotion === 1,
    motionStatus: isMotion === 1 ? 'Motion Detected' : 'No Motion',
    relativeLight,
    lightingCategory,
    lampOn: lampOn === 1,
    source,
    recordedAt: new Date().toISOString()
  };
}

async function getLatestReading(deviceId) {
  const rows = await db.query(
    'SELECT * FROM sensor_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1',
    [deviceId]
  );
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    deviceId: r.device_id,
    pirMotion: Boolean(r.pir_motion),
    motionStatus: r.pir_motion ? 'Motion Detected' : 'No Motion',
    relativeLight: r.ldr_value,
    lightingCategory: r.lighting_category,
    lampOn: Boolean(r.lamp_state),
    source: r.source,
    diagnostics: r.diagnostics,
    recordedAt: r.recorded_at
  };
}

async function getReadings(deviceId, limit = 50) {
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const rows = await db.query(
    'SELECT * FROM sensor_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?',
    [deviceId, lim]
  );
  return rows.map(r => ({
    id: r.id,
    deviceId: r.device_id,
    pirMotion: Boolean(r.pir_motion),
    motionStatus: r.pir_motion ? 'Motion Detected' : 'No Motion',
    relativeLight: r.ldr_value,
    lightingCategory: r.lighting_category,
    lampOn: Boolean(r.lamp_state),
    source: r.source,
    recordedAt: r.recorded_at
  }));
}

async function getMotionEvents(deviceId, limit = 50) {
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const rows = await db.query(
    'SELECT * FROM motion_events WHERE device_id = ? ORDER BY occurred_at DESC LIMIT ?',
    [deviceId, lim]
  );
  return rows.map(e => ({
    id: e.id,
    deviceId: e.device_id,
    eventType: e.event_type,
    source: e.source,
    occurredAt: e.occurred_at
  }));
}

module.exports = {
  saveSensorReading,
  getLatestReading,
  getReadings,
  getMotionEvents
};
