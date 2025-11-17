import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bookings: [],
  currentBooking: null,
  upcomingBookings: [],
  pastBookings: [],
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload;
      const now = new Date();
      state.upcomingBookings = action.payload.filter(b => new Date(b.date) >= now);
      state.pastBookings = action.payload.filter(b => new Date(b.date) < now);
    },
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload);
      if (new Date(action.payload.date) >= new Date()) {
        state.upcomingBookings.unshift(action.payload);
      }
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...action.payload };
      }
    },
    cancelBooking: (state, action) => {
      const booking = state.bookings.find(b => b.id === action.payload);
      if (booking) {
        booking.status = 'cancelled';
      }
      state.upcomingBookings = state.upcomingBookings.filter(b => b.id !== action.payload);
    },
    completeBooking: (state, action) => {
      const booking = state.bookings.find(b => b.id === action.payload);
      if (booking) {
        booking.status = 'completed';
      }
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
  setBookings,
  addBooking,
  setCurrentBooking,
  updateBooking,
  cancelBooking,
  completeBooking,
  setLoading,
  setError,
} = bookingSlice.actions;

export default bookingSlice.reducer;
