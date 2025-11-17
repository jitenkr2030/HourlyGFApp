const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'booking', 'location'],
    default: 'text'
  },
  messageText: {
    type: String,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  mediaUrl: {
    type: String
  },
  mediaSize: {
    type: Number
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number // For audio/video duration in seconds
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number],
    address: String
  },
  bookingRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  typing: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  }],
  archived: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  muted: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedUntil: Date
  }],
  blocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique chats between two users
chatSchema.index({ participants: 1 }, { unique: true });

// Method to increment unread count
chatSchema.methods.incrementUnread = function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnread = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message };
