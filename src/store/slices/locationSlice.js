import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  permissionGranted: false,
  loading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setPermissionGranted: (state, action) => {
      state.permissionGranted = action.payload;
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
  setCurrentLocation,
  setPermissionGranted,
  setLoading,
  setError,
} = locationSlice.actions;

export default locationSlice.reducer;
