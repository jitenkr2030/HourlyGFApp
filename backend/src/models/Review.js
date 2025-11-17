const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  photos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    appearance: {
      type: Number,
      min: 1,
      max: 5
    },
    personality: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  verifiedBooking: {
    type: Boolean,
    default: true
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  moderationNotes: String,
  response: {
    text: String,
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ companionId: 1, status: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });
reviewSchema.index({ rating: -1 });

// Update companion rating after review is saved
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    const Companion = mongoose.model('Companion');
    const companion = await Companion.findById(this.companionId);
    if (companion) {
      await companion.updateRating();
    }
  }
});

// Update companion rating after review is updated
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'approved') {
    const Companion = mongoose.model('Companion');
    const companion = await Companion.findById(doc.companionId);
    if (companion) {
      await companion.updateRating();
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
