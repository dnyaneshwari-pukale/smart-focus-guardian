/**
 * Settings Controller
 * Handles global and user-specific preference retrieval and updates.
 */
const settingsService = require('../services/settingsService');
const userService = require('../services/userService');

async function getSettings(req, res, next) {
  try {
    if (req.user && req.user.userId) {
      const profile = await userService.getUserProfile(req.user.userId);
      return res.json({
        success: true,
        data: {
          focus: profile.focusDuration,
          shortBreak: profile.shortBreak,
          longBreak: profile.longBreak,
          sessionsBeforeLongBreak: profile.sessionsBeforeLongBreak,
          autoStart: profile.autoStart,
          sound: profile.soundEnabled,
          notifications: profile.notificationsEnabled,
          autoLamp: profile.autoLamp,
          ldrThreshold: profile.ldrThreshold,
          theme: profile.theme,
          systemMode: 'hardware'
        }
      });
    }

    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

async function putSettings(req, res, next) {
  try {
    if (req.user && req.user.userId) {
      const updatedProfile = await userService.updateUserProfile(req.user.userId, req.body);
      const profile = updatedProfile.profile;
      return res.json({
        success: true,
        message: 'Settings updated successfully.',
        data: {
          focus: profile.focusDuration,
          shortBreak: profile.shortBreak,
          longBreak: profile.longBreak,
          sessionsBeforeLongBreak: profile.sessionsBeforeLongBreak,
          autoStart: profile.autoStart,
          sound: profile.soundEnabled,
          notifications: profile.notificationsEnabled,
          autoLamp: profile.autoLamp,
          ldrThreshold: profile.ldrThreshold,
          theme: profile.theme,
          systemMode: 'hardware'
        }
      });
    }

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
