const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

const {
  getCompanions,
  getCompanionById,
  getNearbyCompanions,
  filterCompanions,
  getAvailability
} = require('../controllers/companionController');

router.get('/', optionalAuth, getCompanions);
router.get('/nearby', optionalAuth, getNearbyCompanions);
router.post('/filter', optionalAuth, filterCompanions);
router.get('/:id', optionalAuth, getCompanionById);
router.get('/:id/availability', getAvailability);

module.exports = router;
