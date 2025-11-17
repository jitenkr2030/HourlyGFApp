import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companionAPI, handleApiError } from '../../services/api';

// Async thunks for companion actions
export const searchCompanions = createAsyncThunk(
  'companions/searchCompanions',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await companionAPI.search(searchParams);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getCompanionDetails = createAsyncThunk(
  'companions/getCompanionDetails',
  async (companionId, { rejectWithValue }) => {
    try {
      const response = await companionAPI.getDetails(companionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createCompanionProfile = createAsyncThunk(
  'companions/createCompanionProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await companionAPI.createProfile(profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCompanionProfile = createAsyncThunk(
  'companions/updateCompanionProfile',
  async ({ id, profileData }, { rejectWithValue }) => {
    try {
      const response = await companionAPI.updateProfile(id, profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteCompanionProfile = createAsyncThunk(
  'companions/deleteCompanionProfile',
  async (companionId, { rejectWithValue }) => {
    try {
      await companionAPI.deleteProfile(companionId);
      return companionId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCompanionAvailability = createAsyncThunk(
  'companions/updateCompanionAvailability',
  async ({ id, availability }, { rejectWithValue }) => {
    try {
      const response = await companionAPI.updateAvailability(id, availability);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCompanionRates = createAsyncThunk(
  'companions/updateCompanionRates',
  async ({ id, rates }, { rejectWithValue }) => {
    try {
      const response = await companionAPI.updateRates(id, rates);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const uploadCompanionPortfolio = createAsyncThunk(
  'companions/uploadCompanionPortfolio',
  async ({ id, portfolioData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (portfolioData.images) {
        portfolioData.images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `portfolio_${index}.jpg`,
          });
        });
      }
      if (portfolioData.videos) {
        portfolioData.videos.forEach((video, index) => {
          formData.append('videos', {
            uri: video.uri,
            type: 'video/mp4',
            name: `portfolio_video_${index}.mp4`,
          });
        });
      }

      const response = await companionAPI.uploadPortfolio(id, formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
const initialState = {
  list: [],
  filteredList: [],
  currentCompanion: null,
  myProfile: null, // For companions who have created their profile
  filters: {
    ageRange: [18, 50],
    location: null,
    radius: 50, // in km
    interests: [],
    availability: 'all',
    priceRange: [0, 10000],
    rating: 0,
    verified: false,
    services: [],
    languages: [],
  },
  searchResults: {
    companions: [],
    total: 0,
    page: 1,
    totalPages: 0,
    hasMore: false,
  },
  loading: false,
  searching: false,
  error: null,
  hasMore: true,
  page: 1,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

const companionSlice = createSlice({
  name: 'companions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = initialState.searchResults;
      state.list = [];
      state.filteredList = [];
      state.page = 1;
      state.hasMore = true;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      let filtered = [...state.list];
      
      // Apply age filter
      if (state.filters.ageRange) {
        filtered = filtered.filter(companion => 
          companion.age >= state.filters.ageRange[0] && 
          companion.age <= state.filters.ageRange[1]
        );
      }
      
      // Apply price filter
      if (state.filters.priceRange) {
        filtered = filtered.filter(companion => 
          companion.hourlyRate >= state.filters.priceRange[0] && 
          companion.hourlyRate <= state.filters.priceRange[1]
        );
      }
      
      // Apply rating filter
      if (state.filters.rating > 0) {
        filtered = filtered.filter(companion => 
          companion.averageRating >= state.filters.rating
        );
      }
      
      // Apply verified filter
      if (state.filters.verified) {
        filtered = filtered.filter(companion => companion.verified);
      }
      
      // Apply interests filter
      if (state.filters.interests && state.filters.interests.length > 0) {
        filtered = filtered.filter(companion =>
          companion.interests && companion.interests.some(interest =>
            state.filters.interests.includes(interest)
          )
        );
      }
      
      // Apply services filter
      if (state.filters.services && state.filters.services.length > 0) {
        filtered = filtered.filter(companion =>
          companion.services && companion.services.some(service =>
            state.filters.services.includes(service)
          )
        );
      }
      
      // Apply languages filter
      if (state.filters.languages && state.filters.languages.length > 0) {
        filtered = filtered.filter(companion =>
          companion.languages && companion.languages.some(lang =>
            state.filters.languages.includes(lang)
          )
        );
      }

      state.filteredList = filtered;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredList = state.list;
    },
    setCurrentCompanion: (state, action) => {
      state.currentCompanion = action.payload;
    },
    updateCompanionLocally: (state, action) => {
      const { id, updates } = action.payload;
      const companionIndex = state.list.findIndex(c => c._id === id);
      if (companionIndex !== -1) {
        state.list[companionIndex] = { ...state.list[companionIndex], ...updates };
      }
      
      const filteredIndex = state.filteredList.findIndex(c => c._id === id);
      if (filteredIndex !== -1) {
        state.filteredList[filteredIndex] = { ...state.filteredList[filteredIndex], ...updates };
      }
      
      if (state.currentCompanion && state.currentCompanion._id === id) {
        state.currentCompanion = { ...state.currentCompanion, ...updates };
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSearching: (state, action) => {
      state.searching = action.payload;
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
    resetPagination: (state) => {
      state.page = 1;
      state.hasMore = true;
      state.pagination = initialState.pagination;
    },
    setMyProfile: (state, action) => {
      state.myProfile = action.payload;
    },
    updateAvailabilityStatus: (state, action) => {
      const { companionId, isAvailable } = action.payload;
      
      // Update in main list
      const companion = state.list.find(c => c._id === companionId);
      if (companion) {
        companion.isAvailable = isAvailable;
      }
      
      // Update in filtered list
      const filteredCompanion = state.filteredList.find(c => c._id === companionId);
      if (filteredCompanion) {
        filteredCompanion.isAvailable = isAvailable;
      }
      
      // Update current companion
      if (state.currentCompanion && state.currentCompanion._id === companionId) {
        state.currentCompanion.isAvailable = isAvailable;
      }
    },
  },
  extraReducers: (builder) => {
    // Search Companions
    builder
      .addCase(searchCompanions.pending, (state, action) => {
        state.searching = true;
        state.error = null;
        // If it's a new search (not pagination), clear previous results
        if (action.meta.arg.page === 1) {
          state.list = [];
          state.filteredList = [];
          state.page = 1;
        }
      })
      .addCase(searchCompanions.fulfilled, (state, action) => {
        state.searching = false;
        const { companions, pagination, filters } = action.payload;
        
        if (action.meta.arg.page === 1) {
          state.list = companions;
          state.filteredList = companions;
        } else {
          // Append for pagination
          state.list = [...state.list, ...companions];
          state.filteredList = [...state.filteredList, ...companions];
        }
        
        state.pagination = pagination;
        state.hasMore = pagination.hasMore;
        state.page = pagination.page;
        if (filters) {
          state.filters = { ...state.filters, ...filters };
        }
      })
      .addCase(searchCompanions.rejected, (state, action) => {
        state.searching = false;
        state.error = action.payload;
      });

    // Get Companion Details
    builder
      .addCase(getCompanionDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompanionDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCompanion = action.payload;
      })
      .addCase(getCompanionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Companion Profile
    builder
      .addCase(createCompanionProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompanionProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.myProfile = action.payload;
      })
      .addCase(createCompanionProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Companion Profile
    builder
      .addCase(updateCompanionProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompanionProfile.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProfile = action.payload;
        
        // Update my profile if it's the same companion
        if (state.myProfile && state.myProfile._id === updatedProfile._id) {
          state.myProfile = updatedProfile;
        }
        
        // Update in lists
        const listIndex = state.list.findIndex(c => c._id === updatedProfile._id);
        if (listIndex !== -1) {
          state.list[listIndex] = updatedProfile;
        }
        
        const filteredIndex = state.filteredList.findIndex(c => c._id === updatedProfile._id);
        if (filteredIndex !== -1) {
          state.filteredList[filteredIndex] = updatedProfile;
        }
        
        if (state.currentCompanion && state.currentCompanion._id === updatedProfile._id) {
          state.currentCompanion = updatedProfile;
        }
      })
      .addCase(updateCompanionProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Companion Profile
    builder
      .addCase(deleteCompanionProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompanionProfile.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        
        // Remove from lists
        state.list = state.list.filter(c => c._id !== deletedId);
        state.filteredList = state.filteredList.filter(c => c._id !== deletedId);
        
        // Clear my profile if it's the deleted one
        if (state.myProfile && state.myProfile._id === deletedId) {
          state.myProfile = null;
        }
        
        // Clear current companion if it's the deleted one
        if (state.currentCompanion && state.currentCompanion._id === deletedId) {
          state.currentCompanion = null;
        }
      })
      .addCase(deleteCompanionProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Companion Availability
    builder
      .addCase(updateCompanionAvailability.fulfilled, (state, action) => {
        const { _id, availability } = action.payload;
        
        // Update my profile
        if (state.myProfile && state.myProfile._id === _id) {
          state.myProfile.availability = availability;
        }
        
        // Update in lists
        const listIndex = state.list.findIndex(c => c._id === _id);
        if (listIndex !== -1) {
          state.list[listIndex].availability = availability;
        }
        
        const filteredIndex = state.filteredList.findIndex(c => c._id === _id);
        if (filteredIndex !== -1) {
          state.filteredList[filteredIndex].availability = availability;
        }
        
        if (state.currentCompanion && state.currentCompanion._id === _id) {
          state.currentCompanion.availability = availability;
        }
      })
      .addCase(updateCompanionAvailability.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update Companion Rates
    builder
      .addCase(updateCompanionRates.fulfilled, (state, action) => {
        const { _id, rates } = action.payload;
        
        // Update my profile
        if (state.myProfile && state.myProfile._id === _id) {
          state.myProfile.rates = rates;
        }
        
        // Update in lists
        const listIndex = state.list.findIndex(c => c._id === _id);
        if (listIndex !== -1) {
          state.list[listIndex].rates = rates;
          state.list[listIndex].hourlyRate = rates.hourlyRate;
        }
        
        const filteredIndex = state.filteredList.findIndex(c => c._id === _id);
        if (filteredIndex !== -1) {
          state.filteredList[filteredIndex].rates = rates;
          state.filteredList[filteredIndex].hourlyRate = rates.hourlyRate;
        }
        
        if (state.currentCompanion && state.currentCompanion._id === _id) {
          state.currentCompanion.rates = rates;
          state.currentCompanion.hourlyRate = rates.hourlyRate;
        }
      })
      .addCase(updateCompanionRates.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Upload Companion Portfolio
    builder
      .addCase(uploadCompanionPortfolio.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadCompanionPortfolio.fulfilled, (state, action) => {
        state.uploading = false;
        const portfolio = action.payload;
        
        // Update my profile
        if (state.myProfile) {
          state.myProfile.portfolio = portfolio;
        }
        
        // Update current companion if viewing
        if (state.currentCompanion) {
          state.currentCompanion.portfolio = portfolio;
        }
      })
      .addCase(uploadCompanionPortfolio.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSearchResults,
  setFilters,
  applyFilters,
  clearFilters,
  setCurrentCompanion,
  updateCompanionLocally,
  setLoading,
  setSearching,
  setError,
  setHasMore,
  incrementPage,
  resetPagination,
  setMyProfile,
  updateAvailabilityStatus,
} = companionSlice.actions;

export default companionSlice.reducer;

// Selectors
export const selectCompanions = (state) => state.companions.filteredList;
export const selectCurrentCompanion = (state) => state.companions.currentCompanion;
export const selectMyCompanionProfile = (state) => state.companions.myProfile;
export const selectCompanionFilters = (state) => state.companions.filters;
export const selectSearchResults = (state) => state.companions.searchResults;
export const selectCompanionLoading = (state) => state.companions.loading;
export const selectCompanionSearching = (state) => state.companions.searching;
export const selectCompanionError = (state) => state.companions.error;
export const selectHasMore = (state) => state.companions.hasMore;
export const selectPagination = (state) => state.companions.pagination;