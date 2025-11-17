import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { matchAPI, handleApiError } from '../../services/api';

// Async thunks for match actions
export const swipeCompanion = createAsyncThunk(
  'matches/swipeCompanion',
  async ({ companionId, action }, { rejectWithValue }) => {
    try {
      const response = await matchAPI.swipe(companionId, action);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const superLikeCompanion = createAsyncThunk(
  'matches/superLikeCompanion',
  async (companionId, { rejectWithValue }) => {
    try {
      const response = await matchAPI.superLike(companionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchAPI.getMatches();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchMatchDetails = createAsyncThunk(
  'matches/fetchMatchDetails',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await matchAPI.getMatchDetails(matchId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const unmatch = createAsyncThunk(
  'matches/unmatch',
  async (matchId, { rejectWithValue }) => {
    try {
      await matchAPI.unmatch(matchId);
      return matchId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchSwipeQueue = createAsyncThunk(
  'matches/fetchSwipeQueue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchAPI.getSwipeQueue();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
const initialState = {
  swipeQueue: [],
  currentSwipeIndex: 0,
  matches: [],
  newMatches: [], // Matches that haven't been viewed yet
  selectedMatch: null,
  matchDetails: null,
  lastSwipeAction: null, // 'like', 'pass', 'superLike', or null
  swipedCompanions: new Set(), // Track swiped companions to avoid duplicates
  swipeHistory: [], // Store recent swipes for undo functionality
  loading: {
    swipe: false,
    fetchMatches: false,
    fetchDetails: false,
    unmatch: false,
    fetchQueue: false,
  },
  error: null,
  hasMore: true,
  page: 1,
  totalMatches: 0,
};

// Helper function to update swiped companions set
const updateSwipedSet = (state, companionId) => {
  if (state.swipedCompanions instanceof Set === false) {
    // Convert array to Set if needed
    state.swipedCompanions = new Set(Array.isArray(state.swipedCompanions) ? state.swipedCompanions : []);
  }
  state.swipedCompanions.add(companionId);
};

const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMatchState: (state) => {
      state.swipeQueue = [];
      state.currentSwipeIndex = 0;
      state.matches = [];
      state.newMatches = [];
      state.selectedMatch = null;
      state.matchDetails = null;
      state.lastSwipeAction = null;
      state.swipedCompanions = new Set();
      state.swipeHistory = [];
      state.hasMore = true;
      state.page = 1;
      state.totalMatches = 0;
    },
    setSwipeQueue: (state, action) => {
      state.swipeQueue = action.payload;
      state.currentSwipeIndex = 0;
    },
    addToSwipeQueue: (state, action) => {
      const companions = action.payload;
      // Filter out already swiped companions
      const newCompanions = companions.filter(companion => 
        !state.swipedCompanions.has(companion._id)
      );
      state.swipeQueue = [...state.swipeQueue, ...newCompanions];
    },
    incrementSwipeIndex: (state) => {
      if (state.currentSwipeIndex < state.swipeQueue.length - 1) {
        state.currentSwipeIndex += 1;
      }
    },
    decrementSwipeIndex: (state) => {
      if (state.currentSwipeIndex > 0) {
        state.currentSwipeIndex -= 1;
      }
    },
    resetSwipeIndex: (state) => {
      state.currentSwipeIndex = 0;
    },
    setSelectedMatch: (state, action) => {
      state.selectedMatch = action.payload;
    },
    markMatchAsViewed: (state, action) => {
      const matchId = action.payload;
      state.newMatches = state.newMatches.filter(match => match._id !== matchId);
      
      // Update match in main matches array
      const matchIndex = state.matches.findIndex(match => match._id === matchId);
      if (matchIndex !== -1) {
        state.matches[matchIndex].isViewed = true;
      }
    },
    addMatch: (state, action) => {
      const newMatch = action.payload;
      const existingIndex = state.matches.findIndex(match => match._id === newMatch._id);
      
      if (existingIndex === -1) {
        state.matches.unshift(newMatch); // Add to beginning
        state.newMatches.unshift(newMatch); // Also add to new matches
      } else {
        state.matches[existingIndex] = newMatch;
      }
    },
    removeMatch: (state, action) => {
      const matchId = action.payload;
      state.matches = state.matches.filter(match => match._id !== matchId);
      state.newMatches = state.newMatches.filter(match => match._id !== matchId);
      
      if (state.selectedMatch && state.selectedMatch._id === matchId) {
        state.selectedMatch = null;
      }
      
      if (state.matchDetails && state.matchDetails._id === matchId) {
        state.matchDetails = null;
      }
    },
    undoLastSwipe: (state) => {
      if (state.swipeHistory.length > 0) {
        const lastSwipe = state.swipeHistory.pop();
        const { companionId, previousIndex } = lastSwipe;
        
        // Remove from swiped companions
        if (state.swipedCompanions instanceof Set) {
          state.swipedCompanions.delete(companionId);
        } else {
          state.swipedCompanions = state.swipedCompanions.filter(id => id !== companionId);
        }
        
        // Reset swipe index
        state.currentSwipeIndex = previousIndex;
        
        // If there was a match, remove it
        if (lastSwipe.result && lastSwipe.result.isMatch) {
          state.matches = state.matches.filter(match => 
            match.companion._id !== companionId
          );
          state.newMatches = state.newMatches.filter(match => 
            match.companion._id !== companionId
          );
        }
        
        state.lastSwipeAction = null;
      }
    },
    clearSwipeHistory: (state) => {
      state.swipeHistory = [];
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateMatchStatus: (state, action) => {
      const { matchId, status } = action.payload;
      
      const matchIndex = state.matches.findIndex(match => match._id === matchId);
      if (matchIndex !== -1) {
        state.matches[matchIndex].status = status;
      }
      
      const newMatchIndex = state.newMatches.findIndex(match => match._id === matchId);
      if (newMatchIndex !== -1) {
        state.newMatches[newMatchIndex].status = status;
      }
      
      if (state.selectedMatch && state.selectedMatch._id === matchId) {
        state.selectedMatch.status = status;
      }
    },
    addToSwipeHistory: (state, action) => {
      state.swipeHistory.push(action.payload);
      // Keep only last 10 swipes for memory management
      if (state.swipeHistory.length > 10) {
        state.swipeHistory = state.swipeHistory.slice(-10);
      }
    },
  },
  extraReducers: (builder) => {
    // Swipe Companion
    builder
      .addCase(swipeCompanion.pending, (state) => {
        state.loading.swipe = true;
        state.error = null;
      })
      .addCase(swipeCompanion.fulfilled, (state, action) => {
        state.loading.swipe = false;
        const { companionId, action: swipeAction, result } = action.payload;
        
        // Track the swipe
        updateSwipedSet(state, companionId);
        
        // Add to swipe history for undo functionality
        state.swipeHistory.push({
          companionId,
          action: swipeAction,
          previousIndex: state.currentSwipeIndex,
          result,
          timestamp: Date.now(),
        });
        
        state.lastSwipeAction = swipeAction;
        
        // If it's a match, add to matches
        if (result && result.isMatch && result.match) {
          const existingIndex = state.matches.findIndex(match => 
            match.companion._id === companionId
          );
          
          if (existingIndex === -1) {
            state.matches.unshift(result.match);
            state.newMatches.unshift(result.match);
          }
        }
        
        // Move to next companion
        if (state.currentSwipeIndex < state.swipeQueue.length - 1) {
          state.currentSwipeIndex += 1;
        }
      })
      .addCase(swipeCompanion.rejected, (state, action) => {
        state.loading.swipe = false;
        state.error = action.payload;
      });

    // Super Like Companion
    builder
      .addCase(superLikeCompanion.pending, (state) => {
        state.loading.swipe = true;
        state.error = null;
      })
      .addCase(superLikeCompanion.fulfilled, (state, action) => {
        state.loading.swipe = false;
        const { companionId, result } = action.payload;
        
        // Track the swipe
        updateSwipedSet(state, companionId);
        
        // Add to swipe history
        state.swipeHistory.push({
          companionId,
          action: 'superLike',
          previousIndex: state.currentSwipeIndex,
          result,
          timestamp: Date.now(),
        });
        
        state.lastSwipeAction = 'superLike';
        
        // Super like always results in a match
        if (result && result.isMatch && result.match) {
          const existingIndex = state.matches.findIndex(match => 
            match.companion._id === companionId
          );
          
          if (existingIndex === -1) {
            state.matches.unshift(result.match);
            state.newMatches.unshift(result.match);
          }
        }
        
        // Move to next companion
        if (state.currentSwipeIndex < state.swipeQueue.length - 1) {
          state.currentSwipeIndex += 1;
        }
      })
      .addCase(superLikeCompanion.rejected, (state, action) => {
        state.loading.swipe = false;
        state.error = action.payload;
      });

    // Fetch Matches
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading.fetchMatches = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading.fetchMatches = false;
        const { matches, pagination } = action.payload;
        
        // Separate new matches (not viewed yet)
        const newMatches = matches.filter(match => !match.isViewed);
        const viewedMatches = matches.filter(match => match.isViewed);
        
        state.matches = [...newMatches, ...viewedMatches];
        state.newMatches = newMatches;
        state.totalMatches = pagination.total;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading.fetchMatches = false;
        state.error = action.payload;
      });

    // Fetch Match Details
    builder
      .addCase(fetchMatchDetails.pending, (state) => {
        state.loading.fetchDetails = true;
        state.error = null;
      })
      .addCase(fetchMatchDetails.fulfilled, (state, action) => {
        state.loading.fetchDetails = false;
        const matchDetails = action.payload;
        
        state.matchDetails = matchDetails;
        
        // Update match in the list if it exists
        const matchIndex = state.matches.findIndex(match => match._id === matchDetails._id);
        if (matchIndex !== -1) {
          state.matches[matchIndex] = matchDetails;
        }
        
        // Remove from new matches if it was there
        state.newMatches = state.newMatches.filter(match => match._id !== matchDetails._id);
      })
      .addCase(fetchMatchDetails.rejected, (state, action) => {
        state.loading.fetchDetails = false;
        state.error = action.payload;
      });

    // Unmatch
    builder
      .addCase(unmatch.pending, (state) => {
        state.loading.unmatch = true;
        state.error = null;
      })
      .addCase(unmatch.fulfilled, (state, action) => {
        state.loading.unmatch = false;
        const matchId = action.payload;
        
        // Remove from matches
        state.matches = state.matches.filter(match => match._id !== matchId);
        state.newMatches = state.newMatches.filter(match => match._id !== matchId);
        
        // Clear selected match if it's the one we unmatched
        if (state.selectedMatch && state.selectedMatch._id === matchId) {
          state.selectedMatch = null;
        }
        
        if (state.matchDetails && state.matchDetails._id === matchId) {
          state.matchDetails = null;
        }
      })
      .addCase(unmatch.rejected, (state, action) => {
        state.loading.unmatch = false;
        state.error = action.payload;
      });

    // Fetch Swipe Queue
    builder
      .addCase(fetchSwipeQueue.pending, (state) => {
        state.loading.fetchQueue = true;
        state.error = null;
      })
      .addCase(fetchSwipeQueue.fulfilled, (state, action) => {
        state.loading.fetchQueue = false;
        const companions = action.payload;
        
        // Filter out already swiped companions
        const availableCompanions = companions.filter(companion => 
          !state.swipedCompanions.has(companion._id)
        );
        
        state.swipeQueue = [...state.swipeQueue, ...availableCompanions];
        state.hasMore = companions.length === 20; // Assuming page size of 20
      })
      .addCase(fetchSwipeQueue.rejected, (state, action) => {
        state.loading.fetchQueue = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearMatchState,
  setSwipeQueue,
  addToSwipeQueue,
  incrementSwipeIndex,
  decrementSwipeIndex,
  resetSwipeIndex,
  setSelectedMatch,
  markMatchAsViewed,
  addMatch,
  removeMatch,
  undoLastSwipe,
  clearSwipeHistory,
  setLoading,
  setError,
  updateMatchStatus,
  addToSwipeHistory,
} = matchSlice.actions;

export default matchSlice.reducer;

// Selectors
export const selectSwipeQueue = (state) => state.matches.swipeQueue;
export const selectCurrentSwipeIndex = (state) => state.matches.currentSwipeIndex;
export const selectCurrentCompanion = (state) => {
  const { swipeQueue, currentSwipeIndex } = state.matches;
  return swipeQueue[currentSwipeIndex] || null;
};
export const selectMatches = (state) => state.matches.matches;
export const selectNewMatches = (state) => state.matches.newMatches;
export const selectSelectedMatch = (state) => state.matches.selectedMatch;
export const selectMatchDetails = (state) => state.matches.matchDetails;
export const selectLastSwipeAction = (state) => state.matches.lastSwipeAction;
export const selectSwipeHistory = (state) => state.matches.swipeHistory;
export const selectMatchLoading = (state) => state.matches.loading;
export const selectMatchError = (state) => state.matches.error;
export const selectHasMoreSwipes = (state) => state.matches.hasMore;
export const selectTotalMatches = (state) => state.matches.totalMatches;
export const selectSwipedCompanions = (state) => state.matches.swipedCompanions;