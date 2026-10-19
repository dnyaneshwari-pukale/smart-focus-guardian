const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/sessions', sessionController.getSessions);
router.post('/sessions', sessionController.createSession);
router.get('/sessions/:sessionId', sessionController.getSession);
router.patch('/sessions/:sessionId', sessionController.patchSession);
router.post('/sessions/:sessionId/complete', sessionController.completeSession);

module.exports = router;
