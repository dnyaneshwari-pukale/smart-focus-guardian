/**
 * Smart Focus Guardian - Database Connection & Abstraction Layer
 * Supports MySQL connection pooling via mysql2/promise, parameterized queries,
 * graceful connection management, and comprehensive in-memory fallback.
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
  users: [
    {
      id: 1,
      user_id: 'usr_demo_001',
      name: 'Student Demo',
      email: 'demo@smartfocusguardian.local',
      password_hash: '7f96f2caf892f24987dc8a5b881d756e:3b1e1ddfd6004eadb5d4ea195bb96c14a4ba402ccbd1fa93a7a8925f10e53eb28a2f02a50d2b1441ba9b500fd2bda43a60a69a231949c8cfb20611fccfc4da10',
      avatar_initial: 'S',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  profiles: [
    {
      id: 1,
      user_id: 'usr_demo_001',
      display_name: 'Student Demo',
      bio: 'Demo Student Account',
      focus_duration: 25,
      short_break: 5,
      long_break: 15,
      sessions_before_long_break: 4,
      auto_start: 0,
      sound_enabled: 1,
      notifications_enabled: 0,
      auto_lamp: 1,
      ldr_threshold: 35,
      theme: 'light',
      updated_at: new Date().toISOString()
    }
  ],
  devices: [
    {
      device_id: 'LAMP_001',
      user_id: 'usr_demo_001',
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
 * Closes the MySQL pool cleanly.
 */
async function closePool() {
  if (pool) {
    try {
      await pool.end();
    } catch (err) { }
    pool = null;
    isConnected = false;
  }
}

/**
 * In-memory fallback executor for CRUD operations when MySQL is offline.
 */
function executeInMemory(sql, params) {
  const normalized = sql.trim().toUpperCase();

  // Users queries
  if (normalized.includes('FROM USERS WHERE EMAIL =')) {
    const email = String(params[0] || '').toLowerCase().trim();
    return inMemoryStore.users.filter(u => u.email.toLowerCase() === email);
  }
  if (normalized.includes('FROM USERS WHERE USER_ID =')) {
    const userId = params[0];
    return inMemoryStore.users.filter(u => u.user_id === userId);
  }
  if (normalized.includes('FROM USERS')) {
    return inMemoryStore.users.map(u => ({ ...u, password_hash: undefined }));
  }
  if (normalized.includes('INSERT INTO USERS')) {
    const [user_id, name, email, password_hash, avatar_initial] = params;
    const existing = inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error(`Duplicate entry '${email}' for key 'email'`);
      err.code = 'ER_DUP_ENTRY';
      throw err;
    }
    const newUser = {
      id: inMemoryStore.users.length + 1,
      user_id,
      name,
      email,
      password_hash,
      avatar_initial: avatar_initial || name.charAt(0).toUpperCase() || 'S',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStore.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }
  if (normalized.includes('UPDATE USERS SET')) {
    const userId = params[params.length - 1];
    const u = inMemoryStore.users.find(x => x.user_id === userId);
    if (u) {
      if (params[0] !== undefined) u.name = params[0];
      if (params[1] !== undefined) u.avatar_initial = params[1];
      u.updated_at = new Date().toISOString();
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // Profiles queries
  if (normalized.includes('FROM PROFILES WHERE USER_ID =')) {
    const userId = params[0];
    return inMemoryStore.profiles.filter(p => p.user_id === userId);
  }
  if (normalized.includes('INSERT INTO PROFILES') || normalized.includes('ON DUPLICATE KEY UPDATE')) {
    const [user_id, display_name, focus_duration, short_break, long_break, sessions_before_long_break, auto_start, sound_enabled, notifications_enabled, auto_lamp, ldr_threshold, theme] = params;
    let prof = inMemoryStore.profiles.find(p => p.user_id === user_id);
    if (!prof) {
      prof = {
        id: inMemoryStore.profiles.length + 1,
        user_id,
        display_name: display_name || 'Student',
        bio: '',
        focus_duration: Number(focus_duration) || 25,
        short_break: Number(short_break) || 5,
        long_break: Number(long_break) || 15,
        sessions_before_long_break: Number(sessions_before_long_break) || 4,
        auto_start: Number(auto_start) || 0,
        sound_enabled: Number(sound_enabled) || 1,
        notifications_enabled: Number(notifications_enabled) || 0,
        auto_lamp: Number(auto_lamp) || 1,
        ldr_threshold: Number(ldr_threshold) || 35,
        theme: theme || 'light',
        updated_at: new Date().toISOString()
      };
      inMemoryStore.profiles.push(prof);
    } else {
      if (display_name !== undefined) prof.display_name = display_name;
      if (focus_duration !== undefined) prof.focus_duration = Number(focus_duration);
      if (short_break !== undefined) prof.short_break = Number(short_break);
      if (long_break !== undefined) prof.long_break = Number(long_break);
      if (sessions_before_long_break !== undefined) prof.sessions_before_long_break = Number(sessions_before_long_break);
      if (auto_start !== undefined) prof.auto_start = Number(auto_start);
      if (sound_enabled !== undefined) prof.sound_enabled = Number(sound_enabled);
      if (notifications_enabled !== undefined) prof.notifications_enabled = Number(notifications_enabled);
      if (auto_lamp !== undefined) prof.auto_lamp = Number(auto_lamp);
      if (ldr_threshold !== undefined) prof.ldr_threshold = Number(ldr_threshold);
      if (theme !== undefined) prof.theme = theme;
      prof.updated_at = new Date().toISOString();
    }
    return { affectedRows: 1 };
  }

  // Settings queries
  if (normalized.includes('FROM SETTINGS')) {
    return Object.entries(inMemoryStore.settings).map(([setting_key, setting_value]) => ({
      setting_key,
      setting_value
    }));
  }
  if (normalized.includes('INSERT INTO SETTINGS') || normalized.includes('UPDATE SETTINGS')) {
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
  if (normalized.includes('FROM DEVICES WHERE USER_ID =')) {
    const userId = params[0];
    return inMemoryStore.devices.filter(d => d.user_id === userId || !d.user_id);
  }
  if (normalized.includes('FROM DEVICES')) {
    return [...inMemoryStore.devices];
  }
  if (normalized.includes('INSERT INTO DEVICES')) {
    // [device_id, user_id, name, device_type, connection_status, firmware_version, is_demo, device_token]
    let device_id, user_id, name, device_type, connection_status, firmware_version, is_demo, device_token;
    if (params.length >= 8) {
      [device_id, user_id, name, device_type, connection_status, firmware_version, is_demo, device_token] = params;
    } else {
      [device_id, name, device_type, connection_status, firmware_version, is_demo, device_token] = params;
      user_id = null;
    }
    const existing = inMemoryStore.devices.find(d => d.device_id === device_id);
    if (!existing) {
      inMemoryStore.devices.push({
        device_id,
        user_id: user_id || null,
        name: name || 'Smart Focus Lamp',
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
  if (normalized.includes('UPDATE DEVICES SET NAME =')) {
    const [name, deviceId] = params;
    const dev = inMemoryStore.devices.find(d => d.device_id === deviceId);
    if (dev) {
      dev.name = name;
      dev.updated_at = new Date().toISOString();
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
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
  if (normalized.includes('DELETE FROM DEVICES WHERE DEVICE_ID =')) {
    const deviceId = params[0];
    const idx = inMemoryStore.devices.findIndex(d => d.device_id === deviceId);
    if (idx !== -1) {
      inMemoryStore.devices.splice(idx, 1);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
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
    // Supports either [command_id, device_id, user_id, requested_state, brightness, auto_mode] or [command_id, device_id, requested_state, brightness, auto_mode]
    let command_id, device_id, user_id, requested_state, brightness, auto_mode;
    if (params.length >= 6) {
      [command_id, device_id, user_id, requested_state, brightness, auto_mode] = params;
    } else {
      [command_id, device_id, requested_state, brightness, auto_mode] = params;
      user_id = null;
    }
    const newCmd = {
      id: inMemoryStore.lampCommands.length + 1,
      command_id,
      device_id,
      user_id: user_id || null,
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
  if (normalized.includes('FROM LAMP_COMMANDS WHERE DEVICE_ID =') && normalized.includes('ORDER BY')) {
    const deviceId = params[0];
    return inMemoryStore.lampCommands.filter(c => c.device_id === deviceId).slice(-50).reverse();
  }
  if (normalized.includes('UPDATE LAMP_COMMANDS SET STATUS =')) {
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
    let session_id, user_id, session_type, planned_duration_min, actual_duration_min, start_time, end_time, completion_status, motion_events_count, source;
    if (params.length >= 10) {
      [session_id, user_id, session_type, planned_duration_min, actual_duration_min, start_time, end_time, completion_status, motion_events_count, source] = params;
    } else {
      [session_id, session_type, planned_duration_min, actual_duration_min, start_time, end_time, completion_status, motion_events_count, source] = params;
      user_id = null;
    }
    const existing = inMemoryStore.studySessions.find(s => s.session_id === session_id);
    if (!existing) {
      const newSession = {
        id: inMemoryStore.studySessions.length + 1,
        session_id,
        user_id: user_id || null,
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
  if (normalized.includes('FROM STUDY_SESSIONS WHERE USER_ID =')) {
    const userId = params[0];
    return inMemoryStore.studySessions.filter(s => s.user_id === userId || !s.user_id);
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
  closePool,
  inMemoryStore
};
