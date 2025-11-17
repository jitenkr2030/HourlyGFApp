import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI, locationAPI, handleApiError, uploadFile } from '../../services/api';

// Async thunks for user actions
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const uploadUserPhoto = createAsyncThunk(
  'user/uploadUserPhoto',
  async (photoUri, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      const response = await userAPI.uploadPhotos(formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteUserPhoto = createAsyncThunk(
  'user/deleteUserPhoto',
  async (photoId, { rejectWithValue }) => {
    try {
      await userAPI.deletePhoto(photoId);
      return photoId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updateUserPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await userAPI.updatePreferences(preferences);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateUserLocation = createAsyncThunk(
  'user/updateUserLocation',
  async (location, { rejectWithValue }) => {
    try {
      const response = await locationAPI.updateLocation(location);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'user/deleteUserAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.deleteAccount();
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
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
  location: null,
  verified: {
    email: false,
    phone: false,
    identity: false,
  },
  loading: false,
  uploading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUserState: (state) => {
      state.profile = null;
      state.preferences = initialState.preferences;
      state.photos = [];
      state.location = null;
      state.verified = initialState.verified;
      state.error = null;
    },
    updateProfileLocally: (state, action) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    addPhotoLocally: (state, action) => {
      state.photos.push(action.payload);
    },
    removePhotoLocally: (state, action) => {
      state.photos = state.photos.filter(photo => photo.id !== action.payload);
    },
    setVerifiedStatus: (state, action) => {
      const { type, status } = action.payload;
      state.verified[type] = status;
      if (state.profile) {
        state.profile.verified = { ...state.profile.verified, [type]: status };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.preferences = action.payload.preferences || state.preferences;
        state.photos = action.payload.photos || [];
        state.location = action.payload.location || null;
        state.verified = action.payload.verified || state.verified;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Upload User Photo
    builder
      .addCase(uploadUserPhoto.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadUserPhoto.fulfilled, (state, action) => {
        state.uploading = false;
        state.photos.push(action.payload);
        if (state.profile) {
          state.profile.photos = [...(state.profile.photos || []), action.payload];
        }
      })
      .addCase(uploadUserPhoto.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });

    // Delete User Photo
    builder
      .addCase(deleteUserPhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserPhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = state.photos.filter(photo => photo.id !== action.payload);
        if (state.profile && state.profile.photos) {
          state.profile.photos = state.profile.photos.filter(photo => photo.id !== action.payload);
        }
      })
      .addCase(deleteUserPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update User Preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = { ...state.preferences, ...action.payload };
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update User Location
    builder
      .addCase(updateUserLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.location = action.payload;
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete User Account
    builder
      .addCase(deleteUserAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.loading = false;
        // Clear all user data
        state.profile = null;
        state.preferences = initialState.preferences;
        state.photos = [];
        state.location = null;
        state.verified = initialState.verified;
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearUserState,
  updateProfileLocally,
  setLocation,
  addPhotoLocally,
  removePhotoLocally,
  setVerifiedStatus,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUser = (state) => state.user.profile;
export const selectUserPreferences = (state) => state.user.preferences;
export const selectUserPhotos = (state) => state.user.photos;
export const selectUserLocation = (state) => state.user.location;
export const selectUserVerified = (state) => state.user.verified;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserUploading = (state) => state.user.uploading;
export const selectUserError = (state) => state.user.error;