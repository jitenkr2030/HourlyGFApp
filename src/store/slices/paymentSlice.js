import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentAPI, handleApiError } from '../../services/api';

// Async thunks for payment actions
export const createPaymentOrder = createAsyncThunk(
  'payments/createPaymentOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.createOrder(orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payments/verifyPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.verifyPayment(paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payments/fetchPaymentHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getHistory();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchPaymentDetails = createAsyncThunk(
  'payments/fetchPaymentDetails',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getDetails(paymentId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const processRefund = createAsyncThunk(
  'payments/processRefund',
  async ({ paymentId, refundData }, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.processRefund(paymentId, refundData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'payments/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updatePaymentMethod = createAsyncThunk(
  'payments/updatePaymentMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.updatePaymentMethod(methodData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial state
const initialState = {
  paymentMethods: [],
  transactions: [],
  currentTransaction: null,
  paymentDetails: null,
  selectedPaymentMethod: null,
  orderDetails: null, // Razorpay/Cashfree order details
  paymentHistory: {
    transactions: [],
    totalPages: 0,
    currentPage: 1,
    hasMore: false,
  },
  filters: {
    status: 'all', // 'all', 'pending', 'completed', 'failed', 'refunded'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
    method: 'all', // 'all', 'razorpay', 'cashfree', 'custom'
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  statistics: {
    totalTransactions: 0,
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalRefunds: 0,
    averageTransactionAmount: 0,
  },
  paymentGateways: {
    razorpay: {
      enabled: true,
      keyId: null,
      keySecret: null,
    },
    cashfree: {
      enabled: true,
      appId: null,
      secretKey: null,
    },
    custom: {
      enabled: false,
    },
  },
  loading: {
    createOrder: false,
    verifyPayment: false,
    fetchHistory: false,
    fetchDetails: false,
    processRefund: false,
    fetchMethods: false,
    updateMethod: false,
  },
  error: null,
  hasMore: true,
  page: 1,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPaymentState: (state) => {
      state.transactions = [];
      state.currentTransaction = null;
      state.paymentDetails = null;
      state.selectedPaymentMethod = null;
      state.orderDetails = null;
      state.paymentHistory = initialState.paymentHistory;
      state.statistics = initialState.statistics;
      state.error = null;
      state.hasMore = true;
      state.page = 1;
    },
    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
    },
    setCurrentTransaction: (state, action) => {
      state.currentTransaction = action.payload;
    },
    updateTransactionLocally: (state, action) => {
      const { transactionId, updates } = action.payload;
      
      // Update in transactions array
      const transactionIndex = state.transactions.findIndex(t => t._id === transactionId);
      if (transactionIndex !== -1) {
        state.transactions[transactionIndex] = { 
          ...state.transactions[transactionIndex], 
          ...updates 
        };
      }
      
      // Update in payment history
      const historyIndex = state.paymentHistory.transactions.findIndex(t => t._id === transactionId);
      if (historyIndex !== -1) {
        state.paymentHistory.transactions[historyIndex] = { 
          ...state.paymentHistory.transactions[historyIndex], 
          ...updates 
        };
      }
      
      // Update current transaction if it matches
      if (state.currentTransaction && state.currentTransaction._id === transactionId) {
        state.currentTransaction = { ...state.currentTransaction, ...updates };
      }
    },
    addTransaction: (state, action) => {
      const transaction = action.payload;
      state.transactions.unshift(transaction);
      state.paymentHistory.transactions.unshift(transaction);
      
      // Update statistics
      if (transaction.status === 'completed') {
        state.statistics.successfulPayments += 1;
        state.statistics.totalAmount += transaction.amount || 0;
      } else if (transaction.status === 'failed') {
        state.statistics.failedPayments += 1;
      }
      
      state.statistics.totalTransactions += 1;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    updatePaymentMethod: (state, action) => {
      const updatedMethod = action.payload;
      const methodIndex = state.paymentMethods.findIndex(m => m._id === updatedMethod._id);
      if (methodIndex !== -1) {
        state.paymentMethods[methodIndex] = updatedMethod;
      }
    },
    addPaymentMethod: (state, action) => {
      const method = action.payload;
      state.paymentMethods.push(method);
    },
    removePaymentMethod: (state, action) => {
      const methodId = action.payload;
      state.paymentMethods = state.paymentMethods.filter(m => m._id !== methodId);
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setOrderDetails: (state, action) => {
      state.orderDetails = action.payload;
    },
    clearOrderDetails: (state) => {
      state.orderDetails = null;
    },
    updatePaymentGatewayStatus: (state, action) => {
      const { gateway, enabled } = action.payload;
      if (state.paymentGateways[gateway]) {
        state.paymentGateways[gateway].enabled = enabled;
      }
    },
    setPaymentGatewayConfig: (state, action) => {
      const { gateway, config } = action.payload;
      if (state.paymentGateways[gateway]) {
        state.paymentGateways[gateway] = { ...state.paymentGateways[gateway], ...config };
      }
    },
    resetPagination: (state) => {
      state.page = 1;
      state.hasMore = true;
      state.paymentHistory = initialState.paymentHistory;
    },
  },
  extraReducers: (builder) => {
    // Create Payment Order
    builder
      .addCase(createPaymentOrder.pending, (state) => {
        state.loading.createOrder = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading.createOrder = false;
        state.orderDetails = action.payload;
        state.currentTransaction = {
          orderId: action.payload.orderId,
          amount: action.payload.amount,
          currency: action.payload.currency,
          status: 'pending',
        };
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading.createOrder = false;
        state.error = action.payload;
      });

    // Verify Payment
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.loading.verifyPayment = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading.verifyPayment = false;
        const verifiedTransaction = action.payload;
        
        // Add to transactions
        state.transactions.unshift(verifiedTransaction);
        state.paymentHistory.transactions.unshift(verifiedTransaction);
        
        // Update current transaction
        state.currentTransaction = verifiedTransaction;
        
        // Update statistics
        if (verifiedTransaction.status === 'completed') {
          state.statistics.successfulPayments += 1;
          state.statistics.totalAmount += verifiedTransaction.amount || 0;
        }
        state.statistics.totalTransactions += 1;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading.verifyPayment = false;
        state.error = action.payload;
      });

    // Fetch Payment History
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading.fetchHistory = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading.fetchHistory = false;
        const { transactions, pagination, statistics } = action.payload;
        
        if (action.meta.arg?.page === 1) {
          state.paymentHistory.transactions = transactions;
        } else {
          state.paymentHistory.transactions = [
            ...state.paymentHistory.transactions,
            ...transactions
          ];
        }
        
        state.paymentHistory.totalPages = pagination.totalPages;
        state.paymentHistory.currentPage = pagination.page;
        state.paymentHistory.hasMore = pagination.hasMore;
        state.statistics = statistics || initialState.statistics;
        state.hasMore = pagination.hasMore;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading.fetchHistory = false;
        state.error = action.payload;
      });

    // Fetch Payment Details
    builder
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.loading.fetchDetails = true;
        state.error = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
        state.loading.fetchDetails = false;
        state.paymentDetails = action.payload;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.loading.fetchDetails = false;
        state.error = action.payload;
      });

    // Process Refund
    builder
      .addCase(processRefund.pending, (state) => {
        state.loading.processRefund = true;
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.loading.processRefund = false;
        const refundedTransaction = action.payload;
        
        // Update transaction status
        const updateTransaction = (transaction) => {
          if (transaction._id === refundedTransaction._id) {
            return refundedTransaction;
          }
          return transaction;
        };
        
        state.transactions = state.transactions.map(updateTransaction);
        state.paymentHistory.transactions = state.paymentHistory.transactions.map(updateTransaction);
        
        // Update statistics
        state.statistics.totalRefunds += 1;
        
        if (state.currentTransaction && state.currentTransaction._id === refundedTransaction._id) {
          state.currentTransaction = refundedTransaction;
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.loading.processRefund = false;
        state.error = action.payload;
      });

    // Fetch Payment Methods
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading.fetchMethods = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loading.fetchMethods = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading.fetchMethods = false;
        state.error = action.payload;
      });

    // Update Payment Method
    builder
      .addCase(updatePaymentMethod.pending, (state) => {
        state.loading.updateMethod = true;
        state.error = null;
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.loading.updateMethod = false;
        const updatedMethod = action.payload;
        
        const methodIndex = state.paymentMethods.findIndex(m => m._id === updatedMethod._id);
        if (methodIndex !== -1) {
          state.paymentMethods[methodIndex] = updatedMethod;
        } else {
          state.paymentMethods.push(updatedMethod);
        }
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.loading.updateMethod = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearPaymentState,
  setSelectedPaymentMethod,
  setCurrentTransaction,
  updateTransactionLocally,
  addTransaction,
  setFilters,
  clearFilters,
  updatePaymentMethod,
  addPaymentMethod,
  removePaymentMethod,
  setLoading,
  setError,
  setOrderDetails,
  clearOrderDetails,
  updatePaymentGatewayStatus,
  setPaymentGatewayConfig,
  resetPagination,
} = paymentSlice.actions;

export default paymentSlice.reducer;

// Selectors
export const selectTransactions = (state) => state.payments.transactions;
export const selectPaymentHistory = (state) => state.payments.paymentHistory.transactions;
export const selectCurrentTransaction = (state) => state.payments.currentTransaction;
export const selectPaymentDetails = (state) => state.payments.paymentDetails;
export const selectPaymentMethods = (state) => state.payments.paymentMethods;
export const selectSelectedPaymentMethod = (state) => state.payments.selectedPaymentMethod;
export const selectOrderDetails = (state) => state.payments.orderDetails;
export const selectPaymentFilters = (state) => state.payments.filters;
export const selectPaymentStatistics = (state) => state.payments.statistics;
export const selectPaymentGateways = (state) => state.payments.paymentGateways;
export const selectPaymentLoading = (state) => state.payments.loading;
export const selectPaymentError = (state) => state.payments.error;
export const selectHasMorePayments = (state) => state.payments.hasMore;