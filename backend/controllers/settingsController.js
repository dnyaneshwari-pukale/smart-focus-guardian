/**
 * Settings Controller
 */
const settingsService = require('../services/settingsService');

async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

async function putSettings(req, res, next) {
  try {
    const updated = await settingsService.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  putSettings
};
