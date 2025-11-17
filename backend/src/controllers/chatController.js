const { Chat, Message } = require('../models/Chat');

// @desc    Get all chats
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      blocked: false
    })
      .populate('participants', 'name photos isOnline lastActive')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { chats }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create chat
// @route   POST /api/chats
// @access  Private
exports.getOrCreateChat = async (req, res, next) => {
  try {
    const { participantId } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, participantId] }
    })
      .populate('participants', 'name photos isOnline')
      .populate('lastMessage');

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.id, participantId]
      });

      chat = await chat.populate('participants', 'name photos isOnline');
    }

    res.status(200).json({
      status: 'success',
      data: { chat }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat messages
// @route   GET /api/chats/:id/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      chatId: req.params.id,
      deletedBy: { $ne: req.user.id }
    })
      .populate('senderId', 'name photos')
      .populate('receiverId', 'name photos')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      data: { messages: messages.reverse() }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/chats/:id/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { messageText, messageType, mediaUrl, replyTo } = req.body;
    const chatId = req.params.id;

    // Get chat to find receiver
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    const receiverId = chat.participants.find(p => p.toString() !== req.user.id);

    // Create message
    const message = await Message.create({
      chatId,
      senderId: req.user.id,
      receiverId,
      messageText,
      messageType: messageType || 'text',
      mediaUrl,
      replyTo
    });

    // Update chat
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.incrementUnread(receiverId);

    // Populate message
    await message.populate('senderId', 'name photos');

    // Emit socket event
    const io = req.app.get('io');
    io.to(receiverId.toString()).emit('new_message', message);

    res.status(201).json({
      status: 'success',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chats/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    await Message.updateMany(
      {
        chatId: req.params.id,
        receiverId: req.user.id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    const chat = await Chat.findById(req.params.id);
    await chat.resetUnread(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:id
// @access  Private
exports.deleteChat = async (req, res, next) => {
  try {
    await Chat.findByIdAndUpdate(req.params.id, {
      $addToSet: { archived: req.user.id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Chat deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
