const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Companion = require('../models/Companion');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, companionId, rating, reviewText, categories, photos, anonymous } = req.body;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review completed bookings'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ bookingId });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking already reviewed'
      });
    }

    // Create review
    const review = await Review.create({
      userId: req.user.id,
      companionId,
      bookingId,
      rating,
      reviewText,
      categories,
      photos,
      anonymous: anonymous || false,
      status: 'approved' // Auto-approve for now
    });

    // Mark booking as reviewed
    booking.reviewed = true;
    await booking.save();

    // Update companion rating
    const companion = await Companion.findById(companionId);
    await companion.updateRating();

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a companion
// @route   GET /api/reviews/:companionId
// @access  Public
exports.getCompanionReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      companionId: req.params.companionId,
      status: 'approved'
    })
      .populate('userId', 'name photos')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      companionId: req.params.companionId,
      status: 'approved'
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if already marked helpful
    if (review.helpful.includes(req.user.id)) {
      // Remove from helpful
      review.helpful = review.helpful.filter(id => id.toString() !== req.user.id);
      review.helpfulCount = review.helpful.length;
    } else {
      // Add to helpful
      review.helpful.push(req.user.id);
      review.helpfulCount = review.helpful.length;
    }

    await review.save();

    res.status(200).json({
      status: 'success',
      data: { helpfulCount: review.helpfulCount }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
