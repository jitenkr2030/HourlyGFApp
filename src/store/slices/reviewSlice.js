import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  reviews: {},
  myReviews: [],
  loading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setReviews: (state, action) => {
      const { companionId, reviews } = action.payload;
      state.reviews[companionId] = reviews;
    },
    addReview: (state, action) => {
      const { companionId, review } = action.payload;
      if (!state.reviews[companionId]) {
        state.reviews[companionId] = [];
      }
      state.reviews[companionId].unshift(review);
      state.myReviews.unshift(review);
    },
    setMyReviews: (state, action) => {
      state.myReviews = action.payload;
    },
    updateReview: (state, action) => {
      const { companionId, reviewId, updates } = action.payload;
      if (state.reviews[companionId]) {
        const review = state.reviews[companionId].find(r => r.id === reviewId);
        if (review) {
          Object.assign(review, updates);
        }
      }
      const myReview = state.myReviews.find(r => r.id === reviewId);
      if (myReview) {
        Object.assign(myReview, updates);
      }
    },
    deleteReview: (state, action) => {
      const { companionId, reviewId } = action.payload;
      if (state.reviews[companionId]) {
        state.reviews[companionId] = state.reviews[companionId].filter(r => r.id !== reviewId);
      }
      state.myReviews = state.myReviews.filter(r => r.id !== reviewId);
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
  setReviews,
  addReview,
  setMyReviews,
  updateReview,
  deleteReview,
  setLoading,
  setError,
} = reviewSlice.actions;

export default reviewSlice.reducer;
