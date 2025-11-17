import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  preferences: {
    ageRange: [18, 50],
    maxDistance: 50,
    interests: [],
    languages: [],
    availability: 'anytime',
  },
  photos: [],
  verified: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    addPhoto: (state, action) => {
      state.photos.push(action.payload);
    },
    removePhoto: (state, action) => {
      state.photos = state.photos.filter(photo => photo.id !== action.payload);
    },
    setVerified: (state, action) => {
      state.verified = action.payload;
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
  setUserProfile,
  updateProfile,
  setPreferences,
  addPhoto,
  removePhoto,
  setVerified,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
