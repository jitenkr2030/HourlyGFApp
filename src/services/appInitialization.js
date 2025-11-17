import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth } from '../store/slices/authSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { fetchMatches } from '../store/slices/matchSlice';
import { fetchChatRooms } from '../store/slices/chatSlice';
import { fetchUserBookings } from '../store/slices/bookingSlice';
import { fetchUserReviews } from '../store/slices/reviewSlice';
import { fetchNotifications } from '../store/slices/notificationSlice';
import { fetchPaymentHistory } from '../store/slices/paymentSlice';
import socketService from './socketService';

// App initialization service
class AppInitializationService {
  constructor() {
    this.initialized = false;
    this.initializationPromise = null;
  }

  // Main initialization method
  async initializeApp(store) {
    if (this.initialized) {
      return this.initializationPromise;
    }

    console.log('Initializing HourlyGF App...');
    this.initialized = true;
    
    this.initializationPromise = this.performInitialization(store);
    return this.initializationPromise;
  }

  // Perform all initialization steps
  async performInitialization(store) {
    try {
      // Step 1: Check authentication status
      await this.checkAuthentication(store);

      // Step 2: Initialize Socket.IO if authenticated
      const authState = store.getState().auth;
      if (authState.isAuthenticated) {
        await this.initializeSocketConnection();
      }

      // Step 3: Load initial data if authenticated
      if (authState.isAuthenticated) {
        await this.loadInitialData(store);
      }

      console.log('App initialization completed successfully');
      return { success: true };
    } catch (error) {
      console.error('App initialization failed:', error);
      this.initialized = false;
      throw error;
    }
  }

  // Check authentication status and initialize auth state
  async checkAuthentication(store) {
    try {
      console.log('Checking authentication status...');
      
      // Dispatch initializeAuth to check stored tokens
      const result = await store.dispatch(initializeAuth());
      
      if (initializeAuth.fulfilled.match(result)) {
        console.log('Authentication check successful');
        return true;
      } else {
        console.log('Authentication check failed, user not logged in');
        return false;
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  // Initialize Socket.IO connection
  async initializeSocketConnection() {
    try {
      console.log('Initializing Socket.IO connection...');
      
      // Initialize socket service
      socketService.initialize();
      
      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 10000);

        socketService.on('connect', () => {
          clearTimeout(timeout);
          console.log('Socket.IO connection established');
          resolve(true);
        });

        socketService.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('Socket.IO connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
      // Don't fail app initialization for socket errors
      return false;
    }
  }

  // Load all initial app data
  async loadInitialData(store) {
    console.log('Loading initial app data...');
    
    const dispatch = store.dispatch;
    
    try {
      // Load data in parallel for better performance
      const dataPromises = [
        dispatch(fetchUserProfile()).unwrap().catch(err => {
          console.warn('Failed to fetch user profile:', err);
          return null;
        }),
        dispatch(fetchMatches()).unwrap().catch(err => {
          console.warn('Failed to fetch matches:', err);
          return null;
        }),
        dispatch(fetchChatRooms()).unwrap().catch(err => {
          console.warn('Failed to fetch chat rooms:', err);
          return null;
        }),
        dispatch(fetchUserBookings()).unwrap().catch(err => {
          console.warn('Failed to fetch bookings:', err);
          return null;
        }),
        dispatch(fetchUserReviews()).unwrap().catch(err => {
          console.warn('Failed to fetch reviews:', err);
          return null;
        }),
        dispatch(fetchNotifications()).unwrap().catch(err => {
          console.warn('Failed to fetch notifications:', err);
          return null;
        }),
        dispatch(fetchPaymentHistory()).unwrap().catch(err => {
          console.warn('Failed to fetch payment history:', err);
          return null;
        }),
      ];

      // Wait for all data to load
      const results = await Promise.allSettled(dataPromises);
      
      // Log results
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Initial data loaded: ${successful} successful, ${failed} failed`);
      
      return true;
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Don't fail app initialization for data loading errors
      return false;
    }
  }

  // Handle authentication state changes
  onAuthenticationStateChange(store, callback) {
    let previousAuthState = store.getState().auth.isAuthenticated;

    // Subscribe to auth state changes
    const unsubscribe = store.subscribe(() => {
      const currentAuthState = store.getState().auth.isAuthenticated;
      
      if (currentAuthState !== previousAuthState) {
        console.log('Auth state changed:', currentAuthState);
        previousAuthState = currentAuthState;
        
        if (callback) {
          callback(currentAuthState, store.getState().auth);
        }

        // Handle Socket.IO connection based on auth state
        if (currentAuthState) {
          this.handleLogin(store);
        } else {
          this.handleLogout();
        }
      }
    });

    return unsubscribe;
  }

  // Handle successful login
  async handleLogin(store) {
    console.log('Handling login...');
    
    try {
      // Initialize socket connection
      await this.initializeSocketConnection();
      
      // Load user data
      await this.loadInitialData(store);
      
      console.log('Login handling completed');
    } catch (error) {
      console.error('Error handling login:', error);
    }
  }

  // Handle logout
  handleLogout() {
    console.log('Handling logout...');
    
    try {
      // Disconnect socket
      socketService.disconnect();
      
      console.log('Logout handling completed');
    } catch (error) {
      console.error('Error handling logout:', error);
    }
  }

  // Refresh authentication tokens
  async refreshTokens(store) {
    try {
      console.log('Refreshing authentication tokens...');
      
      // This would be handled by the auth slice's refreshToken thunk
      const result = await store.dispatch(initializeAuth());
      
      if (initializeAuth.fulfilled.match(result)) {
        console.log('Token refresh successful');
        return true;
      } else {
        console.log('Token refresh failed');
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // App background/foreground handlers
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'active') {
      // App came to foreground
      console.log('App came to foreground');
      this.handleAppResume();
    } else if (nextAppState === 'background') {
      // App went to background
      console.log('App went to background');
      this.handleAppPause();
    }
  }

  // Handle app resume (foreground)
  handleAppResume() {
    console.log('Handling app resume...');
    
    // Reconnect Socket.IO if needed
    if (!socketService.isConnected()) {
      socketService.initialize();
    }
    
    // Refresh data if needed
    // This could include checking for new notifications, messages, etc.
  }

  // Handle app pause (background)
  handleAppPause() {
    console.log('Handling app pause...');
    
    // Socket.IO will handle connection management automatically
    // We might want to pause some background processes here
  }

  // Clean up on app unmount
  cleanup() {
    console.log('Cleaning up app initialization service...');
    
    socketService.disconnect();
    this.initialized = false;
    this.initializationPromise = null;
  }

  // Get initialization status
  isInitialized() {
    return this.initialized;
  }

  // Get Socket.IO service instance
  getSocketService() {
    return socketService;
  }
}

// Create singleton instance
const appInitializationService = new AppInitializationService();

export default appInitializationService;