const mongoose = require('mongoose');

const companionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tagline: {
    type: String,
    maxlength: [100, 'Tagline cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Please provide hourly rate'],
    min: [0, 'Hourly rate cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  languages: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  services: [{
    name: String,
    description: String,
    price: Number
  }],
  availability: {
    monday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    tuesday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    wednesday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    thursday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    friday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    saturday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    sunday: {
      available: { type: Boolean, default: true },
      slots: [{
        startTime: String,
        endTime: String
      }]
    }
  },
  blockedDates: [{
    date: Date,
    reason: String
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    responseRate: { type: Number, default: 100 },
    averageResponseTime: { type: Number, default: 0 }
  },
  verification: {
    identity: {
      status: {
        type: String,
        enum: ['not_verified', 'pending', 'verified', 'rejected'],
        default: 'not_verified'
      },
      documents: [{
        type: String,
        url: String,
        uploadedAt: Date
      }],
      verifiedAt: Date
    },
    backgroundCheck: {
      status: {
        type: String,
        enum: ['not_initiated', 'pending', 'passed', 'failed'],
        default: 'not_initiated'
      },
      provider: String,
      reportId: String,
      completedAt: Date
    },
    photo: {
      status: {
        type: String,
        enum: ['not_verified', 'pending', 'verified', 'rejected'],
        default: 'not_verified'
      },
      verifiedAt: Date
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  suspensionReason: String,
  totalEarnings: {
    type: Number,
    default: 0
  },
  withdrawalInfo: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate reviews
companionSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'companionId',
  justOne: false
});

// Update rating when reviews change
companionSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    {
      $match: { companionId: this._id }
    },
    {
      $group: {
        _id: '$companionId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.rating.average = Math.round(stats[0].averageRating * 10) / 10;
    this.rating.count = stats[0].totalReviews;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }

  await this.save();
};

// Check if companion is available for a specific date/time
companionSchema.methods.isAvailable = function(date, startTime, endTime) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayAvailability = this.availability[dayName];

  if (!dayAvailability || !dayAvailability.available) {
    return false;
  }

  // Check if date is blocked
  const isBlocked = this.blockedDates.some(blocked => 
    blocked.date.toDateString() === date.toDateString()
  );

  if (isBlocked) {
    return false;
  }

  // Check time slots if specified
  if (dayAvailability.slots && dayAvailability.slots.length > 0) {
    return dayAvailability.slots.some(slot => {
      return startTime >= slot.startTime && endTime <= slot.endTime;
    });
  }

  return true;
};

module.exports = mongoose.model('Companion', companionSchema);
