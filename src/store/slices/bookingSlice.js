import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingAPI, handleApiError } from '../../services/api';

// Async thunks for booking actions
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.create(bookingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getUserBookings();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchCompanionBookings = createAsyncThunk(
  'bookings/fetchCompanionBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getCompanionBookings();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchBookingDetails = createAsyncThunk(
  'bookings/fetchBookingDetails',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getDetails(bookingId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateBookingStatus',
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      let response;
      switch (status) {
        case 'confirmed':
          response = await bookingAPI.confirm(bookingId);
          break;
        case 'completed':
          response = await bookingAPI.complete(bookingId);
          break;
        default:
          response = await bookingAPI.updateStatus(bookingId, status);
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.cancel(bookingId, reason);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const rescheduleBooking = createAsyncThunk(
  'bookings/rescheduleBooking',
  async ({ bookingId, newDateTime }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.reschedule(bookingId, newDateTime);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchAvailability = createAsyncThunk(
  'bookings/fetchAvailability',
  async ({ companionId, date }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getAvailability(companionId, date);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
const initialState = {
  bookings: [],
  upcomingBookings: [],
  pastBookings: [],
  currentBooking: null,
  bookingDetails: null,
  availability: {}, // { companionId: { date: [timeSlots] } }
  filters: {
    status: 'all', // 'all', 'pending', 'confirmed', 'completed', 'cancelled'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
    sortBy: 'date', // 'date', 'createdAt', 'price'
    sortOrder: 'desc', // 'asc', 'desc'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  statistics: {
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
  },
  loading: {
    create: false,
    fetchUserBookings: false,
    fetchCompanionBookings: false,
    fetchDetails: false,
    updateStatus: false,
    cancel: false,
    reschedule: false,
    fetchAvailability: false,
  },
  error: null,
  hasMore: true,
};

// Helper function to categorize bookings
const categorizeBookings = (bookings) => {
  const now = new Date();
  const upcoming = [];
  const past = [];
  const cancelled = [];

  bookings.forEach(booking => {
    const bookingDate = new Date(booking.startTime);
    
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      cancelled.push(booking);
    } else if (bookingDate >= now) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  });

  return { upcoming, past, cancelled };
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBookingState: (state) => {
      state.bookings = [];
      state.upcomingBookings = [];
      state.pastBookings = [];
      state.currentBooking = null;
      state.bookingDetails = null;
      state.availability = {};
      state.statistics = initialState.statistics;
      state.error = null;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    updateBookingLocally: (state, action) => {
      const { bookingId, updates } = action.payload;
      
      // Update in main bookings array
      const bookingIndex = state.bookings.findIndex(b => b._id === bookingId);
      if (bookingIndex !== -1) {
        state.bookings[bookingIndex] = { ...state.bookings[bookingIndex], ...updates };
      }
      
      // Update in upcoming bookings
      const upcomingIndex = state.upcomingBookings.findIndex(b => b._id === bookingId);
      if (upcomingIndex !== -1) {
        state.upcomingBookings[upcomingIndex] = { ...state.upcomingBookings[upcomingIndex], ...updates };
      }
      
      // Update in past bookings
      const pastIndex = state.pastBookings.findIndex(b => b._id === bookingId);
      if (pastIndex !== -1) {
        state.pastBookings[pastIndex] = { ...state.pastBookings[pastIndex], ...updates };
      }
      
      // Update current booking if it matches
      if (state.currentBooking && state.currentBooking._id === bookingId) {
        state.currentBooking = { ...state.currentBooking, ...updates };
      }
      
      // Update booking details if it matches
      if (state.bookingDetails && state.bookingDetails._id === bookingId) {
        state.bookingDetails = { ...state.bookingDetails, ...updates };
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateAvailability: (state, action) => {
      const { companionId, date, timeSlots } = action.payload;
      if (!state.availability[companionId]) {
        state.availability[companionId] = {};
      }
      state.availability[companionId][date] = timeSlots;
    },
    calculateStatistics: (state, action) => {
      const bookings = action.payload;
      const stats = {
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled' || b.status === 'refunded').length,
        totalRevenue: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        averageRating: 0, // This would need to be calculated from reviews
      };
      state.statistics = stats;
    },
    addBooking: (state, action) => {
      const booking = action.payload;
      state.bookings.unshift(booking);
      
      const { upcoming, past } = categorizeBookings([booking]);
      state.upcomingBookings = [...upcoming, ...state.upcomingBookings];
      state.pastBookings = [...past, ...state.pastBookings];
    },
    removeBooking: (state, action) => {
      const bookingId = action.payload;
      state.bookings = state.bookings.filter(b => b._id !== bookingId);
      state.upcomingBookings = state.upcomingBookings.filter(b => b._id !== bookingId);
      state.pastBookings = state.pastBookings.filter(b => b._id !== bookingId);
      
      if (state.currentBooking && state.currentBooking._id === bookingId) {
        state.currentBooking = null;
      }
      
      if (state.bookingDetails && state.bookingDetails._id === bookingId) {
        state.bookingDetails = null;
      }
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    // Create Booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading.create = false;
        const booking = action.payload;
        
        state.bookings.unshift(booking);
        
        const { upcoming, past } = categorizeBookings([booking]);
        state.upcomingBookings = [...upcoming, ...state.upcomingBookings];
        state.pastBookings = [...past, ...state.pastBookings];
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      });

    // Fetch User Bookings
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading.fetchUserBookings = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading.fetchUserBookings = false;
        const { bookings, pagination, statistics } = action.payload;
        
        state.bookings = bookings;
        state.pagination = pagination;
        state.statistics = statistics || initialState.statistics;
        
        const { upcoming, past } = categorizeBookings(bookings);
        state.upcomingBookings = upcoming;
        state.pastBookings = past;
        state.hasMore = pagination.hasMore;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading.fetchUserBookings = false;
        state.error = action.payload;
      });

    // Fetch Companion Bookings
    builder
      .addCase(fetchCompanionBookings.pending, (state) => {
        state.loading.fetchCompanionBookings = true;
        state.error = null;
      })
      .addCase(fetchCompanionBookings.fulfilled, (state, action) => {
        state.loading.fetchCompanionBookings = false;
        const { bookings, pagination, statistics } = action.payload;
        
        state.bookings = bookings;
        state.pagination = pagination;
        state.statistics = statistics || initialState.statistics;
        
        const { upcoming, past } = categorizeBookings(bookings);
        state.upcomingBookings = upcoming;
        state.pastBookings = past;
        state.hasMore = pagination.hasMore;
      })
      .addCase(fetchCompanionBookings.rejected, (state, action) => {
        state.loading.fetchCompanionBookings = false;
        state.error = action.payload;
      });

    // Fetch Booking Details
    builder
      .addCase(fetchBookingDetails.pending, (state) => {
        state.loading.fetchDetails = true;
        state.error = null;
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.loading.fetchDetails = false;
        state.bookingDetails = action.payload;
        
        // Update in lists if it exists
        const bookingIndex = state.bookings.findIndex(b => b._id === action.payload._id);
        if (bookingIndex !== -1) {
          state.bookings[bookingIndex] = action.payload;
        }
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.loading.fetchDetails = false;
        state.error = action.payload;
      });

    // Update Booking Status
    builder
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading.updateStatus = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading.updateStatus = false;
        const updatedBooking = action.payload;
        
        // Update in all arrays
        const updateBooking = (booking) => {
          if (booking._id === updatedBooking._id) {
            return updatedBooking;
          }
          return booking;
        };
        
        state.bookings = state.bookings.map(updateBooking);
        state.upcomingBookings = state.upcomingBookings.map(updateBooking);
        state.pastBookings = state.pastBookings.map(updateBooking);
        
        if (state.currentBooking && state.currentBooking._id === updatedBooking._id) {
          state.currentBooking = updatedBooking;
        }
        
        if (state.bookingDetails && state.bookingDetails._id === updatedBooking._id) {
          state.bookingDetails = updatedBooking;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading.updateStatus = false;
        state.error = action.payload;
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.loading.cancel = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading.cancel = false;
        const cancelledBooking = action.payload;
        
        // Update booking status to cancelled
        const updateBooking = (booking) => {
          if (booking._id === cancelledBooking._id) {
            return cancelledBooking;
          }
          return booking;
        };
        
        state.bookings = state.bookings.map(updateBooking);
        state.upcomingBookings = state.upcomingBookings.map(updateBooking);
        state.pastBookings = state.pastBookings.map(updateBooking);
        
        if (state.currentBooking && state.currentBooking._id === cancelledBooking._id) {
          state.currentBooking = cancelledBooking;
        }
        
        if (state.bookingDetails && state.bookingDetails._id === cancelledBooking._id) {
          state.bookingDetails = cancelledBooking;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading.cancel = false;
        state.error = action.payload;
      });

    // Reschedule Booking
    builder
      .addCase(rescheduleBooking.pending, (state) => {
        state.loading.reschedule = true;
        state.error = null;
      })
      .addCase(rescheduleBooking.fulfilled, (state, action) => {
        state.loading.reschedule = false;
        const rescheduledBooking = action.payload;
        
        // Update in all arrays
        const updateBooking = (booking) => {
          if (booking._id === rescheduledBooking._id) {
            return rescheduledBooking;
          }
          return booking;
        };
        
        state.bookings = state.bookings.map(updateBooking);
        state.upcomingBookings = state.upcomingBookings.map(updateBooking);
        state.pastBookings = state.pastBookings.map(updateBooking);
        
        if (state.currentBooking && state.currentBooking._id === rescheduledBooking._id) {
          state.currentBooking = rescheduledBooking;
        }
        
        if (state.bookingDetails && state.bookingDetails._id === rescheduledBooking._id) {
          state.bookingDetails = rescheduledBooking;
        }
        
        // Re-categorize bookings since time might have changed
        const { upcoming, past } = categorizeBookings(state.bookings);
        state.upcomingBookings = upcoming;
        state.pastBookings = past;
      })
      .addCase(rescheduleBooking.rejected, (state, action) => {
        state.loading.reschedule = false;
        state.error = action.payload;
      });

    // Fetch Availability
    builder
      .addCase(fetchAvailability.pending, (state) => {
        state.loading.fetchAvailability = true;
        state.error = null;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading.fetchAvailability = false;
        const { companionId, date, timeSlots } = action.payload;
        
        if (!state.availability[companionId]) {
          state.availability[companionId] = {};
        }
        state.availability[companionId][date] = timeSlots;
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading.fetchAvailability = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearBookingState,
  setCurrentBooking,
  updateBookingLocally,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  updateAvailability,
  calculateStatistics,
  addBooking,
  removeBooking,
  setPagination,
  resetPagination,
} = bookingSlice.actions;

export default bookingSlice.reducer;

// Selectors
export const selectBookings = (state) => state.bookings.bookings;
export const selectUpcomingBookings = (state) => state.bookings.upcomingBookings;
export const selectPastBookings = (state) => state.bookings.pastBookings;
export const selectCurrentBooking = (state) => state.bookings.currentBooking;
export const selectBookingDetails = (state) => state.bookings.bookingDetails;
export const selectBookingFilters = (state) => state.bookings.filters;
export const selectBookingPagination = (state) => state.bookings.pagination;
export const selectBookingStatistics = (state) => state.bookings.statistics;
export const selectAvailability = (state) => state.bookings.availability;
export const selectBookingLoading = (state) => state.bookings.loading;
export const selectBookingError = (state) => state.bookings.error;
export const selectHasMoreBookings = (state) => state.bookings.hasMore;