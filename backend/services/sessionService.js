/**
 * Study Session Service
 * Tracks Pomodoro and study focus sessions with strict deduplication by unique sessionId.
 */
const db = require('../config/database');

async function saveSession({
  sessionId,
  userId = null,
  sessionType = 'focus',
  plannedDurationMin = 25,
  actualDurationMin = 25,
  startTime,
  endTime,
  completionStatus = 'COMPLETED',
  motionEventsCount = 0,
  source = 'LOCAL'
}) {
  if (!sessionId) {
    throw new Error('sessionId is required for study session recording.');
  }

  // Idempotency check: if session already exists, return it without duplicate creation
  const existing = await db.query('SELECT * FROM study_sessions WHERE session_id = ?', [sessionId]);
  if (existing && existing.length > 0) {
    const s = existing[0];
    return {
      sessionId: s.session_id,
      userId: s.user_id,
      sessionType: s.session_type,
      plannedDurationMin: s.planned_duration_min,
      actualDurationMin: s.actual_duration_min,
      startTime: s.start_time,
      endTime: s.end_time,
      completionStatus: s.completion_status,
      motionEventsCount: s.motion_events_count,
      source: s.source,
      alreadyRecorded: true
    };
  }

  const validTypes = ['focus', 'shortBreak', 'longBreak'];
  const type = validTypes.includes(sessionType) ? sessionType : 'focus';

  const planned = Math.max(1, Math.min(240, parseInt(plannedDurationMin, 10) || 25));
  const actual = Math.max(1, Math.min(240, parseInt(actualDurationMin, 10) || planned));

  const start = startTime ? new Date(startTime) : new Date(Date.now() - actual * 60000);
  const end = endTime ? new Date(endTime) : new Date();

  await db.query(
    'INSERT INTO study_sessions (session_id, user_id, session_type, planned_duration_min, actual_duration_min, start_time, end_time, completion_status, motion_events_count, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      sessionId,
      userId || null,
      type,
      planned,
      actual,
      start.toISOString().slice(0, 19).replace('T', ' '),
      end.toISOString().slice(0, 19).replace('T', ' '),
      completionStatus,
      parseInt(motionEventsCount, 10) || 0,
      source
    ]
  );

  return {
    sessionId,
    userId: userId || null,
    sessionType: type,
    plannedDurationMin: planned,
    actualDurationMin: actual,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    completionStatus,
    motionEventsCount,
    source,
    alreadyRecorded: false
  };
}

async function getAllSessions(limit = 100, userId = null) {
  const lim = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
  let rows;
  if (userId) {
    rows = await db.query(
      'SELECT * FROM study_sessions WHERE user_id = ? OR user_id IS NULL ORDER BY start_time DESC LIMIT ?',
      [userId, lim]
    );
  } else {
    rows = await db.query(
      'SELECT * FROM study_sessions ORDER BY start_time DESC LIMIT ?',
      [lim]
    );
  }
  return rows.map(s => ({
    id: s.id,
    sessionId: s.session_id,
    sessionType: s.session_type,
    plannedDurationMin: s.planned_duration_min,
    actualDurationMin: s.actual_duration_min,
    startTime: s.start_time,
    endTime: s.end_time,
    completionStatus: s.completion_status,
    motionEventsCount: s.motion_events_count,
    source: s.source,
    createdAt: s.created_at
  }));
}

async function getSessionById(sessionId) {
  const rows = await db.query('SELECT * FROM study_sessions WHERE session_id = ?', [sessionId]);
  if (!rows || rows.length === 0) return null;
  const s = rows[0];
  return {
    id: s.id,
    sessionId: s.session_id,
    sessionType: s.session_type,
    plannedDurationMin: s.planned_duration_min,
    actualDurationMin: s.actual_duration_min,
    startTime: s.start_time,
    endTime: s.end_time,
    completionStatus: s.completion_status,
    motionEventsCount: s.motion_events_count,
    source: s.source,
    createdAt: s.created_at
  };
}

async function updateSession(sessionId, updates = {}) {
  const existing = await getSessionById(sessionId);
  if (!existing) return null;

  const validStatuses = ['COMPLETED', 'INTERRUPTED', 'ABORTED'];
  const status = updates.completionStatus && validStatuses.includes(updates.completionStatus)
    ? updates.completionStatus
    : existing.completionStatus;

  const actualDuration = updates.actualDurationMin !== undefined
    ? Math.max(1, Math.min(240, parseInt(updates.actualDurationMin, 10) || existing.actualDurationMin))
    : existing.actualDurationMin;

  const endTime = updates.endTime
    ? new Date(updates.endTime).toISOString().slice(0, 19).replace('T', ' ')
    : existing.endTime;

  const motionEvents = updates.motionEventsCount !== undefined
    ? parseInt(updates.motionEventsCount, 10) || 0
    : existing.motionEventsCount;

  await db.query(
    'UPDATE study_sessions SET completion_status = ?, actual_duration_min = ?, end_time = ?, motion_events_count = ? WHERE session_id = ?',
    [status, actualDuration, endTime, motionEvents, sessionId]
  );

  return getSessionById(sessionId);
}

module.exports = {
  saveSession,
  getAllSessions,
  getSessionById,
  updateSession
};
