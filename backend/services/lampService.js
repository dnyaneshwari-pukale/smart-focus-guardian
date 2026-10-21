/**
 * Lamp Command Service
 * Handles asynchronous lamp command dispatch, polling, acknowledgment, and history retrieval.
 */
const db = require('../config/database');

async function createLampCommand({ deviceId, userId = null, requestedState, brightness = 70, autoMode = false }) {
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const reqState = requestedState === true || requestedState === 1 || requestedState === '1' ? 1 : 0;
  const bri = Math.max(0, Math.min(100, parseInt(brightness, 10) || 70));
  const auto = autoMode === true || autoMode === 1 || autoMode === '1' ? 1 : 0;

  await db.query(
    'INSERT INTO lamp_commands (command_id, device_id, user_id, requested_state, brightness, auto_mode, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [commandId, deviceId, userId || null, reqState, bri, auto, 'PENDING']
  );

  return {
    commandId,
    deviceId,
    userId: userId || null,
    requestedState: reqState === 1,
    brightness: bri,
    autoMode: auto === 1,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
}

async function getPendingCommands(deviceId) {
  const rows = await db.query(
    "SELECT command_id, device_id, user_id, requested_state, brightness, auto_mode, status, created_at FROM lamp_commands WHERE device_id = ? AND status = 'PENDING' ORDER BY created_at ASC",
    [deviceId]
  );
  return rows.map(r => ({
    commandId: r.command_id,
    deviceId: r.device_id,
    userId: r.user_id,
    requestedState: Boolean(r.requested_state),
    brightness: r.brightness,
    autoMode: Boolean(r.auto_mode),
    status: r.status,
    createdAt: r.created_at
  }));
}

async function getCommandHistory(deviceId, limit = 20) {
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const rows = await db.query(
    'SELECT command_id, device_id, user_id, requested_state, brightness, auto_mode, status, created_at, acknowledged_at, failure_reason FROM lamp_commands WHERE device_id = ? ORDER BY created_at DESC LIMIT ?',
    [deviceId, lim]
  );
  return rows.map(r => ({
    commandId: r.command_id,
    deviceId: r.device_id,
    userId: r.user_id,
    requestedState: Boolean(r.requested_state),
    brightness: r.brightness,
    autoMode: Boolean(r.auto_mode),
    status: r.status,
    createdAt: r.created_at,
    acknowledgedAt: r.acknowledged_at,
    failureReason: r.failure_reason
  }));
}

async function acknowledgeCommand(commandId, { success = true, failureReason = null } = {}) {
  const status = success ? 'ACKNOWLEDGED' : 'FAILED';

  await db.query(
    'UPDATE lamp_commands SET status = ?, acknowledged_at = NOW(), failure_reason = ? WHERE command_id = ?',
    [status, failureReason, commandId]
  );

  const rows = await db.query('SELECT * FROM lamp_commands WHERE command_id = ?', [commandId]);
  if (!rows || rows.length === 0) return null;

  const cmd = rows[0];
  return {
    commandId: cmd.command_id,
    deviceId: cmd.device_id,
    requestedState: Boolean(cmd.requested_state),
    brightness: cmd.brightness,
    autoMode: Boolean(cmd.auto_mode),
    status: cmd.status,
    acknowledgedAt: cmd.acknowledged_at,
    failureReason: cmd.failure_reason
  };
}

module.exports = {
  createLampCommand,
  getPendingCommands,
  getCommandHistory,
  acknowledgeCommand
};
