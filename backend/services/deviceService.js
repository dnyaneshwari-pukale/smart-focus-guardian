/**
 * Device Service
 * Handles device persistence, registration, status calculation, updates, and deletion.
 */
require('dotenv').config();
const db = require('../config/database');

const OFFLINE_THRESHOLD_SEC = parseInt(process.env.DEVICE_OFFLINE_TIMEOUT_SEC || '30', 10);

async function getAllDevices(userId = null) {
  let rows;
  if (userId) {
    rows = await db.query(
      'SELECT device_id, user_id, name, device_type, connection_status, last_seen, firmware_version, is_demo, created_at, updated_at FROM devices WHERE user_id = ? OR user_id IS NULL OR is_demo = 1 ORDER BY created_at ASC',
      [userId]
    );
  } else {
    rows = await db.query(
      'SELECT device_id, user_id, name, device_type, connection_status, last_seen, firmware_version, is_demo, created_at, updated_at FROM devices ORDER BY created_at ASC'
    );
  }
  return rows.map(decorateDeviceStatus);
}

async function getDeviceById(deviceId) {
  const rows = await db.query('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
  if (!rows.length) return null;
  return decorateDeviceStatus(rows[0]);
}

async function registerDevice({ deviceId, userId = null, name, deviceType, isDemo, deviceToken }) {
  await db.query(
    'INSERT INTO devices (device_id, user_id, name, device_type, connection_status, firmware_version, is_demo, device_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      deviceId,
      userId || null,
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

async function updateDevice(deviceId, updates = {}, userId = null) {
  const existing = await getDeviceById(deviceId);
  if (!existing) return null;

  // Enforce ownership if userId specified and device is owned
  if (userId && existing.user_id && existing.user_id !== userId) {
    const err = new Error('Forbidden: You do not own this device.');
    err.status = 403;
    throw err;
  }

  const name = updates.name !== undefined ? String(updates.name).trim() : existing.name;
  if (!name || name.length < 2) {
    const err = new Error('Device name must be at least 2 characters.');
    err.status = 400;
    throw err;
  }

  await db.query('UPDATE devices SET name = ? WHERE device_id = ?', [name, deviceId]);
  return getDeviceById(deviceId);
}

async function deleteDevice(deviceId, userId = null) {
  const existing = await getDeviceById(deviceId);
  if (!existing) return false;

  // Protect default demo lamp
  if (deviceId === 'LAMP_001') {
    const err = new Error('Cannot delete default demo lamp LAMP_001.');
    err.status = 400;
    throw err;
  }

  // Enforce ownership
  if (userId && existing.user_id && existing.user_id !== userId) {
    const err = new Error('Forbidden: You do not own this device.');
    err.status = 403;
    throw err;
  }

  await db.query('DELETE FROM devices WHERE device_id = ?', [deviceId]);
  return true;
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
  updateDevice,
  deleteDevice,
  updateDeviceHeartbeat,
  decorateDeviceStatus
};
