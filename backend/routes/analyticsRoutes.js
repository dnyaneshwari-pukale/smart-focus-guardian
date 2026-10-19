const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/analytics/summary', analyticsController.getSummary);
router.get('/analytics/daily', analyticsController.getDaily);
router.get('/analytics/weekly', analyticsController.getWeekly);

module.exports = router;
