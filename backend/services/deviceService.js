/**
 * Device Service
 * Handles device persistence, registration, and status calculation.
 */
require('dotenv').config();
const db = require('../config/database');

const OFFLINE_THRESHOLD_SEC = parseInt(process.env.DEVICE_OFFLINE_TIMEOUT_SEC || '30', 10);

async function getAllDevices() {
  const rows = await db.query('SELECT device_id, name, device_type, connection_status, last_seen, firmware_version, is_demo, created_at, updated_at FROM devices');
  return rows.map(decorateDeviceStatus);
}

async function getDeviceById(deviceId) {
  const rows = await db.query('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
  if (!rows.length) return null;
  return decorateDeviceStatus(rows[0]);
}

async function registerDevice({ deviceId, name, deviceType, isDemo, deviceToken }) {
  await db.query(
    'INSERT INTO devices (device_id, name, device_type, connection_status, firmware_version, is_demo, device_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      deviceId,
      name || 'Smart Focus Lamp',
      deviceType || 'NodeMCU ESP8266',
      isDemo ? 'demo' : 'offline',
      '1.0.0',
      isDemo ? 1 : 0,
      deviceToken || process.env.DEVICE_SECRET_TOKEN || 'sfg_device_secret_2026'
    ]
  );
  return getDeviceById(deviceId);
}

async function updateDeviceHeartbeat(deviceId, isDemo = false) {
  const status = isDemo ? 'demo' : 'online';
  await db.query('UPDATE devices SET connection_status = ?, last_seen = NOW() WHERE device_id = ?', [status, deviceId]);
}

/**
 * Checks if the device's last_seen timestamp has exceeded the offline threshold.
 */
function decorateDeviceStatus(device) {
  if (!device) return null;
  const dev = { ...device };
  
  if (dev.is_demo) {
    dev.effectiveStatus = 'demo';
    return dev;
  }

  if (!dev.last_seen) {
    dev.effectiveStatus = 'offline';
    return dev;
  }

  const lastSeenMs = new Date(dev.last_seen).getTime();
  const diffSec = (Date.now() - lastSeenMs) / 1000;

  if (diffSec > OFFLINE_THRESHOLD_SEC) {
    dev.effectiveStatus = 'offline';
  } else {
    dev.effectiveStatus = 'online';
  }

  return dev;
}

module.exports = {
  getAllDevices,
  getDeviceById,
  registerDevice,
  updateDeviceHeartbeat,
  decorateDeviceStatus
};
