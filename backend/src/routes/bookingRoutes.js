const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  createBooking,
  getBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  getUpcomingBookings
} = require('../controllers/bookingController');

router.use(protect);

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/upcoming', getUpcomingBookings);
router.get('/:id', getBookingById);
router.post('/:id/confirm', confirmBooking);
router.delete('/:id/cancel', cancelBooking);

module.exports = router;
