import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  matches: [],
  newMatches: [],
  loading: false,
  error: null,
};

const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setMatches: (state, action) => {
      state.matches = action.payload;
    },
    addMatch: (state, action) => {
      state.matches.unshift(action.payload);
      state.newMatches.unshift(action.payload);
    },
    removeMatch: (state, action) => {
      state.matches = state.matches.filter(match => match.id !== action.payload);
    },
    clearNewMatches: (state) => {
      state.newMatches = [];
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
  setMatches,
  addMatch,
  removeMatch,
  clearNewMatches,
  setLoading,
  setError,
} = matchSlice.actions;

export default matchSlice.reducer;
