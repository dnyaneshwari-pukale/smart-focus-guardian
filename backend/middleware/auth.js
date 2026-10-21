/**
 * Authentication Middleware
 * Handles user JWT/bearer token verification and hardware device secret token authentication.
 */
require('dotenv').config();
const db = require('../config/database');
const { verifyAuthToken } = require('../utils/authUtils');

/**
 * Enforces mandatory user authentication via Authorization Bearer header.
 */
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Authorization Bearer token.'
    });
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyAuthToken(token);

  if (!payload || !payload.userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired session token. Please sign in again.'
    });
  }

  req.user = payload;
  next();
}

/**
 * Optional user authentication: populates req.user if a valid token is passed,
 * but allows unauthenticated / demo requests to proceed.
 */
function optionalUserAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyAuthToken(token);
    if (payload && payload.userId) {
      req.user = payload;
    }
  }
  next();
}

/**
 * Validates device token for hardware communication endpoints.
 */
async function authenticateDevice(req, res, next) {
  const token = req.headers['x-device-token'] || 
                req.headers['authorization']?.replace('Bearer ', '') || 
                req.query.token;

  const deviceId = req.params.deviceId || req.body.deviceId;
  const configuredSecret = process.env.DEVICE_SECRET_TOKEN || 'sfg_device_secret_2026';

  // Allow internal requests or demo mode without token if explicitly marked
  if (req.body && req.body.source === 'DEMO' || req.query && req.query.source === 'DEMO') {
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

module.exports = {
  authenticateUser,
  optionalUserAuth,
  authenticateDevice
};
