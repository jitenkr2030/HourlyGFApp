import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  currentChat: null,
  messages: {},
  unreadCount: 0,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action) => {
      state.conversations.unshift(action.payload);
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    setMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Update conversation last message
      const conversation = state.conversations.find(c => c.id === chatId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = new Date().toISOString();
      }
    },
    markAsRead: (state, action) => {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.unread = 0;
        state.unreadCount = state.conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
      }
    },
    incrementUnreadCount: (state, action) => {
      state.unreadCount += action.payload || 1;
    },
    deleteConversation: (state, action) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      delete state.messages[action.payload];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setConversations,
  addConversation,
  setCurrentChat,
  setMessages,
  addMessage,
  markAsRead,
  incrementUnreadCount,
  deleteConversation,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
