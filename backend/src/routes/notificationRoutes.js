const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder routes - implement notification controller
router.get('/', protect, (req, res) => {
  res.json({ status: 'success', data: { notifications: [] } });
});

module.exports = router;
