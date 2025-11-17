import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Update this for production
const SOCKET_URL = 'http://localhost:5000'; // Socket.IO server URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token is invalid, redirect to login
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        // Navigation will be handled by the component
      }
    }

    return Promise.reject(error);
  }
);

// Socket.IO configuration
let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error) => {
      console.log('Socket.IO connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Authentication API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  verifyPhone: (token) => api.post('/auth/verify-phone', { token }),
  sendOTP: (type, data) => api.post('/auth/send-otp', { type, ...data }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  uploadPhotos: (formData) => api.post('/user/photos', formData),
  deletePhoto: (photoId) => api.delete(`/user/photos/${photoId}`),
  updatePreferences: (preferences) => api.put('/user/preferences', preferences),
  deleteAccount: () => api.delete('/user/account'),
  updateLocation: (location) => api.put('/user/location', location),
};

// Companion API
export const companionAPI = {
  search: (params) => api.get('/companions/search', { params }),
  getDetails: (id) => api.get(`/companions/${id}`),
  createProfile: (data) => api.post('/companions', data),
  updateProfile: (id, data) => api.put(`/companions/${id}`, data),
  deleteProfile: (id) => api.delete(`/companions/${id}`),
  updateAvailability: (id, availability) => api.put(`/companions/${id}/availability`, { availability }),
  updateRates: (id, rates) => api.put(`/companions/${id}/rates`, { rates }),
  uploadPortfolio: (id, formData) => api.post(`/companions/${id}/portfolio`, formData),
};

// Match API
export const matchAPI = {
  swipe: (companionId, action) => api.post('/matches/swipe', { companionId, action }),
  getMatches: () => api.get('/matches'),
  getMatchDetails: (matchId) => api.get(`/matches/${matchId}`),
  unmatch: (matchId) => api.delete(`/matches/${matchId}`),
  superLike: (companionId) => api.post('/matches/super-like', { companionId }),
  getSwipeQueue: () => api.get('/matches/queue'),
};

// Booking API
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getUserBookings: () => api.get('/bookings/user'),
  getCompanionBookings: () => api.get('/bookings/companion'),
  getDetails: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  confirm: (id) => api.put(`/bookings/${id}/confirm`),
  complete: (id) => api.put(`/bookings/${id}/complete`),
  reschedule: (id, newDateTime) => api.put(`/bookings/${id}/reschedule`, { newDateTime }),
  getAvailability: (companionId, date) => api.get(`/bookings/availability/${companionId}`, { params: { date } }),
};

// Payment API
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  getDetails: (id) => api.get(`/payments/${id}`),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
  getPaymentMethods: () => api.get('/payments/methods'),
  updatePaymentMethod: (data) => api.put('/payments/method', data),
};

// Chat API
export const chatAPI = {
  getRooms: () => api.get('/chat/rooms'),
  getMessages: (roomId, page = 1) => api.get(`/chat/rooms/${roomId}/messages`, { params: { page } }),
  sendMessage: (roomId, message) => api.post(`/chat/rooms/${roomId}/messages`, message),
  markAsRead: (roomId, messageId) => api.put(`/chat/rooms/${roomId}/messages/${messageId}/read`),
  uploadMedia: (roomId, formData) => api.post(`/chat/rooms/${roomId}/media`, formData),
  deleteMessage: (roomId, messageId) => api.delete(`/chat/rooms/${roomId}/messages/${messageId}`),
  getTyping: (roomId) => api.get(`/chat/rooms/${roomId}/typing`),
  setTyping: (roomId, isTyping) => api.post(`/chat/rooms/${roomId}/typing`, { isTyping }),
};

// Review API
export const reviewAPI = {
  create: (bookingId, data) => api.post('/reviews', { bookingId, ...data }),
  getUserReviews: () => api.get('/reviews/user'),
  getCompanionReviews: (companionId) => api.get(`/reviews/companion/${companionId}`),
  getDetails: (id) => api.get(`/reviews/${id}`),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  report: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  updateSettings: (settings) => api.put('/notifications/settings', { settings }),
  getSettings: () => api.get('/notifications/settings'),
};

// Location API
export const locationAPI = {
  updateLocation: (coords) => api.put('/user/location', coords),
  getNearby: (coords, radius = 50) => api.get('/location/nearby', { params: { ...coords, radius } }),
  updatePreferences: (preferences) => api.put('/location/preferences', preferences),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return data.message || 'Bad request';
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 409:
        return data.message || 'Conflict occurred';
      case 422:
        return data.message || 'Validation error';
      case 429:
        return 'Too many requests, please try again later';
      case 500:
        return 'Internal server error';
      default:
        return data.message || 'An error occurred';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return 'An unexpected error occurred';
  }
};

export const uploadFile = async (uri, type = 'profile', fileName = 'image.jpg') => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // Web implementation
    formData.append('file', {
      uri: uri,
      type: type,
      name: fileName,
    });
  } else {
    // Native implementation
    formData.append('file', {
      uri: uri,
      type: type,
      name: fileName,
    });
  }

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const downloadFile = async (url) => {
  try {
    const response = await api.get(`/download/${url}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export default api;