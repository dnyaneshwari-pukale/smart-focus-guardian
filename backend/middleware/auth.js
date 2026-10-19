/**
 * Device Authentication Middleware
 * Validates device token for hardware communication endpoints.
 */
require('dotenv').config();
const db = require('../config/database');

async function authenticateDevice(req, res, next) {
  const token = req.headers['x-device-token'] || 
                req.headers['authorization']?.replace('Bearer ', '') || 
                req.query.token;

  const deviceId = req.params.deviceId || req.body.deviceId;
  const configuredSecret = process.env.DEVICE_SECRET_TOKEN || 'sfg_device_secret_2026';

  // Allow internal requests or demo mode without token if explicitly marked
  if (req.body.source === 'DEMO' || req.query.source === 'DEMO') {
    return next();
  }

  // Check against global secret
  if (token && token === configuredSecret) {
    return next();
  }

  // Check against registered device token in database
  if (deviceId && token) {
    try {
      const rows = await db.query('SELECT device_token, is_demo FROM devices WHERE device_id = ?', [deviceId]);
      if (rows.length > 0) {
        if (rows[0].is_demo || rows[0].device_token === token) {
          return next();
        }
      }
    } catch (e) {
      console.warn('[Auth Middleware Warning]:', e.message);
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Invalid or missing device token. Provide a valid x-device-token header.'
  });
}

module.exports = { authenticateDevice };
