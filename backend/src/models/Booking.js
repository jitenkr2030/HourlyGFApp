const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Companion',
    required: true
  },
  bookingDate: {
    type: Date,
    required: [true, 'Please provide booking date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time']
  },
  durationHours: {
    type: Number,
    required: [true, 'Please provide duration'],
    min: [1, 'Duration must be at least 1 hour']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    address: String,
    city: String,
    state: String
  },
  meetingType: {
    type: String,
    enum: ['in-person', 'virtual', 'both'],
    default: 'in-person'
  },
  services: [{
    name: String,
    price: Number
  }],
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    servicesPrice: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled_by_user',
      'cancelled_by_companion',
      'disputed',
      'refunded'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['not_initiated', 'pending', 'completed', 'failed']
    }
  },
  agreement: {
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date,
    terms: String
  },
  checkIn: {
    time: Date,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  },
  checkOut: {
    time: Date,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  },
  rating: {
    byUser: Number,
    byCompanion: Number
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  notes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ companionId: 1, status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

// Virtual for duration in minutes
bookingSchema.virtual('durationMinutes').get(function() {
  return this.durationHours * 60;
});

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);
  
  // Can cancel if booking is at least 24 hours away
  return hoursDifference >= 24 && 
         !['completed', 'cancelled_by_user', 'cancelled_by_companion'].includes(this.status);
};

// Calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);
  
  let refundPercentage = 0;
  
  if (hoursDifference >= 72) {
    refundPercentage = 100; // Full refund if cancelled 3+ days before
  } else if (hoursDifference >= 48) {
    refundPercentage = 75; // 75% refund if cancelled 2-3 days before
  } else if (hoursDifference >= 24) {
    refundPercentage = 50; // 50% refund if cancelled 1-2 days before
  } else {
    refundPercentage = 0; // No refund if cancelled less than 24 hours before
  }
  
  return (this.pricing.totalAmount * refundPercentage) / 100;
};

module.exports = mongoose.model('Booking', bookingSchema);
