const express = require('express');
const { login, register, me, getAgents } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);
router.get('/agents', authenticate, requireAdmin, getAgents);

module.exports = router;
