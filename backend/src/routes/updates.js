const express = require('express');
const { getRecentUpdates } = require('../controllers/updatesController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/recent', authenticate, requireAdmin, getRecentUpdates);

module.exports = router;
