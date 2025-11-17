const { logger } = require('../config/logger');

module.exports = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token and attach user
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const User = require('../models/User');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(socket.userId);

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(data.receiverId).emit('user_typing', {
        senderId: socket.userId,
        chatId: data.chatId,
        isTyping: true
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.receiverId).emit('user_typing', {
        senderId: socket.userId,
        chatId: data.chatId,
        isTyping: false
      });
    });

    // Handle online status
    socket.on('online', async () => {
      const User = require('../models/User');
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastActive: new Date()
      });

      // Broadcast online status to relevant users
      socket.broadcast.emit('user_online', { userId: socket.userId });
    });

    // Handle message read status
    socket.on('message_read', (data) => {
      socket.to(data.senderId).emit('message_read_update', {
        messageId: data.messageId,
        chatId: data.chatId
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.userId}`);

      const User = require('../models/User');
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastActive: new Date()
      });

      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });
  });

  logger.info('Socket.IO service initialized');
};
