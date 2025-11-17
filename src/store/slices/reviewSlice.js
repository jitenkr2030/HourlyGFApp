import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewAPI, handleApiError } from '../../services/api';

// Async thunks for review actions
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({ bookingId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.create(bookingId, reviewData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  'reviews/fetchUserReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getUserReviews();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchCompanionReviews = createAsyncThunk(
  'reviews/fetchCompanionReviews',
  async (companionId, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getCompanionReviews(companionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchReviewDetails = createAsyncThunk(
  'reviews/fetchReviewDetails',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.getDetails(reviewId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.update(reviewId, reviewData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await reviewAPI.delete(reviewId);
      return reviewId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const markReviewHelpful = createAsyncThunk(
  'reviews/markReviewHelpful',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.markHelpful(reviewId);
      return { reviewId, helpful: response.data.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const reportReview = createAsyncThunk(
  'reviews/reportReview',
  async ({ reviewId, reason }, { rejectWithValue }) => {
    try {
      const response = await reviewAPI.report(reviewId, reason);
      return { reviewId, report: response.data.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
const initialState = {
  reviews: [],
  companionReviews: {},
  userReviews: [],
  currentReview: null,
  reviewDetails: null,
  filters: {
    rating: 'all', // 'all', 1, 2, 3, 4, 5
    sortBy: 'createdAt', // 'createdAt', 'rating', 'helpful'
    sortOrder: 'desc', // 'asc', 'desc'
    hasPhotos: 'all', // 'all', 'yes', 'no'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  statistics: {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
    reviewsWithPhotos: 0,
    helpfulVotes: 0,
  },
  loading: {
    create: false,
    fetchUserReviews: false,
    fetchCompanionReviews: false,
    fetchDetails: false,
    update: false,
    delete: false,
    markHelpful: false,
    report: false,
  },
  error: null,
  hasMore: true,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReviewState: (state) => {
      state.reviews = [];
      state.companionReviews = {};
      state.userReviews = [];
      state.currentReview = null;
      state.reviewDetails = null;
      state.statistics = initialState.statistics;
      state.error = null;
    },
    setCurrentReview: (state, action) => {
      state.currentReview = action.payload;
    },
    updateReviewLocally: (state, action) => {
      const { reviewId, updates } = action.payload;
      
      // Update in reviews array
      const reviewIndex = state.reviews.findIndex(r => r._id === reviewId);
      if (reviewIndex !== -1) {
        state.reviews[reviewIndex] = { ...state.reviews[reviewIndex], ...updates };
      }
      
      // Update in user reviews
      const userReviewIndex = state.userReviews.findIndex(r => r._id === reviewId);
      if (userReviewIndex !== -1) {
        state.userReviews[userReviewIndex] = { ...state.userReviews[userReviewIndex], ...updates };
      }
      
      // Update in companion reviews
      Object.keys(state.companionReviews).forEach(companionId => {
        const reviews = state.companionReviews[companionId];
        const reviewIndex = reviews.findIndex(r => r._id === reviewId);
        if (reviewIndex !== -1) {
          reviews[reviewIndex] = { ...reviews[reviewIndex], ...updates };
        }
      });
      
      // Update current review if it matches
      if (state.currentReview && state.currentReview._id === reviewId) {
        state.currentReview = { ...state.currentReview, ...updates };
      }
      
      // Update review details if it matches
      if (state.reviewDetails && state.reviewDetails._id === reviewId) {
        state.reviewDetails = { ...state.reviewDetails, ...updates };
      }
    },
    addReview: (state, action) => {
      const review = action.payload;
      state.reviews.unshift(review);
      state.userReviews.unshift(review);
      
      // Add to companion reviews
      const companionId = review.companion._id;
      if (!state.companionReviews[companionId]) {
        state.companionReviews[companionId] = [];
      }
      state.companionReviews[companionId].unshift(review);
    },
    removeReview: (state, action) => {
      const reviewId = action.payload;
      
      // Remove from all arrays
      state.reviews = state.reviews.filter(r => r._id !== reviewId);
      state.userReviews = state.userReviews.filter(r => r._id !== reviewId);
      
      // Remove from companion reviews
      Object.keys(state.companionReviews).forEach(companionId => {
        state.companionReviews[companionId] = state.companionReviews[companionId].filter(
          r => r._id !== reviewId
        );
      });
      
      if (state.currentReview && state.currentReview._id === reviewId) {
        state.currentReview = null;
      }
      
      if (state.reviewDetails && state.reviewDetails._id === reviewId) {
        state.reviewDetails = null;
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
    calculateStatistics: (state, action) => {
      const reviews = action.payload;
      const stats = {
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length 
          : 0,
        ratingDistribution: {
          5: reviews.filter(r => r.overallRating === 5).length,
          4: reviews.filter(r => r.overallRating === 4).length,
          3: reviews.filter(r => r.overallRating === 3).length,
          2: reviews.filter(r => r.overallRating === 2).length,
          1: reviews.filter(r => r.overallRating === 1).length,
        },
        reviewsWithPhotos: reviews.filter(r => r.photos && r.photos.length > 0).length,
        helpfulVotes: reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0),
      };
      state.statistics = stats;
    },
    setCompanionReviews: (state, action) => {
      const { companionId, reviews } = action.payload;
      state.companionReviews[companionId] = reviews;
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    // Create Review
    builder
      .addCase(createReview.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading.create = false;
        const review = action.payload;
        
        state.reviews.unshift(review);
        state.userReviews.unshift(review);
        
        const companionId = review.companion._id;
        if (!state.companionReviews[companionId]) {
          state.companionReviews[companionId] = [];
        }
        state.companionReviews[companionId].unshift(review);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      });

    // Fetch User Reviews
    builder
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading.fetchUserReviews = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading.fetchUserReviews = false;
        const { reviews, pagination } = action.payload;
        
        state.userReviews = reviews;
        state.reviews = reviews; // Set as main reviews array for now
        state.pagination = pagination;
        state.hasMore = pagination.hasMore;
        
        // Calculate statistics
        const stats = {
          totalReviews: reviews.length,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length 
            : 0,
          ratingDistribution: {
            5: reviews.filter(r => r.overallRating === 5).length,
            4: reviews.filter(r => r.overallRating === 4).length,
            3: reviews.filter(r => r.overallRating === 3).length,
            2: reviews.filter(r => r.overallRating === 2).length,
            1: reviews.filter(r => r.overallRating === 1).length,
          },
          reviewsWithPhotos: reviews.filter(r => r.photos && r.photos.length > 0).length,
          helpfulVotes: reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0),
        };
        state.statistics = stats;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading.fetchUserReviews = false;
        state.error = action.payload;
      });

    // Fetch Companion Reviews
    builder
      .addCase(fetchCompanionReviews.pending, (state) => {
        state.loading.fetchCompanionReviews = true;
        state.error = null;
      })
      .addCase(fetchCompanionReviews.fulfilled, (state, action) => {
        state.loading.fetchCompanionReviews = false;
        const { reviews, companionId, pagination } = action.payload;
        
        state.companionReviews[companionId] = reviews;
        state.pagination = pagination;
        state.hasMore = pagination.hasMore;
      })
      .addCase(fetchCompanionReviews.rejected, (state, action) => {
        state.loading.fetchCompanionReviews = false;
        state.error = action.payload;
      });

    // Fetch Review Details
    builder
      .addCase(fetchReviewDetails.pending, (state) => {
        state.loading.fetchDetails = true;
        state.error = null;
      })
      .addCase(fetchReviewDetails.fulfilled, (state, action) => {
        state.loading.fetchDetails = false;
        state.reviewDetails = action.payload;
      })
      .addCase(fetchReviewDetails.rejected, (state, action) => {
        state.loading.fetchDetails = false;
        state.error = action.payload;
      });

    // Update Review
    builder
      .addCase(updateReview.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedReview = action.payload;
        
        // Update in all arrays
        const updateReviewInArray = (reviews) => {
          return reviews.map(r => r._id === updatedReview._id ? updatedReview : r);
        };
        
        state.reviews = updateReviewInArray(state.reviews);
        state.userReviews = updateReviewInArray(state.userReviews);
        
        // Update in companion reviews
        Object.keys(state.companionReviews).forEach(companionId => {
          state.companionReviews[companionId] = updateReviewInArray(
            state.companionReviews[companionId]
          );
        });
        
        if (state.currentReview && state.currentReview._id === updatedReview._id) {
          state.currentReview = updatedReview;
        }
        
        if (state.reviewDetails && state.reviewDetails._id === updatedReview._id) {
          state.reviewDetails = updatedReview;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      });

    // Delete Review
    builder
      .addCase(deleteReview.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading.delete = false;
        const reviewId = action.payload;
        
        // Remove from all arrays
        state.reviews = state.reviews.filter(r => r._id !== reviewId);
        state.userReviews = state.userReviews.filter(r => r._id !== reviewId);
        
        // Remove from companion reviews
        Object.keys(state.companionReviews).forEach(companionId => {
          state.companionReviews[companionId] = state.companionReviews[companionId].filter(
            r => r._id !== reviewId
          );
        });
        
        if (state.currentReview && state.currentReview._id === reviewId) {
          state.currentReview = null;
        }
        
        if (state.reviewDetails && state.reviewDetails._id === reviewId) {
          state.reviewDetails = null;
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      });

    // Mark Review Helpful
    builder
      .addCase(markReviewHelpful.pending, (state) => {
        state.loading.markHelpful = true;
      })
      .addCase(markReviewHelpful.fulfilled, (state, action) => {
        state.loading.markHelpful = false;
        const { reviewId, helpful } = action.payload;
        
        const updateReview = (reviews) => {
          return reviews.map(r => {
            if (r._id === reviewId) {
              return {
                ...r,
                helpfulCount: r.helpfulCount ? r.helpfulCount + 1 : 1,
                isHelpful: true,
              };
            }
            return r;
          });
        };
        
        state.reviews = updateReview(state.reviews);
        state.userReviews = updateReview(state.userReviews);
        
        Object.keys(state.companionReviews).forEach(companionId => {
          state.companionReviews[companionId] = updateReview(
            state.companionReviews[companionId]
          );
        });
      })
      .addCase(markReviewHelpful.rejected, (state, action) => {
        state.loading.markHelpful = false;
        state.error = action.payload;
      });

    // Report Review
    builder
      .addCase(reportReview.pending, (state) => {
        state.loading.report = true;
      })
      .addCase(reportReview.fulfilled, (state, action) => {
        state.loading.report = false;
        const { reviewId, report } = action.payload;
        
        // Update review status to reported
        const updateReviewStatus = (reviews) => {
          return reviews.map(r => {
            if (r._id === reviewId) {
              return {
                ...r,
                status: 'reported',
                reportReason: report.reason,
              };
            }
            return r;
          });
        };
        
        state.reviews = updateReviewStatus(state.reviews);
        state.userReviews = updateReviewStatus(state.userReviews);
        
        Object.keys(state.companionReviews).forEach(companionId => {
          state.companionReviews[companionId] = updateReviewStatus(
            state.companionReviews[companionId]
          );
        });
      })
      .addCase(reportReview.rejected, (state, action) => {
        state.loading.report = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearReviewState,
  setCurrentReview,
  updateReviewLocally,
  addReview,
  removeReview,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  calculateStatistics,
  setCompanionReviews,
  resetPagination,
} = reviewSlice.actions;

export default reviewSlice.reducer;

// Selectors
export const selectReviews = (state) => state.reviews.reviews;
export const selectUserReviews = (state) => state.reviews.userReviews;
export const selectCompanionReviews = (state, companionId) => 
  state.reviews.companionReviews[companionId] || [];
export const selectCurrentReview = (state) => state.reviews.currentReview;
export const selectReviewDetails = (state) => state.reviews.reviewDetails;
export const selectReviewFilters = (state) => state.reviews.filters;
export const selectReviewPagination = (state) => state.reviews.pagination;
export const selectReviewStatistics = (state) => state.reviews.statistics;
export const selectReviewLoading = (state) => state.reviews.loading;
export const selectReviewError = (state) => state.reviews.error;
export const selectHasMoreReviews = (state) => state.reviews.hasMore;