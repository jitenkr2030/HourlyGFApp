const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');

const {
  createReview,
  getCompanionReviews,
  markHelpful
} = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/:companionId', optionalAuth, getCompanionReviews);
router.post('/:id/helpful', protect, markHelpful);

module.exports = router;
