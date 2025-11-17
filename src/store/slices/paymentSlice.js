import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  paymentMethods: [],
  transactions: [],
  selectedMethod: null,
  loading: false,
  error: null,
  currentTransaction: null,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setPaymentMethods: (state, action) => {
      state.paymentMethods = action.payload;
    },
    addPaymentMethod: (state, action) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethod: (state, action) => {
      state.paymentMethods = state.paymentMethods.filter(m => m.id !== action.payload);
    },
    setSelectedMethod: (state, action) => {
      state.selectedMethod = action.payload;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    setCurrentTransaction: (state, action) => {
      state.currentTransaction = action.payload;
    },
    updateTransactionStatus: (state, action) => {
      const { id, status } = action.payload;
      const transaction = state.transactions.find(t => t.id === id);
      if (transaction) {
        transaction.status = status;
      }
      if (state.currentTransaction?.id === id) {
        state.currentTransaction.status = status;
      }
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
  setPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setSelectedMethod,
  setTransactions,
  addTransaction,
  setCurrentTransaction,
  updateTransactionStatus,
  setLoading,
  setError,
} = paymentSlice.actions;

export default paymentSlice.reducer;
