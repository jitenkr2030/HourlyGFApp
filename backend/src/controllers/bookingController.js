const Booking = require('../models/Booking');
const Companion = require('../models/Companion');
const Payment = require('../models/Payment');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { 
      companionId, 
      bookingDate, 
      startTime, 
      endTime, 
      durationHours,
      location,
      services,
      specialRequests 
    } = req.body;

    // Get companion
    const companion = await Companion.findById(companionId);

    if (!companion) {
      return res.status(404).json({
        status: 'error',
        message: 'Companion not found'
      });
    }

    // Check availability
    const date = new Date(bookingDate);
    const isAvailable = companion.isAvailable(date, startTime, endTime);

    if (!isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'Companion is not available for the selected date/time'
      });
    }

    // Calculate pricing
    const basePrice = companion.hourlyRate * durationHours;
    const servicesPrice = services ? services.reduce((sum, s) => sum + (s.price || 0), 0) : 0;
    const platformFee = (basePrice + servicesPrice) * 0.1; // 10% platform fee
    const tax = (basePrice + servicesPrice + platformFee) * 0.18; // 18% GST
    const totalAmount = basePrice + servicesPrice + platformFee + tax;

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      companionId,
      bookingDate: date,
      startTime,
      endTime,
      durationHours,
      location,
      services,
      specialRequests,
      pricing: {
        basePrice,
        servicesPrice,
        platformFee,
        tax,
        totalAmount
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let query = { userId: req.user.id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'companionId',
        populate: { path: 'userId', select: 'name photos location' }
      })
      .sort({ bookingDate: -1 });

    res.status(200).json({
      status: 'success',
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'companionId',
        populate: { path: 'userId', select: 'name photos location phone' }
      })
      .populate('paymentId');

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm booking
// @route   POST /api/bookings/:id/confirm
// @access  Private
exports.confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if payment is successful
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not completed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Update companion stats
    await Companion.findByIdAndUpdate(booking.companionId, {
      $inc: { 'stats.totalBookings': 1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'Booking confirmed',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking cannot be cancelled at this time'
      });
    }

    // Calculate refund
    const refundAmount = booking.calculateRefund();

    booking.status = 'cancelled_by_user';
    booking.cancellation = {
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
      reason: req.body.reason,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'pending' : 'not_initiated'
    };

    await booking.save();

    // Process refund if applicable
    if (refundAmount > 0 && booking.paymentId) {
      // Trigger refund process (implement in payment service)
    }

    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled',
      data: { 
        booking,
        refundAmount 
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming bookings
// @route   GET /api/bookings/upcoming
// @access  Private
exports.getUpcomingBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id,
      bookingDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate({
        path: 'companionId',
        populate: { path: 'userId', select: 'name photos' }
      })
      .sort({ bookingDate: 1 });

    res.status(200).json({
      status: 'success',
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
