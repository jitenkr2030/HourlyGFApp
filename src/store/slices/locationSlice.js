import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { locationAPI, userAPI, handleApiError } from '../../services/api';

// Async thunks for location actions
export const updateUserLocation = createAsyncThunk(
  'location/updateUserLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateLocation(locationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchNearbyLocations = createAsyncThunk(
  'location/fetchNearbyLocations',
  async ({ latitude, longitude, radius = 50 }, { rejectWithValue }) => {
    try {
      const response = await locationAPI.getNearby({ latitude, longitude }, radius);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateLocationPreferences = createAsyncThunk(
  'location/updateLocationPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await locationAPI.updatePreferences(preferences);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async (_, { rejectWithValue, getState }) => {
    return new Promise((resolve, reject) => {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // Get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Location access denied';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for geolocation';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute cache
        }
      );
    });
  }
);

export const watchLocation = createAsyncThunk(
  'location/watchLocation',
  async (_, { rejectWithValue }) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve({ location, watchId });
        },
        (error) => {
          let errorMessage = 'Location tracking error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for geolocation';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }
);

// Initial state
const initialState = {
  currentLocation: null,
  permissionGranted: false,
  locationHistory: [],
  nearbyLocations: [],
  locationPreferences: {
    shareLocation: true,
    updateInterval: 300000, // 5 minutes in milliseconds
    radius: 50, // 50km radius
    enableLocationTracking: true,
    locationServices: {
      background: true,
      precise: true,
    },
  },
  trackingActive: false,
  watchId: null,
  lastLocationUpdate: null,
  locationError: null,
  locationStats: {
    totalUpdates: 0,
    accuracyAverage: 0,
    distanceTraveled: 0,
  },
  loading: {
    getCurrentLocation: false,
    updateLocation: false,
    fetchNearby: false,
    updatePreferences: false,
    watchLocation: false,
  },
  error: null,
  hasPermission: null, // null = not checked, true = granted, false = denied
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.locationError = null;
    },
    clearLocationState: (state) => {
      state.currentLocation = null;
      state.locationHistory = [];
      state.nearbyLocations = [];
      state.trackingActive = false;
      state.watchId = null;
      state.lastLocationUpdate = null;
      state.locationStats = initialState.locationStats;
      state.error = null;
      state.locationError = null;
    },
    setCurrentLocation: (state, action) => {
      const location = action.payload;
      state.currentLocation = location;
      state.lastLocationUpdate = new Date().toISOString();
      
      // Add to location history
      state.locationHistory.unshift(location);
      
      // Keep only last 50 location updates
      if (state.locationHistory.length > 50) {
        state.locationHistory = state.locationHistory.slice(0, 50);
      }
      
      // Update statistics
      state.locationStats.totalUpdates += 1;
      
      // Calculate distance traveled if we have previous location
      if (state.locationHistory.length > 1) {
        const prevLocation = state.locationHistory[1];
        const distance = calculateDistance(
          prevLocation.latitude,
          prevLocation.longitude,
          location.latitude,
          location.longitude
        );
        state.locationStats.distanceTraveled += distance;
      }
      
      // Update average accuracy
      if (location.accuracy) {
        const totalAccuracy = state.locationHistory.reduce((sum, loc) => sum + (loc.accuracy || 0), 0);
        state.locationStats.accuracyAverage = totalAccuracy / state.locationHistory.length;
      }
    },
    setPermissionGranted: (state, action) => {
      state.permissionGranted = action.payload;
      state.hasPermission = action.payload;
    },
    setLocationPreferences: (state, action) => {
      state.locationPreferences = { ...state.locationPreferences, ...action.payload };
    },
    addNearbyLocation: (state, action) => {
      const location = action.payload;
      const existingIndex = state.nearbyLocations.findIndex(loc => 
        loc.id === location.id || 
        (loc.latitude === location.latitude && loc.longitude === location.longitude)
      );
      
      if (existingIndex === -1) {
        state.nearbyLocations.push(location);
      } else {
        state.nearbyLocations[existingIndex] = location;
      }
    },
    setNearbyLocations: (state, action) => {
      state.nearbyLocations = action.payload;
    },
    clearNearbyLocations: (state) => {
      state.nearbyLocations = [];
    },
    setTrackingActive: (state, action) => {
      state.trackingActive = action.payload;
    },
    setWatchId: (state, action) => {
      state.watchId = action.payload;
    },
    stopLocationTracking: (state) => {
      state.trackingActive = false;
      state.watchId = null;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setLocationError: (state, action) => {
      state.locationError = action.payload;
    },
    updateLocationStats: (state, action) => {
      state.locationStats = { ...state.locationStats, ...action.payload };
    },
    clearLocationHistory: (state) => {
      state.locationHistory = [];
    },
  },
  extraReducers: (builder) => {
    // Get Current Location
    builder
      .addCase(getCurrentLocation.pending, (state) => {
        state.loading.getCurrentLocation = true;
        state.locationError = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.loading.getCurrentLocation = false;
        state.currentLocation = action.payload;
        state.lastLocationUpdate = new Date().toISOString();
        
        // Add to history
        state.locationHistory.unshift(action.payload);
        if (state.locationHistory.length > 50) {
          state.locationHistory = state.locationHistory.slice(0, 50);
        }
        
        state.locationStats.totalUpdates += 1;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.loading.getCurrentLocation = false;
        state.locationError = action.error.message;
      });

    // Update User Location
    builder
      .addCase(updateUserLocation.pending, (state) => {
        state.loading.updateLocation = true;
        state.error = null;
      })
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        state.loading.updateLocation = false;
        const location = action.payload;
        state.currentLocation = location;
        state.lastLocationUpdate = new Date().toISOString();
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.loading.updateLocation = false;
        state.error = action.payload;
      });

    // Fetch Nearby Locations
    builder
      .addCase(fetchNearbyLocations.pending, (state) => {
        state.loading.fetchNearby = true;
        state.error = null;
      })
      .addCase(fetchNearbyLocations.fulfilled, (state, action) => {
        state.loading.fetchNearby = false;
        state.nearbyLocations = action.payload;
      })
      .addCase(fetchNearbyLocations.rejected, (state, action) => {
        state.loading.fetchNearby = false;
        state.error = action.payload;
      });

    // Update Location Preferences
    builder
      .addCase(updateLocationPreferences.pending, (state) => {
        state.loading.updatePreferences = true;
        state.error = null;
      })
      .addCase(updateLocationPreferences.fulfilled, (state, action) => {
        state.loading.updatePreferences = false;
        state.locationPreferences = { ...state.locationPreferences, ...action.payload };
      })
      .addCase(updateLocationPreferences.rejected, (state, action) => {
        state.loading.updatePreferences = false;
        state.error = action.payload;
      });

    // Watch Location
    builder
      .addCase(watchLocation.pending, (state) => {
        state.loading.watchLocation = true;
        state.locationError = null;
      })
      .addCase(watchLocation.fulfilled, (state, action) => {
        state.loading.watchLocation = false;
        const { location, watchId } = action.payload;
        state.currentLocation = location;
        state.watchId = watchId;
        state.trackingActive = true;
        state.lastLocationUpdate = new Date().toISOString();
        
        // Add to history
        state.locationHistory.unshift(location);
        if (state.locationHistory.length > 50) {
          state.locationHistory = state.locationHistory.slice(0, 50);
        }
        
        state.locationStats.totalUpdates += 1;
      })
      .addCase(watchLocation.rejected, (state, action) => {
        state.loading.watchLocation = false;
        state.locationError = action.error.message;
        state.trackingActive = false;
        state.watchId = null;
      });
  },
});

export const {
  clearError,
  clearLocationState,
  setCurrentLocation,
  setPermissionGranted,
  setLocationPreferences,
  addNearbyLocation,
  setNearbyLocations,
  clearNearbyLocations,
  setTrackingActive,
  setWatchId,
  stopLocationTracking,
  setLoading,
  setError,
  setLocationError,
  updateLocationStats,
  clearLocationHistory,
} = locationSlice.actions;

export default locationSlice.reducer;

// Selectors
export const selectCurrentLocation = (state) => state.location.currentLocation;
export const selectPermissionGranted = (state) => state.location.permissionGranted;
export const selectLocationHistory = (state) => state.location.locationHistory;
export const selectNearbyLocations = (state) => state.location.nearbyLocations;
export const selectLocationPreferences = (state) => state.location.locationPreferences;
export const selectTrackingActive = (state) => state.location.trackingActive;
export const selectWatchId = (state) => state.location.watchId;
export const selectLastLocationUpdate = (state) => state.location.lastLocationUpdate;
export const selectLocationError = (state) => state.location.locationError;
export const selectLocationStats = (state) => state.location.locationStats;
export const selectLocationLoading = (state) => state.location.loading;
export const selectLocationErrorGeneral = (state) => state.location.error;
export const selectHasPermission = (state) => state.location.hasPermission;