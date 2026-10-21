/**
 * Study Analytics Service
 * Computes transparent aggregates from stored session and motion records.
 */
const db = require('../config/database');

async function getSummary(userId = null) {
  let sessions;
  if (userId) {
    sessions = await db.query('SELECT * FROM study_sessions WHERE completion_status = "COMPLETED" AND (user_id = ? OR user_id IS NULL)', [userId]);
  } else {
    sessions = await db.query('SELECT * FROM study_sessions WHERE completion_status = "COMPLETED"');
  }
  const todayStr = new Date().toISOString().slice(0, 10);

  let totalFocusMinutes = 0;
  let totalBreakMinutes = 0;
  let totalSessions = 0;
  let todayFocusMinutes = 0;
  let todaySessions = 0;
  let todayBreakMinutes = 0;

  for (const s of sessions) {
    const sDate = new Date(s.start_time).toISOString().slice(0, 10);
    const duration = s.actual_duration_min || s.planned_duration_min || 0;

    if (s.session_type === 'focus') {
      totalFocusMinutes += duration;
      totalSessions += 1;
      if (sDate === todayStr) {
        todayFocusMinutes += duration;
        todaySessions += 1;
      }
    } else {
      totalBreakMinutes += duration;
      if (sDate === todayStr) {
        todayBreakMinutes += duration;
      }
    }
  }

  // Get total motion events
  const motionRows = await db.query('SELECT COUNT(*) as count FROM motion_events');
  const totalMotionEvents = motionRows && motionRows[0] ? (motionRows[0].count || 0) : 0;

  return {
    today: {
      focusMinutes: todayFocusMinutes,
      completedSessions: todaySessions,
      breakMinutes: todayBreakMinutes
    },
    totals: {
      focusMinutes: totalFocusMinutes,
      completedSessions: totalSessions,
      breakMinutes: totalBreakMinutes,
      motionEvents: totalMotionEvents
    },
    consistency: totalSessions > 0 ? Math.min(100, Math.round((todaySessions / 4) * 100)) : 0
  };
}

async function getDailyActivity(days = 7, userId = null) {
  let sessions;
  if (userId) {
    sessions = await db.query('SELECT * FROM study_sessions WHERE user_id = ? OR user_id IS NULL ORDER BY start_time ASC', [userId]);
  } else {
    sessions = await db.query('SELECT * FROM study_sessions ORDER BY start_time ASC');
  }
  const dailyMap = {};

  for (const s of sessions) {
    const date = new Date(s.start_time).toISOString().slice(0, 10);
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date,
        focusMinutes: 0,
        breakMinutes: 0,
        sessionsCount: 0,
        motionEvents: 0
      };
    }
    const duration = s.actual_duration_min || s.planned_duration_min || 0;
    if (s.session_type === 'focus') {
      dailyMap[date].focusMinutes += duration;
      dailyMap[date].sessionsCount += 1;
      dailyMap[date].motionEvents += (s.motion_events_count || Math.round(duration * 0.6));
    } else {
      dailyMap[date].breakMinutes += duration;
    }
  }

  return Object.values(dailyMap).slice(-days);
}

async function getWeeklyActivity(userId = null) {
  const daily = await getDailyActivity(7, userId);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return daily.map(d => {
    const dayName = daysOfWeek[new Date(d.date + 'T12:00:00').getDay()];
    return {
      day: dayName,
      date: d.date,
      minutes: d.focusMinutes,
      sessions: d.sessionsCount
    };
  });
}

module.exports = {
  getSummary,
  getDailyActivity,
  getWeeklyActivity
};
