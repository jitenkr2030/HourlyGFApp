import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  filteredList: [],
  currentCompanion: null,
  filters: {
    ageRange: [18, 50],
    location: null,
    interests: [],
    availability: 'all',
    priceRange: [0, 10000],
    rating: 0,
    verified: false,
  },
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
};

const companionSlice = createSlice({
  name: 'companions',
  initialState,
  reducers: {
    setCompanions: (state, action) => {
      state.list = action.payload;
      state.filteredList = action.payload;
    },
    addCompanions: (state, action) => {
      state.list = [...state.list, ...action.payload];
      state.filteredList = [...state.filteredList, ...action.payload];
    },
    setCurrentCompanion: (state, action) => {
      state.currentCompanion = action.payload;
    },
    applyFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Apply filtering logic
      state.filteredList = state.list.filter(companion => {
        const ageMatch = companion.age >= state.filters.ageRange[0] && 
                        companion.age <= state.filters.ageRange[1];
        const priceMatch = companion.hourlyRate >= state.filters.priceRange[0] && 
                          companion.hourlyRate <= state.filters.priceRange[1];
        const ratingMatch = companion.rating >= state.filters.rating;
        const verifiedMatch = !state.filters.verified || companion.verified;
        
        return ageMatch && priceMatch && ratingMatch && verifiedMatch;
      });
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredList = state.list;
    },
    likeCompanion: (state, action) => {
      const companion = state.list.find(c => c.id === action.payload);
      if (companion) {
        companion.liked = true;
      }
    },
    passCompanion: (state, action) => {
      const companion = state.list.find(c => c.id === action.payload);
      if (companion) {
        companion.passed = true;
      }
    },
    superLikeCompanion: (state, action) => {
      const companion = state.list.find(c => c.id === action.payload);
      if (companion) {
        companion.superLiked = true;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setHasMore: (state, action) => {
      state.hasMore = action.payload;
    },
    incrementPage: (state) => {
      state.page += 1;
    },
  },
});

export const {
  setCompanions,
  addCompanions,
  setCurrentCompanion,
  applyFilters,
  clearFilters,
  likeCompanion,
  passCompanion,
  superLikeCompanion,
  setLoading,
  setError,
  setHasMore,
  incrementPage,
} = companionSlice.actions;

export default companionSlice.reducer;
