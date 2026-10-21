/**
 * Lamp Controller
 * Handles study lamp command dispatch, pending polling, command history, and device acknowledgment.
 */
const lampService = require('../services/lampService');
const deviceService = require('../services/deviceService');

async function postLampCommand(req, res, next) {
  try {
    const { deviceId } = req.params;
    const { requestedState, lampOn, state, brightness, autoMode } = req.body;
    const userId = req.user?.userId || null;

    const dev = await deviceService.getDeviceById(deviceId);
    if (!dev) {
      return res.status(404).json({ success: false, error: `Device "${deviceId}" not found.` });
    }

    const targetState = requestedState !== undefined 
      ? requestedState 
      : (lampOn !== undefined ? lampOn : state);

    if (targetState === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field "requestedState" (true for ON, false for OFF).'
      });
    }

    const command = await lampService.createLampCommand({
      deviceId,
      userId,
      requestedState: targetState,
      brightness: brightness !== undefined ? brightness : 70,
      autoMode: Boolean(autoMode)
    });

    res.status(201).json({
      success: true,
      message: 'Command queued. Device execution pending.',
      data: command
    });
  } catch (err) {
    next(err);
  }
}

async function getPendingCommands(req, res, next) {
  try {
    const { deviceId } = req.params;
    const commands = await lampService.getPendingCommands(deviceId);
    res.json({
      success: true,
      count: commands.length,
      data: commands
    });
  } catch (err) {
    next(err);
  }
}

async function getCommandHistory(req, res, next) {
  try {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit || '20', 10);
    const history = await lampService.getCommandHistory(deviceId, limit);
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
}

async function ackLampCommand(req, res, next) {
  try {
    const { commandId } = req.params;
    const { success, failureReason } = req.body;

    const isSuccess = success === undefined ? true : Boolean(success);

    const updated = await lampService.acknowledgeCommand(commandId, {
      success: isSuccess,
      failureReason
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Command "${commandId}" not found.`
      });
    }

    res.json({
      success: true,
      message: isSuccess ? 'Command acknowledged successfully.' : 'Command reported failed.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postLampCommand,
  getPendingCommands,
  getCommandHistory,
  ackLampCommand
};
