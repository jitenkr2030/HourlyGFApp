const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../services/razorpayService');
const { createCashfreeOrder, verifyCashfreePayment } = require('../services/cashfreeService');

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId, gateway } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    let order;
    let payment;

    // Create order based on gateway
    if (gateway === 'razorpay') {
      order = await createRazorpayOrder(booking.pricing.totalAmount, booking._id);
      
      payment = await Payment.create({
        userId: req.user.id,
        bookingId: booking._id,
        amount: booking.pricing.totalAmount,
        gateway: 'razorpay',
        gatewayOrderId: order.id,
        paymentMethod: 'razorpay',
        status: 'pending'
      });
    } else if (gateway === 'cashfree') {
      order = await createCashfreeOrder(booking.pricing.totalAmount, booking._id, req.user);
      
      payment = await Payment.create({
        userId: req.user.id,
        bookingId: booking._id,
        amount: booking.pricing.totalAmount,
        gateway: 'cashfree',
        gatewayOrderId: order.order_id,
        paymentMethod: 'cashfree',
        status: 'pending'
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment gateway'
      });
    }

    // Update booking with payment ID
    booking.paymentId = payment._id;
    await booking.save();

    res.status(201).json({
      status: 'success',
      data: {
        orderId: order.id || order.order_id,
        amount: booking.pricing.totalAmount,
        currency: 'INR',
        gateway,
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, orderId, signature, gateway } = req.body;

    let isValid = false;

    if (gateway === 'razorpay') {
      isValid = verifyRazorpayPayment(orderId, paymentId, signature);
    } else if (gateway === 'cashfree') {
      isValid = await verifyCashfreePayment(orderId);
    }

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed'
      });
    }

    // Update payment status
    const payment = await Payment.findOneAndUpdate(
      { gatewayOrderId: orderId },
      {
        status: 'success',
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        paidAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Update booking payment status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
exports.getPaymentMethods = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        methods: [
          { id: 'razorpay', name: 'Razorpay', enabled: true },
          { id: 'cashfree', name: 'Cashfree', enabled: true },
          { id: 'upi', name: 'UPI', enabled: true },
          { id: 'card', name: 'Credit/Debit Card', enabled: true },
          { id: 'netbanking', name: 'Net Banking', enabled: true }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction history
// @route   GET /api/payments/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request refund
// @route   POST /api/payments/refund
// @access  Private
exports.requestRefund = async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    const booking = await Booking.findById(payment.bookingId);
    const refundAmount = booking.cancellation.refundAmount || 0;

    if (refundAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No refund applicable'
      });
    }

    payment.refund = {
      amount: refundAmount,
      reason,
      status: 'pending',
      initiatedAt: new Date()
    };

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Refund request submitted',
      data: { refundAmount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay webhook
// @route   POST /api/payments/webhook/razorpay
// @access  Public
exports.razorpayWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;

    // Store webhook data
    const payment = await Payment.findOneAndUpdate(
      { gatewayOrderId: webhookData.payload.payment.entity.order_id },
      { webhookData },
      { new: true }
    );

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Cashfree webhook
// @route   POST /api/payments/webhook/cashfree
// @access  Public
exports.cashfreeWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;

    const payment = await Payment.findOneAndUpdate(
      { gatewayOrderId: webhookData.order_id },
      { webhookData },
      { new: true }
    );

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
