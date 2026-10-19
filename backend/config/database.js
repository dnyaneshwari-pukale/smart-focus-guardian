/**
 * Smart Focus Guardian - Database Connection & Abstraction Layer
 * Supports MySQL connection pooling via mysql2/promise, parameterized queries,
 * and seamless in-memory fallback when MySQL is not yet installed or running.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_focus_guardian',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

let pool = null;
let isConnected = false;
let connectionError = null;

// In-Memory storage fallback when MySQL is offline
const inMemoryStore = {
  devices: [
    {
      device_id: 'LAMP_001',
      name: 'Smart Focus Lamp',
      device_type: 'NodeMCU ESP8266',
      connection_status: 'demo',
      last_seen: new Date().toISOString(),
      firmware_version: '1.0.0',
      is_demo: 1,
      device_token: process.env.DEVICE_SECRET_TOKEN || 'sfg_device_secret_2026',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  sensorReadings: [],
  motionEvents: [],
  lampCommands: [],
  studySessions: [],
  settings: {
    focus_duration: '25',
    short_break: '5',
    long_break: '15',
    sessions_before_long_break: '4',
    auto_start: '0',
    sound_enabled: '1',
    notifications_enabled: '0',
    auto_lamp: '1',
    ldr_threshold: '35',
    theme: 'light',
    system_mode: 'demo'
  }
};

/**
 * Initializes the MySQL connection pool and tests connectivity.
 */
async function initializePool() {
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isConnected = true;
    connectionError = null;
    console.log(`[Database] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[Database] MySQL connection notice: ${err.message}`);
    console.warn('[Database] Running in-memory database fallback mode. Sensor data and sessions will function in memory.');
    console.warn('[Database] To use persistent MySQL, ensure MySQL is running and run: npm run db:init');
  }
}

/**
 * Executes a SQL query with parameterized values.
 * Falls back to in-memory store if MySQL is not reachable.
 */
async function query(sql, params = []) {
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('[Database Query Error]:', err.message);
      throw err;
    }
  }

  // Handle in-memory fallback queries
  return executeInMemory(sql, params);
}

/**
 * In-memory fallback executor for basic CRUD operations.
 */
function executeInMemory(sql, params) {
  const normalized = sql.trim().toUpperCase();

  // Settings queries
  if (normalized.includes('FROM SETTINGS')) {
    return Object.entries(inMemoryStore.settings).map(([setting_key, setting_value]) => ({
      setting_key,
      setting_value
    }));
  }
  if (normalized.includes('INSERT INTO SETTINGS') || normalized.includes('UPDATE SETTINGS')) {
    // Expected params: [key, value] or [value, key]
    if (params.length >= 2) {
      const key = params[0];
      const val = String(params[1]);
      inMemoryStore.settings[key] = val;
    }
    return { affectedRows: 1 };
  }

  // Devices queries
  if (normalized.includes('FROM DEVICES WHERE DEVICE_ID =')) {
    const deviceId = params[0];
    const dev = inMemoryStore.devices.filter(d => d.device_id === deviceId);
    return dev;
  }
  if (normalized.includes('FROM DEVICES')) {
    return [...inMemoryStore.devices];
  }
  if (normalized.includes('INSERT INTO DEVICES')) {
    const [device_id, name, device_type, connection_status, firmware_version, is_demo, device_token] = params;
    const existing = inMemoryStore.devices.find(d => d.device_id === device_id);
    if (!existing) {
      inMemoryStore.devices.push({
        device_id,
        name,
        device_type: device_type || 'NodeMCU ESP8266',
        connection_status: connection_status || 'offline',
        last_seen: null,
        firmware_version: firmware_version || '1.0.0',
        is_demo: is_demo ? 1 : 0,
        device_token: device_token || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    return { insertId: 1, affectedRows: 1 };
  }
  if (normalized.includes('UPDATE DEVICES SET')) {
    const deviceId = params[params.length - 1];
    const dev = inMemoryStore.devices.find(d => d.device_id === deviceId);
    if (dev) {
      if (sql.includes('connection_status = ?') && sql.includes('last_seen = NOW()')) {
        dev.connection_status = params[0];
        dev.last_seen = new Date().toISOString();
      }
    }
    return { affectedRows: 1 };
  }

  // Sensor readings queries
  if (normalized.includes('INSERT INTO SENSOR_READINGS')) {
    const [device_id, pir_motion, ldr_value, lighting_category, lamp_state, source, diagnostics] = params;
    const newReading = {
      id: inMemoryStore.sensorReadings.length + 1,
      device_id,
      pir_motion: Number(pir_motion),
      ldr_value: Number(ldr_value),
      lighting_category: lighting_category || 'ADEQUATE',
      lamp_state: Number(lamp_state),
      source: source || 'HARDWARE',
      diagnostics: diagnostics || null,
      recorded_at: new Date().toISOString()
    };
    inMemoryStore.sensorReadings.push(newReading);
    return { insertId: newReading.id, affectedRows: 1 };
  }
  if (normalized.includes('FROM SENSOR_READINGS') && normalized.includes('ORDER BY RECORDED_AT DESC LIMIT 1')) {
    const deviceId = params[0];
    const readings = inMemoryStore.sensorReadings
      .filter(r => r.device_id === deviceId)
      .slice(-1);
    return readings;
  }
  if (normalized.includes('FROM SENSOR_READINGS')) {
    const deviceId = params[0];
    return inMemoryStore.sensorReadings.filter(r => r.device_id === deviceId).slice(-50);
  }

  // Motion events queries
  if (normalized.includes('INSERT INTO MOTION_EVENTS')) {
    const [device_id, event_type, source] = params;
    const newEvent = {
      id: inMemoryStore.motionEvents.length + 1,
      device_id,
      event_type: event_type || 'MOTION_DETECTED',
      source: source || 'HARDWARE',
      occurred_at: new Date().toISOString()
    };
    inMemoryStore.motionEvents.push(newEvent);
    return { insertId: newEvent.id, affectedRows: 1 };
  }
  if (normalized.includes('FROM MOTION_EVENTS')) {
    const deviceId = params[0];
    return inMemoryStore.motionEvents.filter(e => e.device_id === deviceId).slice(-50);
  }

  // Lamp commands queries
  if (normalized.includes('INSERT INTO LAMP_COMMANDS')) {
    const [command_id, device_id, requested_state, brightness, auto_mode] = params;
    const newCmd = {
      id: inMemoryStore.lampCommands.length + 1,
      command_id,
      device_id,
      requested_state: Number(requested_state),
      brightness: Number(brightness),
      auto_mode: Number(auto_mode),
      status: 'PENDING',
      created_at: new Date().toISOString(),
      acknowledged_at: null,
      failure_reason: null
    };
    inMemoryStore.lampCommands.push(newCmd);
    return { insertId: newCmd.id, affectedRows: 1 };
  }
  if (normalized.includes('FROM LAMP_COMMANDS') && normalized.includes("STATUS = 'PENDING'")) {
    const deviceId = params[0];
    return inMemoryStore.lampCommands.filter(c => c.device_id === deviceId && c.status === 'PENDING');
  }
  if (normalized.includes('UPDATE LAMP_COMMANDS SET STATUS =')) {
    // SQL: UPDATE lamp_commands SET status = ?, acknowledged_at = NOW(), failure_reason = ? WHERE command_id = ?
    const [status, failure_reason, command_id] = params;
    const cmd = inMemoryStore.lampCommands.find(c => c.command_id === command_id);
    if (cmd) {
      cmd.status = status;
      cmd.acknowledged_at = new Date().toISOString();
      cmd.failure_reason = failure_reason || null;
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }
  if (normalized.includes('FROM LAMP_COMMANDS WHERE COMMAND_ID =')) {
    const cmdId = params[0];
    return inMemoryStore.lampCommands.filter(c => c.command_id === cmdId);
  }

  // Study sessions queries
  if (normalized.includes('INSERT INTO STUDY_SESSIONS')) {
    const [session_id, session_type, planned_duration_min, actual_duration_min, start_time, end_time, completion_status, motion_events_count, source] = params;
    const existing = inMemoryStore.studySessions.find(s => s.session_id === session_id);
    if (!existing) {
      const newSession = {
        id: inMemoryStore.studySessions.length + 1,
        session_id,
        session_type: session_type || 'focus',
        planned_duration_min: Number(planned_duration_min),
        actual_duration_min: Number(actual_duration_min),
        start_time,
        end_time,
        completion_status: completion_status || 'COMPLETED',
        motion_events_count: Number(motion_events_count || 0),
        source: source || 'LOCAL',
        created_at: new Date().toISOString()
      };
      inMemoryStore.studySessions.push(newSession);
      return { insertId: newSession.id, affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }
  if (normalized.includes('UPDATE STUDY_SESSIONS SET')) {
    // SQL: UPDATE study_sessions SET completion_status = ?, actual_duration_min = ?, end_time = ?, motion_events_count = ? WHERE session_id = ?
    const [status, actual_duration_min, end_time, motion_events_count, session_id] = params;
    const session = inMemoryStore.studySessions.find(s => s.session_id === session_id);
    if (session) {
      if (status !== undefined) session.completion_status = status;
      if (actual_duration_min !== undefined) session.actual_duration_min = Number(actual_duration_min);
      if (end_time !== undefined) session.end_time = end_time;
      if (motion_events_count !== undefined) session.motion_events_count = Number(motion_events_count);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }
  if (normalized.includes('FROM STUDY_SESSIONS WHERE SESSION_ID =')) {
    const sessionId = params[0];
    return inMemoryStore.studySessions.filter(s => s.session_id === sessionId);
  }
  if (normalized.includes('FROM STUDY_SESSIONS')) {
    return [...inMemoryStore.studySessions];
  }

  return [];
}

/**
 * Returns database health and metadata.
 */
function getStatus() {
  return {
    connected: isConnected,
    mode: isConnected ? 'mysql' : 'in-memory-fallback',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    error: connectionError
  };
}

// Automatically initiate pool on module load
initializePool();

module.exports = {
  query,
  getStatus,
  initializePool,
  inMemoryStore
};
