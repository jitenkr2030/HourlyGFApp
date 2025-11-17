import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Import slices
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import companionReducer from './slices/companionSlice';
import matchReducer from './slices/matchSlice';
import chatReducer from './slices/chatSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/paymentSlice';
import reviewReducer from './slices/reviewSlice';
import locationReducer from './slices/locationSlice';
import notificationReducer from './slices/notificationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'preferences'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  companions: companionReducer,
  matches: matchReducer,
  chats: chatReducer,
  bookings: bookingReducer,
  payments: paymentReducer,
  reviews: reviewReducer,
  location: locationReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
