const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getChats,
  getOrCreateChat,
  getMessages,
  sendMessage,
  markAsRead,
  deleteChat
} = require('../controllers/chatController');

router.use(protect);

router.get('/', getChats);
router.post('/', getOrCreateChat);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteChat);

module.exports = router;
