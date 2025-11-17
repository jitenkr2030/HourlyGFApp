const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide amount'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cashfree', 'upi', 'card', 'netbanking', 'wallet', 'cash'],
    required: true
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'cashfree', 'custom'],
    required: true
  },
  gatewayOrderId: {
    type: String,
    required: true
  },
  gatewayPaymentId: {
    type: String
  },
  gatewaySignature: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    cardNetwork: String,
    bank: String,
    wallet: String,
    vpa: String, // For UPI
    accountNumber: String
  },
  refund: {
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    gatewayRefundId: String,
    initiatedAt: Date,
    completedAt: Date,
    failureReason: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String
  },
  invoice: {
    invoiceNumber: String,
    invoiceUrl: String,
    generatedAt: Date
  },
  webhookData: mongoose.Schema.Types.Mixed,
  failureReason: String,
  failureCode: String,
  retryCount: {
    type: Number,
    default: 0
  },
  paidAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Generate unique transaction ID
paymentSchema.pre('save', function(next) {
  if (!this.transactionId && this.status === 'success') {
    this.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Generate invoice number
paymentSchema.methods.generateInvoice = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  this.invoice.invoiceNumber = `INV${year}${month}${random}`;
  this.invoice.generatedAt = new Date();
  return this.invoice.invoiceNumber;
};

module.exports = mongoose.model('Payment', paymentSchema);
