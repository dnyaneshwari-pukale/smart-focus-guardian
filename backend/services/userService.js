/**
 * User and Profile Service
 * Handles user registration, authentication, profile management,
 * and user-specific settings persistence.
 */
const crypto = require('crypto');
const db = require('../config/database');
const { hashPassword, verifyPassword, isValidEmail } = require('../utils/authUtils');

async function registerUser({ name, email, password }) {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters.');
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Invalid email address format.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // Check if email already registered
  const existing = await db.query('SELECT user_id FROM users WHERE email = ?', [cleanEmail]);
  if (existing && existing.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const pwdHash = hashPassword(password);
  const initial = name.trim().charAt(0).toUpperCase() || 'S';

  // Insert user
  await db.query(
    'INSERT INTO users (user_id, name, email, password_hash, avatar_initial) VALUES (?, ?, ?, ?, ?)',
    [userId, name.trim(), cleanEmail, pwdHash, initial]
  );

  // Initialize profile with sensible study defaults
  await db.query(
    `INSERT INTO profiles 
      (user_id, display_name, focus_duration, short_break, long_break, sessions_before_long_break, auto_start, sound_enabled, notifications_enabled, auto_lamp, ldr_threshold, theme) 
     VALUES (?, ?, 25, 5, 15, 4, 0, 1, 0, 1, 35, 'light')`,
    [userId, name.trim()]
  );

  return getUserById(userId);
}

async function authenticateUser({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const rows = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
  if (!rows || rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const user = rows[0];
  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  return getUserById(user.user_id);
}

async function getUserById(userId) {
  const users = await db.query(
    'SELECT user_id, name, email, avatar_initial, created_at, updated_at FROM users WHERE user_id = ?',
    [userId]
  );
  if (!users || users.length === 0) return null;

  const user = users[0];
  const profile = await getUserProfile(userId);

  return {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    avatarInitial: user.avatar_initial,
    createdAt: user.created_at,
    profile
  };
}

async function getUserProfile(userId) {
  const rows = await db.query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  if (!rows || rows.length === 0) {
    return {
      displayName: 'Student',
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4,
      autoStart: false,
      soundEnabled: true,
      notificationsEnabled: false,
      autoLamp: true,
      ldrThreshold: 35,
      theme: 'light'
    };
  }

  const p = rows[0];
  return {
    displayName: p.display_name || 'Student',
    bio: p.bio || '',
    focusDuration: p.focus_duration || 25,
    shortBreak: p.short_break || 5,
    longBreak: p.long_break || 15,
    sessionsBeforeLongBreak: p.sessions_before_long_break || 4,
    autoStart: Boolean(p.auto_start),
    soundEnabled: Boolean(p.sound_enabled),
    notificationsEnabled: Boolean(p.notifications_enabled),
    autoLamp: Boolean(p.auto_lamp),
    ldrThreshold: p.ldr_threshold || 35,
    theme: p.theme || 'light'
  };
}

async function updateUserProfile(userId, updates = {}) {
  const existing = await getUserProfile(userId);

  const displayName = updates.displayName !== undefined ? updates.displayName : (updates.name || existing.displayName);
  const bio = updates.bio !== undefined ? updates.bio : (existing.bio || '');
  const focus = updates.focusDuration !== undefined ? Math.max(1, Math.min(180, parseInt(updates.focusDuration, 10) || 25)) : (updates.focus || existing.focusDuration);
  const shortBreak = updates.shortBreak !== undefined ? Math.max(1, Math.min(60, parseInt(updates.shortBreak, 10) || 5)) : existing.shortBreak;
  const longBreak = updates.longBreak !== undefined ? Math.max(1, Math.min(90, parseInt(updates.longBreak, 10) || 15)) : existing.longBreak;
  const sessionsBefore = updates.sessionsBeforeLongBreak !== undefined ? Math.max(2, Math.min(8, parseInt(updates.sessionsBeforeLongBreak, 10) || 4)) : existing.sessionsBeforeLongBreak;
  const autoStart = updates.autoStart !== undefined ? (updates.autoStart ? 1 : 0) : (existing.autoStart ? 1 : 0);
  const sound = updates.soundEnabled !== undefined ? (updates.soundEnabled ? 1 : 0) : (updates.sound !== undefined ? (updates.sound ? 1 : 0) : (existing.soundEnabled ? 1 : 0));
  const notif = updates.notificationsEnabled !== undefined ? (updates.notificationsEnabled ? 1 : 0) : (updates.notifications !== undefined ? (updates.notifications ? 1 : 0) : (existing.notificationsEnabled ? 1 : 0));
  const autoLamp = updates.autoLamp !== undefined ? (updates.autoLamp ? 1 : 0) : (existing.autoLamp ? 1 : 0);
  const ldrThreshold = updates.ldrThreshold !== undefined ? Math.max(10, Math.min(80, parseInt(updates.ldrThreshold, 10) || 35)) : existing.ldrThreshold;
  const theme = updates.theme === 'dark' ? 'dark' : 'light';

  // If name changed, also update users table
  if (updates.name && typeof updates.name === 'string') {
    const initial = updates.name.trim().charAt(0).toUpperCase() || 'S';
    await db.query('UPDATE users SET name = ?, avatar_initial = ? WHERE user_id = ?', [updates.name.trim(), initial, userId]);
  }

  await db.query(
    `INSERT INTO profiles 
      (user_id, display_name, focus_duration, short_break, long_break, sessions_before_long_break, auto_start, sound_enabled, notifications_enabled, auto_lamp, ldr_threshold, theme) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      display_name = VALUES(display_name),
      focus_duration = VALUES(focus_duration),
      short_break = VALUES(short_break),
      long_break = VALUES(long_break),
      sessions_before_long_break = VALUES(sessions_before_long_break),
      auto_start = VALUES(auto_start),
      sound_enabled = VALUES(sound_enabled),
      notifications_enabled = VALUES(notifications_enabled),
      auto_lamp = VALUES(auto_lamp),
      ldr_threshold = VALUES(ldr_threshold),
      theme = VALUES(theme)`,
    [userId, displayName, focus, shortBreak, longBreak, sessionsBefore, autoStart, sound, notif, autoLamp, ldrThreshold, theme]
  );

  return getUserById(userId);
}

module.exports = {
  registerUser,
  authenticateUser,
  getUserById,
  getUserProfile,
  updateUserProfile
};
