import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationAPI, handleApiError } from '../../services/api';

// Async thunks for notification actions
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.markAllAsRead();
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationAPI.delete(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateNotificationSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.updateSettings(settings);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchNotificationSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getSettings();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    push: {
      enabled: true,
      sound: true,
      vibration: true,
      badge: true,
    },
    email: {
      enabled: true,
      marketing: false,
      booking: true,
      messages: true,
      matches: true,
    },
    sms: {
      enabled: false,
      urgentOnly: true,
    },
    inApp: {
      enabled: true,
      sound: true,
      showPreview: true,
    },
    types: {
      matches: {
        enabled: true,
        immediate: true,
      },
      messages: {
        enabled: true,
        immediate: true,
        showPreview: true,
      },
      bookings: {
        enabled: true,
        immediate: true,
        statusUpdates: true,
        reminders: true,
      },
      payments: {
        enabled: true,
        immediate: true,
        receipts: true,
      },
      reviews: {
        enabled: true,
        immediate: true,
      },
      promotions: {
        enabled: false,
        weekly: true,
        events: false,
      },
      system: {
        enabled: true,
        immediate: true,
        security: true,
      },
    },
    schedule: {
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      weekend: {
        enabled: true,
        schedule: 'normal',
      },
      timezone: 'auto',
    },
  },
  filter: {
    type: 'all', // 'all', 'match', 'message', 'booking', 'payment', 'review', 'system', 'promotion'
    status: 'all', // 'all', 'read', 'unread'
    priority: 'all', // 'all', 'high', 'normal', 'low'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  statistics: {
    totalNotifications: 0,
    readNotifications: 0,
    unreadNotifications: 0,
    byType: {},
    byPriority: {},
    averageResponseTime: 0,
  },
  loading: {
    fetchNotifications: false,
    markAsRead: false,
    markAllAsRead: false,
    delete: false,
    updateSettings: false,
    fetchSettings: false,
  },
  error: null,
  hasMore: true,
  lastSync: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNotificationState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.statistics = initialState.statistics;
      state.error = null;
      state.lastSync = null;
    },
    addNotification: (state, action) => {
      const notification = action.payload;
      
      // Check if notification already exists
      const existingIndex = state.notifications.findIndex(n => n._id === notification._id);
      if (existingIndex === -1) {
        state.notifications.unshift(notification);
        
        if (!notification.read) {
          state.unreadCount += 1;
        }
        
        // Update statistics
        state.statistics.totalNotifications += 1;
        if (notification.read) {
          state.statistics.readNotifications += 1;
        } else {
          state.statistics.unreadNotifications += 1;
        }
        
        // Update type statistics
        if (!state.statistics.byType[notification.type]) {
          state.statistics.byType[notification.type] = 0;
        }
        state.statistics.byType[notification.type] += 1;
        
        // Update priority statistics
        if (!state.statistics.byPriority[notification.priority]) {
          state.statistics.byPriority[notification.priority] = 0;
        }
        state.statistics.byPriority[notification.priority] += 1;
      }
    },
    updateNotification: (state, action) => {
      const { notificationId, updates } = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      
      if (notification) {
        const wasUnread = !notification.read;
        const isUnread = !updates.read;
        
        Object.assign(notification, updates);
        
        // Update unread count if status changed
        if (wasUnread && isUnread === false) {
          state.unreadCount -= 1;
          state.statistics.readNotifications += 1;
          state.statistics.unreadNotifications -= 1;
        } else if (!wasUnread && isUnread) {
          state.unreadCount += 1;
          state.statistics.readNotifications -= 1;
          state.statistics.unreadNotifications += 1;
        }
      }
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      
      if (notification) {
        if (!notification.read) {
          state.unreadCount -= 1;
          state.statistics.unreadNotifications -= 1;
        } else {
          state.statistics.readNotifications -= 1;
        }
        
        state.statistics.totalNotifications -= 1;
        
        // Update type statistics
        if (state.statistics.byType[notification.type]) {
          state.statistics.byType[notification.type] -= 1;
          if (state.statistics.byType[notification.type] === 0) {
            delete state.statistics.byType[notification.type];
          }
        }
        
        // Update priority statistics
        if (state.statistics.byPriority[notification.priority]) {
          state.statistics.byPriority[notification.priority] -= 1;
          if (state.statistics.byPriority[notification.priority] === 0) {
            delete state.statistics.byPriority[notification.priority];
          }
        }
      }
      
      state.notifications = state.notifications.filter(n => n._id !== notificationId);
    },
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount -= 1;
        state.statistics.readNotifications += 1;
        state.statistics.unreadNotifications -= 1;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
      state.statistics.readNotifications = state.statistics.totalNotifications;
      state.statistics.unreadNotifications = 0;
    },
    markAllAsReadLocal: (state) => {
      // Local version without API call for optimistic updates
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
      state.statistics.readNotifications = state.statistics.totalNotifications;
      state.statistics.unreadNotifications = 0;
    },
    setSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    updateSettingsSection: (state, action) => {
      const { section, updates } = action.payload;
      if (state.settings[section]) {
        state.settings[section] = { ...state.settings[section], ...updates };
      }
    },
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearFilter: (state) => {
      state.filter = initialState.filter;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    calculateStatistics: (state, action) => {
      const notifications = action.payload;
      const stats = {
        totalNotifications: notifications.length,
        readNotifications: notifications.filter(n => n.read).length,
        unreadNotifications: notifications.filter(n => !n.read).length,
        byType: {},
        byPriority: {},
        averageResponseTime: 0,
      };
      
      // Calculate type distribution
      notifications.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = 0;
        }
        stats.byType[notification.type] += 1;
        
        if (!stats.byPriority[notification.priority]) {
          stats.byPriority[notification.priority] = 0;
        }
        stats.byPriority[notification.priority] += 1;
      });
      
      state.statistics = stats;
    },
    setLastSync: (state, action) => {
      state.lastSync = action.payload;
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
      state.hasMore = true;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Fetch Notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.fetchNotifications = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.fetchNotifications = false;
        const { notifications, pagination } = action.payload;
        
        if (action.meta.arg?.page === 1) {
          state.notifications = notifications;
        } else {
          // Append for pagination
          state.notifications = [...state.notifications, ...notifications];
        }
        
        state.pagination = pagination;
        state.hasMore = pagination.hasMore;
        
        // Update statistics
        const allNotifications = action.meta.arg?.page === 1 ? notifications : state.notifications;
        const stats = {
          totalNotifications: allNotifications.length,
          readNotifications: allNotifications.filter(n => n.read).length,
          unreadNotifications: allNotifications.filter(n => !n.read).length,
          byType: {},
          byPriority: {},
          averageResponseTime: 0,
        };
        
        // Calculate type and priority distributions
        allNotifications.forEach(notification => {
          if (!stats.byType[notification.type]) {
            stats.byType[notification.type] = 0;
          }
          stats.byType[notification.type] += 1;
          
          if (!stats.byPriority[notification.priority]) {
            stats.byPriority[notification.priority] = 0;
          }
          stats.byPriority[notification.priority] += 1;
        });
        
        state.statistics = stats;
        state.unreadCount = stats.unreadNotifications;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.fetchNotifications = false;
        state.error = action.payload;
      });

    // Mark Notification as Read
    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading.markAsRead = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading.markAsRead = false;
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n._id === notificationId);
        
        if (notification && !notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount -= 1;
          state.statistics.readNotifications += 1;
          state.statistics.unreadNotifications -= 1;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading.markAsRead = false;
        state.error = action.payload;
      });

    // Mark All Notifications as Read
    builder
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading.markAllAsRead = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.loading.markAllAsRead = false;
        // Mark all as read locally for immediate feedback
        state.notifications.forEach(notification => {
          if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
        state.statistics.readNotifications = state.statistics.totalNotifications;
        state.statistics.unreadNotifications = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading.markAllAsRead = false;
        state.error = action.payload;
      });

    // Delete Notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading.delete = false;
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n._id === notificationId);
        
        if (notification) {
          if (!notification.read) {
            state.unreadCount -= 1;
            state.statistics.unreadNotifications -= 1;
          } else {
            state.statistics.readNotifications -= 1;
          }
          
          state.statistics.totalNotifications -= 1;
        }
        
        state.notifications = state.notifications.filter(n => n._id !== notificationId);
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      });

    // Update Notification Settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.loading.updateSettings = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.loading.updateSettings = false;
        const updatedSettings = action.payload;
        state.settings = { ...state.settings, ...updatedSettings };
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.loading.updateSettings = false;
        state.error = action.payload;
      });

    // Fetch Notification Settings
    builder
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.loading.fetchSettings = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.loading.fetchSettings = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.loading.fetchSettings = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearNotificationState,
  addNotification,
  updateNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  markAllAsReadLocal,
  setSettings,
  updateSettingsSection,
  setFilter,
  clearFilter,
  setLoading,
  setError,
  calculateStatistics,
  setLastSync,
  resetPagination,
  updatePagination,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectNotificationFilter = (state) => state.notifications.filter;
export const selectNotificationPagination = (state) => state.notifications.pagination;
export const selectNotificationStatistics = (state) => state.notifications.statistics;
export const selectNotificationLoading = (state) => state.notifications.loading;
export const selectNotificationError = (state) => state.notifications.error;
export const selectHasMoreNotifications = (state) => state.notifications.hasMore;
export const selectLastSync = (state) => state.notifications.lastSync;