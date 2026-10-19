/**
 * Analytics Controller
 */
const analyticsService = require('../services/analyticsService');

async function getSummary(req, res, next) {
  try {
    const summary = await analyticsService.getSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

async function getDaily(req, res, next) {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const daily = await analyticsService.getDailyActivity(days);
    res.json({ success: true, count: daily.length, data: daily });
  } catch (err) {
    next(err);
  }
}

async function getWeekly(req, res, next) {
  try {
    const weekly = await analyticsService.getWeeklyActivity();
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
