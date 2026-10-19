/**
 * Settings Service
 * Retrieves and updates application preferences and threshold settings.
 */
const db = require('../config/database');

const DEFAULT_SETTINGS = {
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
};

async function getSettings() {
  const rows = await db.query('SELECT setting_key, setting_value FROM settings');
  const settings = { ...DEFAULT_SETTINGS };

  if (rows && rows.length > 0) {
    for (const r of rows) {
      settings[r.setting_key] = r.setting_value;
    }
  }

  return {
    focus: parseInt(settings.focus_duration, 10) || 25,
    shortBreak: parseInt(settings.short_break, 10) || 5,
    longBreak: parseInt(settings.long_break, 10) || 15,
    sessionsBeforeLongBreak: parseInt(settings.sessions_before_long_break, 10) || 4,
    autoStart: settings.auto_start === '1',
    sound: settings.sound_enabled === '1',
    notifications: settings.notifications_enabled === '1',
    autoLamp: settings.auto_lamp === '1',
    ldrThreshold: parseInt(settings.ldr_threshold, 10) || 35,
    theme: settings.theme || 'light',
    systemMode: settings.system_mode || 'demo'
  };
}

async function updateSettings(updates = {}) {
  const mapping = {
    focus: 'focus_duration',
    shortBreak: 'short_break',
    longBreak: 'long_break',
    sessionsBeforeLongBreak: 'sessions_before_long_break',
    autoStart: 'auto_start',
    sound: 'sound_enabled',
    notifications: 'notifications_enabled',
    autoLamp: 'auto_lamp',
    ldrThreshold: 'ldr_threshold',
    theme: 'theme',
    systemMode: 'system_mode'
  };

  for (const [key, val] of Object.entries(updates)) {
    const dbKey = mapping[key] || key;
    let strVal = String(val);

    // Validate numbers
    if (key === 'focus') strVal = String(Math.max(1, Math.min(180, parseInt(val, 10) || 25)));
    if (key === 'shortBreak') strVal = String(Math.max(1, Math.min(60, parseInt(val, 10) || 5)));
    if (key === 'longBreak') strVal = String(Math.max(1, Math.min(90, parseInt(val, 10) || 15)));
    if (key === 'sessionsBeforeLongBreak') strVal = String(Math.max(2, Math.min(8, parseInt(val, 10) || 4)));
    if (key === 'autoStart' || key === 'sound' || key === 'notifications' || key === 'autoLamp') {
      strVal = val ? '1' : '0';
    }
    if (key === 'ldrThreshold') strVal = String(Math.max(0, Math.min(100, parseInt(val, 10) || 35)));
    if (key === 'theme') strVal = val === 'dark' ? 'dark' : 'light';
    if (key === 'systemMode') strVal = val === 'hardware' ? 'hardware' : 'demo';

    // Insert or update
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [dbKey, strVal, strVal]
    );
  }

  return getSettings();
}

module.exports = {
  getSettings,
  updateSettings
};
