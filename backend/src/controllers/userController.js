const User = require('../models/User');
const Companion = require('../models/Companion');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'interests', 'location', 'preferences', 'settings'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile photos
// @route   POST /api/users/photos
// @access  Private
exports.uploadPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload at least one photo'
      });
    }

    const photos = req.files.map((file, index) => ({
      url: `/uploads/profiles/${file.filename}`,
      isMain: index === 0
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { photos: { $each: photos } } },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Photos uploaded successfully',
      data: { photos: user.photos }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete profile photo
// @route   DELETE /api/users/photos/:photoId
// @access  Private
exports.deletePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.photos = user.photos.filter(photo => photo._id.toString() !== req.params.photoId);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit verification documents
// @route   POST /api/users/verify
// @access  Private
exports.submitVerification = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload verification documents'
      });
    }

    const documents = req.files.map(file => ({
      type: req.body.type || 'identity',
      url: `/uploads/verification/${file.filename}`,
      status: 'pending',
      uploadedAt: new Date()
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $push: { verificationDocuments: { $each: documents } },
        backgroundCheckStatus: 'pending'
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Verification documents submitted successfully',
      data: { verificationDocuments: user.verificationDocuments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update preferences
// @route   PUT /api/users/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
