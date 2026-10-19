const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.putSettings);

module.exports = router;
