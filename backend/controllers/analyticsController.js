/**
 * Analytics Controller
 */
const analyticsService = require('../services/analyticsService');

async function getSummary(req, res, next) {
  try {
    const userId = req.user?.userId || null;
    const summary = await analyticsService.getSummary(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

async function getDaily(req, res, next) {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const userId = req.user?.userId || null;
    const daily = await analyticsService.getDailyActivity(days, userId);
    res.json({ success: true, count: daily.length, data: daily });
  } catch (err) {
    next(err);
  }
}

async function getWeekly(req, res, next) {
  try {
    const userId = req.user?.userId || null;
    const weekly = await analyticsService.getWeeklyActivity(userId);
    res.json({ success: true, count: weekly.length, data: weekly });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getDaily,
  getWeekly
};
