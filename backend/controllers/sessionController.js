/**
 * Study Session Controller
 * Validates and records Pomodoro focus sessions.
 */
const sessionService = require('../services/sessionService');

async function getSessions(req, res, next) {
  try {
    const sessions = await sessionService.getAllSessions(req.query.limit);
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const session = await sessionService.getSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session "${req.params.sessionId}" not found.` });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

async function createSession(req, res, next) {
  try {
    const {
      sessionId,
      sessionType,
      plannedDurationMin,
      actualDurationMin,
      startTime,
      endTime,
      completionStatus,
      motionEventsCount,
      source
    } = req.body;

    const id = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const saved = await sessionService.saveSession({
      sessionId: id,
      sessionType,
      plannedDurationMin,
      actualDurationMin,
      startTime,
      endTime,
      completionStatus: completionStatus || 'COMPLETED',
      motionEventsCount,
      source: source || 'LOCAL'
    });

    const status = saved.alreadyRecorded ? 200 : 201;
    res.status(status).json({
      success: true,
      message: saved.alreadyRecorded ? 'Session was already recorded.' : 'Session recorded successfully.',
      data: saved
    });
  } catch (err) {
    next(err);
  }
}

async function completeSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { actualDurationMin, endTime, motionEventsCount } = req.body;

    const existing = await sessionService.getSessionById(sessionId);
    if (!existing) {
      // Create completed session record
      const saved = await sessionService.saveSession({
        sessionId,
        sessionType: req.body.sessionType || 'focus',
        plannedDurationMin: req.body.plannedDurationMin || 25,
        actualDurationMin: actualDurationMin || 25,
        startTime: req.body.startTime || new Date(Date.now() - (actualDurationMin || 25) * 60000).toISOString(),
        endTime: endTime || new Date().toISOString(),
        completionStatus: 'COMPLETED',
        motionEventsCount: motionEventsCount || 0,
        source: req.body.source || 'LOCAL'
      });
      return res.status(201).json({ success: true, data: saved });
    }

    res.json({ success: true, message: 'Session completed.', data: existing });
  } catch (err) {
    next(err);
  }
}

async function patchSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const updated = await sessionService.updateSession(sessionId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Session "${sessionId}" not found.` });
    }
    res.json({ success: true, message: 'Session updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSessions,
  getSession,
  createSession,
  completeSession,
  patchSession
};
