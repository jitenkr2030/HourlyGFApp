const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
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
  matchType: {
    type: String,
    enum: ['like', 'super_like'],
    required: true
  },
  matched: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date
  },
  userAction: {
    type: String,
    enum: ['like', 'pass', 'super_like'],
    required: true
  },
  companionAction: {
    type: String,
    enum: ['like', 'pass', null],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unmatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unmatchedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate matches
matchSchema.index({ userId: 1, companionId: 1 }, { unique: true });

// Index for efficient querying
matchSchema.index({ matched: 1, isActive: 1 });
matchSchema.index({ userId: 1, matched: 1 });
matchSchema.index({ companionId: 1, matched: 1 });

module.exports = mongoose.model('Match', matchSchema);
