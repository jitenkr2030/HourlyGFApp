const Match = require('../models/Match');
const Companion = require('../models/Companion');

// @desc    Like a companion
// @route   POST /api/matches/like/:companionId
// @access  Private
exports.likeCompanion = async (req, res, next) => {
  try {
    const { companionId } = req.params;
    const userId = req.user.id;

    // Check if match already exists
    let match = await Match.findOne({ userId, companionId });

    if (match) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already liked this companion'
      });
    }

    // Create new match
    match = await Match.create({
      userId,
      companionId,
      matchType: 'like',
      userAction: 'like'
    });

    res.status(201).json({
      status: 'success',
      message: 'Companion liked successfully',
      data: { match }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Super like a companion
// @route   POST /api/matches/super-like/:companionId
// @access  Private
exports.superLikeCompanion = async (req, res, next) => {
  try {
    const { companionId } = req.params;
    const userId = req.user.id;

    let match = await Match.findOne({ userId, companionId });

    if (match) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already interacted with this companion'
      });
    }

    match = await Match.create({
      userId,
      companionId,
      matchType: 'super_like',
      userAction: 'super_like'
    });

    res.status(201).json({
      status: 'success',
      message: 'Super like sent successfully',
      data: { match }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pass a companion
// @route   POST /api/matches/pass/:companionId
// @access  Private
exports.passCompanion = async (req, res, next) => {
  try {
    const { companionId } = req.params;
    const userId = req.user.id;

    const match = await Match.create({
      userId,
      companionId,
      matchType: 'like',
      userAction: 'pass',
      isActive: false
    });

    res.status(201).json({
      status: 'success',
      message: 'Companion passed',
      data: { match }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      userId: req.user.id,
      matched: true,
      isActive: true
    })
      .populate({
        path: 'companionId',
        populate: { path: 'userId', select: 'name photos location isOnline' }
      })
      .sort({ matchedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { matches }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unmatch
// @route   DELETE /api/matches/:id
// @access  Private
exports.unmatch = async (req, res, next) => {
  try {
    const match = await Match.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        isActive: false,
        unmatchedBy: req.user.id,
        unmatchedAt: Date.now()
      },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Unmatched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
