const express = require('express');
const {
  getFields,
  getField,
  createField,
  updateField,
  deleteField,
  getSummary,
} = require('../controllers/fieldsController');
const { addUpdate } = require('../controllers/updatesController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats/summary', getSummary);
router.get('/', getFields);
router.get('/:id', getField);
router.post('/', requireAdmin, createField);
router.put('/:id', requireAdmin, updateField);
router.delete('/:id', requireAdmin, deleteField);

// Field updates
router.post('/:id/updates', addUpdate);

module.exports = router;
