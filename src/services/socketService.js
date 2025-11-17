import { io } from 'socket.io-client';
import { store } from '../store/store';
import {
  setSocketConnected,
  addMessageToRoom,
  updateTypingUsers,
  addOnlineUser,
  removeOnlineUser,
  setOnlineUsers,
  markRoomAsRead,
} from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/notificationSlice';

// Socket configuration
const SOCKET_URL = 'http://localhost:5000'; // Update for production

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
  }

  // Initialize socket connection
  initialize() {
    if (this.socket) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  // Set up all socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Update Redux store
      store.dispatch(setSocketConnected(true));
      
      // Join user to their personal room for notifications
      this.socket.emit('join_user_room');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      this.connected = false;
      
      // Update Redux store
      store.dispatch(setSocketConnected(false));
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket.IO connection error:', error);
      this.connected = false;
      
      // Update Redux store
      store.dispatch(setSocketConnected(false));
      
      // Attempt reconnection
      this.handleReconnection();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts');
      this.connected = true;
      store.dispatch(setSocketConnected(true));
    });

    this.socket.on('reconnect_error', (error) => {
      console.log('Socket.IO reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.log('Socket.IO reconnection failed');
    });

    // Chat events
    this.socket.on('new_message', (data) => {
      console.log('Received new message:', data);
      store.dispatch(addMessageToRoom({
        roomId: data.roomId,
        message: data.message,
        isOwn: false,
      }));
    });

    this.socket.on('message_delivered', (data) => {
      console.log('Message delivered:', data);
      // Update message status to delivered
    });

    this.socket.on('message_read', (data) => {
      console.log('Message read:', data);
      // Update message status to read
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data);
      store.dispatch(updateTypingUsers({
        roomId: data.roomId,
        users: data.users,
      }));
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log('User stopped typing:', data);
      store.dispatch(updateTypingUsers({
        roomId: data.roomId,
        users: data.users,
      }));
    });

    // Online status events
    this.socket.on('user_online', (data) => {
      console.log('User online:', data);
      store.dispatch(addOnlineUser(data.userId));
    });

    this.socket.on('user_offline', (data) => {
      console.log('User offline:', data);
      store.dispatch(removeOnlineUser(data.userId));
    });

    this.socket.on('online_users', (data) => {
      console.log('Online users:', data);
      store.dispatch(setOnlineUsers(data.users));
    });

    // Notification events
    this.socket.on('new_notification', (notification) => {
      console.log('New notification:', notification);
      store.dispatch(addNotification(notification));
    });

    // Booking events
    this.socket.on('booking_status_changed', (data) => {
      console.log('Booking status changed:', data);
      store.dispatch(addNotification({
        _id: `booking_${Date.now()}`,
        type: 'booking',
        title: 'Booking Update',
        message: `Your booking status has been updated to ${data.status}`,
        priority: 'normal',
        read: false,
        createdAt: new Date().toISOString(),
        data: data,
      }));
    });

    this.socket.on('booking_reminder', (data) => {
      console.log('Booking reminder:', data);
      store.dispatch(addNotification({
        _id: `reminder_${Date.now()}`,
        type: 'booking',
        title: 'Booking Reminder',
        message: `Your booking with ${data.companionName} starts in ${data.timeUntil}`,
        priority: 'high',
        read: false,
        createdAt: new Date().toISOString(),
        data: data,
      }));
    });

    // Match events
    this.socket.on('new_match', (data) => {
      console.log('New match:', data);
      store.dispatch(addNotification({
        _id: `match_${Date.now()}`,
        type: 'match',
        title: 'New Match!',
        message: `You have a new match with ${data.companionName}`,
        priority: 'high',
        read: false,
        createdAt: new Date().toISOString(),
        data: data,
      }));
    });

    // Review events
    this.socket.on('new_review_received', (data) => {
      console.log('New review received:', data);
      store.dispatch(addNotification({
        _id: `review_${Date.now()}`,
        type: 'review',
        title: 'New Review',
        message: `${data.reviewerName} left you a review`,
        priority: 'normal',
        read: false,
        createdAt: new Date().toISOString(),
        data: data,
      }));
    });

    // Payment events
    this.socket.on('payment_completed', (data) => {
      console.log('Payment completed:', data);
      store.dispatch(addNotification({
        _id: `payment_${Date.now()}`,
        type: 'payment',
        title: 'Payment Completed',
        message: `Your payment of ₹${data.amount} has been processed successfully`,
        priority: 'normal',
        read: false,
        createdAt: new Date().toISOString(),
        data: data,
      }));
    });

    this.socket.on('payment_failed', (data) => {
      console.log('Payment failed:', data);
      store.dispatch(addNotification({
        _id: `payment_fail_${Date.now()}`,
        type: 'payment',
        title: 'Payment Failed',
        message: `Your payment of ₹${data.amount} failed to process`,
        priority: 'high',
        read: false,
        createdAt: new Date().toISOString(),
        data: data,
      }));
    });

    // System events
    this.socket.on('system_notification', (notification) => {
      console.log('System notification:', notification);
      store.dispatch(addNotification(notification));
    });

    // Error events
    this.socket.on('error', (error) => {
      console.log('Socket.IO error:', error);
      // Handle specific socket errors
    });
  }

  // Handle reconnection logic
  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.connected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.log('Maximum reconnection attempts reached');
    }
  }

  // Chat methods
  joinRoom(roomId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_room', { roomId });
      console.log('Joined room:', roomId);
    }
  }

  leaveRoom(roomId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_room', { roomId });
      console.log('Left room:', roomId);
    }
  }

  sendMessage(roomId, message) {
    if (this.socket && this.connected) {
      this.socket.emit('send_message', {
        roomId,
        message,
        timestamp: new Date().toISOString(),
      });
      console.log('Sent message:', { roomId, message });
    }
  }

  markMessageAsRead(roomId, messageId) {
    if (this.socket && this.connected) {
      this.socket.emit('message_read', { roomId, messageId });
    }
  }

  setTyping(roomId, isTyping) {
    if (this.socket && this.connected) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  // Room management
  joinMatchRoom(matchId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_match_room', { matchId });
    }
  }

  leaveMatchRoom(matchId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_match_room', { matchId });
    }
  }

  // User presence
  setUserOnline() {
    if (this.socket && this.connected) {
      this.socket.emit('user_online');
    }
  }

  setUserOffline() {
    if (this.socket && this.connected) {
      this.socket.emit('user_offline');
    }
  }

  // Booking events
  joinBookingRoom(bookingId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_booking_room', { bookingId });
    }
  }

  leaveBookingRoom(bookingId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_booking_room', { bookingId });
    }
  }

  // Utility methods
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      store.dispatch(setSocketConnected(false));
    }
  }

  // Event emitter for custom events
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  // Event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // One-time event listener
  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;