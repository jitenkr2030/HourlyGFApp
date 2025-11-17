// Configuration Constants
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-production-api.com/api';

export const SOCKET_URL = __DEV__
  ? 'ws://localhost:3000'
  : 'wss://your-production-api.com';

// Razorpay
export const RAZORPAY_KEY_ID = __DEV__
  ? 'rzp_test_xxxxxxxxxxxxxxx'
  : 'rzp_live_xxxxxxxxxxxxxxx';

// Cashfree
export const CASHFREE_APP_ID = 'your_cashfree_app_id';
export const CASHFREE_ENV = __DEV__ ? 'TEST' : 'PROD';

// Google Maps
export const GOOGLE_MAPS_API_KEY = 'your_google_maps_api_key';

// Firebase
export const FIREBASE_CONFIG = {
  apiKey: 'your_firebase_api_key',
  authDomain: 'your_firebase_auth_domain',
  projectId: 'your_firebase_project_id',
  storageBucket: 'your_firebase_storage_bucket',
  messagingSenderId: 'your_messaging_sender_id',
  appId: 'your_app_id',
};

// App Configuration
export const APP_CONFIG = {
  MAX_PHOTO_UPLOAD: 6,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SWIPE_THRESHOLD: 120,
  MATCH_RADIUS: 50, // km
  MIN_AGE: 18,
  MAX_AGE: 100,
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 50000,
  CURRENCY: 'INR',
  BOOKING_FEE_PERCENTAGE: 10,
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  RAZORPAY_KEY_ID,
  CASHFREE_APP_ID,
  CASHFREE_ENV,
  GOOGLE_MAPS_API_KEY,
  FIREBASE_CONFIG,
  APP_CONFIG,
  PAYMENT_CONFIG,
};
