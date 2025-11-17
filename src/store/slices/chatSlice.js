import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatAPI, getSocket, handleApiError } from '../../services/api';

// Async thunks for chat actions
export const fetchChatRooms = createAsyncThunk(
  'chats/fetchChatRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getRooms();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chats/fetchMessages',
  async ({ roomId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(roomId, page);
      return { roomId, messages: response.data.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chats/sendMessage',
  async ({ roomId, message }, { rejectWithValue }) => {
    try {
      // Send via Socket.IO for real-time delivery
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_message', {
          roomId,
          message,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Also send via API for persistence
      const response = await chatAPI.sendMessage(roomId, message);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'chats/markMessageAsRead',
  async ({ roomId, messageId }, { rejectWithValue }) => {
    try {
      await chatAPI.markAsRead(roomId, messageId);
      return { roomId, messageId };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const uploadChatMedia = createAsyncThunk(
  'chats/uploadChatMedia',
  async ({ roomId, mediaData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (mediaData.type === 'image') {
        formData.append('image', {
          uri: mediaData.uri,
          type: 'image/jpeg',
          name: 'chat_image.jpg',
        });
      } else if (mediaData.type === 'video') {
        formData.append('video', {
          uri: mediaData.uri,
          type: 'video/mp4',
          name: 'chat_video.mp4',
        });
      }
      
      formData.append('type', mediaData.type);
      formData.append('caption', mediaData.caption || '');
      
      const response = await chatAPI.uploadMedia(roomId, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chats/deleteMessage',
  async ({ roomId, messageId }, { rejectWithValue }) => {
    try {
      await chatAPI.deleteMessage(roomId, messageId);
      return { roomId, messageId };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const setTypingStatus = createAsyncThunk(
  'chats/setTypingStatus',
  async ({ roomId, isTyping }, { rejectWithValue, getState }) => {
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('typing', {
          roomId,
          isTyping,
        });
      }
      
      // Also send via API
      await chatAPI.setTyping(roomId, isTyping);
      return { roomId, isTyping };
    } catch (error) {
      // Don't fail the action if socket fails
      return { roomId, isTyping };
    }
  }
);

// Initial state
const initialState = {
  rooms: [],
  currentRoom: null,
  messages: {}, // { roomId: [messages] }
  messagePagination: {}, // { roomId: { page, hasMore, total } }
  typingUsers: {}, // { roomId: [userIds] }
  onlineUsers: new Set(),
  unreadCount: 0,
  socketConnected: false,
  loading: {
    fetchRooms: false,
    fetchMessages: false,
    sendMessage: false,
    uploadMedia: false,
  },
  error: null,
};

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearChatState: (state) => {
      state.rooms = [];
      state.currentRoom = null;
      state.messages = {};
      state.messagePagination = {};
      state.typingUsers = {};
      state.onlineUsers = new Set();
      state.unreadCount = 0;
      state.error = null;
    },
    
    // Socket.IO event handlers
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    addRoom: (state, action) => {
      const room = action.payload;
      const existingIndex = state.rooms.findIndex(r => r._id === room._id);
      if (existingIndex === -1) {
        state.rooms.unshift(room);
      } else {
        state.rooms[existingIndex] = room;
      }
    },
    updateRoom: (state, action) => {
      const { roomId, updates } = action.payload;
      const roomIndex = state.rooms.findIndex(r => r._id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex] = { ...state.rooms[roomIndex], ...updates };
      }
    },
    removeRoom: (state, action) => {
      const roomId = action.payload;
      state.rooms = state.rooms.filter(r => r._id !== roomId);
      delete state.messages[roomId];
      delete state.messagePagination[roomId];
      delete state.typingUsers[roomId];
      
      if (state.currentRoom && state.currentRoom._id === roomId) {
        state.currentRoom = null;
      }
    },
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload;
    },
    addMessageToRoom: (state, action) => {
      const { roomId, message, isOwn = false } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Check if message already exists
      const existingIndex = state.messages[roomId].findIndex(m => m._id === message._id);
      if (existingIndex === -1) {
        state.messages[roomId].push(message);
        
        // Update room's last message and unread count
        const roomIndex = state.rooms.findIndex(r => r._id === roomId);
        if (roomIndex !== -1) {
          state.rooms[roomIndex].lastMessage = message;
          state.rooms[roomIndex].updatedAt = message.createdAt;
          
          // Increment unread count if message is not from current user
          if (!isOwn) {
            state.rooms[roomIndex].unreadCount = (state.rooms[roomIndex].unreadCount || 0) + 1;
          }
        }
        
        // Update total unread count
        state.unreadCount = state.rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
      }
    },
    updateMessage: (state, action) => {
      const { roomId, messageId, updates } = action.payload;
      if (state.messages[roomId]) {
        const messageIndex = state.messages[roomId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          state.messages[roomId][messageIndex] = { 
            ...state.messages[roomId][messageIndex], 
            ...updates 
          };
        }
      }
    },
    removeMessage: (state, action) => {
      const { roomId, messageId } = action.payload;
      if (state.messages[roomId]) {
        state.messages[roomId] = state.messages[roomId].filter(m => m._id !== messageId);
      }
    },
    setMessagesForRoom: (state, action) => {
      const { roomId, messages, pagination } = action.payload;
      state.messages[roomId] = messages;
      state.messagePagination[roomId] = pagination;
    },
    prependMessagesToRoom: (state, action) => {
      const { roomId, messages } = action.payload;
      if (state.messages[roomId]) {
        state.messages[roomId] = [...messages, ...state.messages[roomId]];
      } else {
        state.messages[roomId] = messages;
      }
    },
    updateTypingUsers: (state, action) => {
      const { roomId, users } = action.payload;
      state.typingUsers[roomId] = users;
    },
    addTypingUser: (state, action) => {
      const { roomId, user } = action.payload;
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }
      if (!state.typingUsers[roomId].includes(user)) {
        state.typingUsers[roomId].push(user);
      }
    },
    removeTypingUser: (state, action) => {
      const { roomId, user } = action.payload;
      if (state.typingUsers[roomId]) {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(u => u !== user);
      }
    },
    markRoomAsRead: (state, action) => {
      const roomId = action.payload;
      const roomIndex = state.rooms.findIndex(r => r._id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].unreadCount = 0;
        state.unreadCount = state.rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
      }
    },
    addOnlineUser: (state, action) => {
      state.onlineUsers.add(action.payload);
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers.delete(action.payload);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = new Set(action.payload);
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Message reactions
    addReaction: (state, action) => {
      const { roomId, messageId, emoji, userId } = action.payload;
      if (state.messages[roomId]) {
        const messageIndex = state.messages[roomId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          const message = state.messages[roomId][messageIndex];
          if (!message.reactions) {
            message.reactions = {};
          }
          if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
          }
          if (!message.reactions[emoji].includes(userId)) {
            message.reactions[emoji].push(userId);
          }
        }
      }
    },
    removeReaction: (state, action) => {
      const { roomId, messageId, emoji, userId } = action.payload;
      if (state.messages[roomId]) {
        const messageIndex = state.messages[roomId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          const message = state.messages[roomId][messageIndex];
          if (message.reactions && message.reactions[emoji]) {
            message.reactions[emoji] = message.reactions[emoji].filter(id => id !== userId);
            if (message.reactions[emoji].length === 0) {
              delete message.reactions[emoji];
            }
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Chat Rooms
    builder
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading.fetchRooms = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading.fetchRooms = false;
        const { rooms, unreadCount } = action.payload;
        state.rooms = rooms;
        state.unreadCount = unreadCount;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading.fetchRooms = false;
        state.error = action.payload;
      });

    // Fetch Messages
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        state.loading.fetchMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading.fetchMessages = false;
        const { roomId, messages } = action.payload;
        state.messages[roomId] = messages.messages;
        state.messagePagination[roomId] = messages.pagination;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading.fetchMessages = false;
        state.error = action.payload;
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading.sendMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading.sendMessage = false;
        const message = action.payload;
        
        if (message.roomId) {
          if (!state.messages[message.roomId]) {
            state.messages[message.roomId] = [];
          }
          state.messages[message.roomId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading.sendMessage = false;
        state.error = action.payload;
      });

    // Mark Message as Read
    builder
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { roomId, messageId } = action.payload;
        if (state.messages[roomId]) {
          const messageIndex = state.messages[roomId].findIndex(m => m._id === messageId);
          if (messageIndex !== -1) {
            state.messages[roomId][messageIndex].isRead = true;
          }
        }
      })
      .addCase(markMessageAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Upload Chat Media
    builder
      .addCase(uploadChatMedia.pending, (state) => {
        state.loading.uploadMedia = true;
        state.error = null;
      })
      .addCase(uploadChatMedia.fulfilled, (state, action) => {
        state.loading.uploadMedia = false;
        const message = action.payload;
        
        if (message.roomId) {
          if (!state.messages[message.roomId]) {
            state.messages[message.roomId] = [];
          }
          state.messages[message.roomId].push(message);
        }
      })
      .addCase(uploadChatMedia.rejected, (state, action) => {
        state.loading.uploadMedia = false;
        state.error = action.payload;
      });

    // Delete Message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { roomId, messageId } = action.payload;
        if (state.messages[roomId]) {
          state.messages[roomId] = state.messages[roomId].filter(m => m._id !== messageId);
        }
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Set Typing Status
    builder
      .addCase(setTypingStatus.fulfilled, (state, action) => {
        const { roomId, isTyping } = action.payload;
        // This will be handled by socket events primarily
      })
      .addCase(setTypingStatus.rejected, (state, action) => {
        // Don't show error for typing status failures
      });
  },
});

export const {
  clearError,
  clearChatState,
  setSocketConnected,
  addRoom,
  updateRoom,
  removeRoom,
  setCurrentRoom,
  addMessageToRoom,
  updateMessage,
  removeMessage,
  setMessagesForRoom,
  prependMessagesToRoom,
  updateTypingUsers,
  addTypingUser,
  removeTypingUser,
  markRoomAsRead,
  addOnlineUser,
  removeOnlineUser,
  setOnlineUsers,
  setLoading,
  setError,
  addReaction,
  removeReaction,
} = chatSlice.actions;

export default chatSlice.reducer;

// Selectors
export const selectChatRooms = (state) => state.chats.rooms;
export const selectCurrentRoom = (state) => state.chats.currentRoom;
export const selectMessages = (state, roomId) => state.chats.messages[roomId] || [];
export const selectMessagePagination = (state, roomId) => state.chats.messagePagination[roomId];
export const selectTypingUsers = (state, roomId) => state.chats.typingUsers[roomId] || [];
export const selectOnlineUsers = (state) => Array.from(state.chats.onlineUsers);
export const selectUnreadCount = (state) => state.chats.unreadCount;
export const selectSocketConnected = (state) => state.chats.socketConnected;
export const selectChatLoading = (state) => state.chats.loading;
export const selectChatError = (state) => state.chats.error;