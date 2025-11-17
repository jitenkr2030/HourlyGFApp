const Companion = require('../models/Companion');
const User = require('../models/User');
const geolib = require('geolib');

// @desc    Get all companions
// @route   GET /api/companions
// @access  Public
exports.getCompanions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const companions = await Companion.find({ accountStatus: 'active' })
      .populate('userId', 'name photos location interests verified isOnline')
      .limit(limit)
      .skip(skip)
      .sort({ 'rating.average': -1, featured: -1 });

    const total = await Companion.countDocuments({ accountStatus: 'active' });

    res.status(200).json({
      status: 'success',
      data: {
        companions,
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

// @desc    Get companion by ID
// @route   GET /api/companions/:id
// @access  Public
exports.getCompanionById = async (req, res, next) => {
  try {
    const companion = await Companion.findById(req.params.id)
      .populate('userId', 'name photos location interests verified isOnline lastActive')
      .populate({
        path: 'reviews',
        options: { limit: 10, sort: { createdAt: -1 } },
        populate: { path: 'userId', select: 'name photos' }
      });

    if (!companion) {
      return res.status(404).json({
        status: 'error',
        message: 'Companion not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { companion }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby companions
// @route   GET /api/companions/nearby
// @access  Public
exports.getNearbyCompanions = async (req, res, next) => {
  try {
    const { lat, lng, maxDistance } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide latitude and longitude'
      });
    }

    const companions = await Companion.find({ accountStatus: 'active' })
      .populate('userId', 'name photos location interests verified isOnline');

    // Filter by distance
    const nearbyCompanions = companions.filter(companion => {
      if (!companion.userId.location || !companion.userId.location.coordinates) {
        return false;
      }

      const distance = geolib.getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { 
          latitude: companion.userId.location.coordinates[1], 
          longitude: companion.userId.location.coordinates[0] 
        }
      );

      return distance <= (maxDistance || 50000); // Default 50km
    });

    res.status(200).json({
      status: 'success',
      data: { companions: nearbyCompanions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Filter companions
// @route   POST /api/companions/filter
// @access  Public
exports.filterCompanions = async (req, res, next) => {
  try {
    const { ageRange, priceRange, interests, languages, rating } = req.body;

    let query = { accountStatus: 'active' };

    if (priceRange) {
      query.hourlyRate = { 
        $gte: priceRange.min || 0, 
        $lte: priceRange.max || 999999 
      };
    }

    if (rating) {
      query['rating.average'] = { $gte: rating };
    }

    if (languages && languages.length > 0) {
      query.languages = { $in: languages };
    }

    const companions = await Companion.find(query)
      .populate('userId', 'name photos location interests verified isOnline dob');

    // Filter by age if specified
    let filteredCompanions = companions;
    if (ageRange) {
      filteredCompanions = companions.filter(comp => {
        const age = comp.userId.age;
        return age >= (ageRange.min || 18) && age <= (ageRange.max || 100);
      });
    }

    // Filter by interests if specified
    if (interests && interests.length > 0) {
      filteredCompanions = filteredCompanions.filter(comp => {
        return comp.userId.interests.some(interest => interests.includes(interest));
      });
    }

    res.status(200).json({
      status: 'success',
      data: { companions: filteredCompanions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get companion availability
// @route   GET /api/companions/:id/availability
// @access  Public
exports.getAvailability = async (req, res, next) => {
  try {
    const companion = await Companion.findById(req.params.id);

    if (!companion) {
      return res.status(404).json({
        status: 'error',
        message: 'Companion not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { 
        availability: companion.availability,
        blockedDates: companion.blockedDates
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
