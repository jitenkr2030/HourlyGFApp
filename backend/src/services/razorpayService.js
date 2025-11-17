const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
exports.createRazorpayOrder = async (amount, bookingId) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString()
      }
    };

    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error('Failed to create payment order');
  }
};

// Verify Razorpay payment signature
exports.verifyRazorpayPayment = (orderId, paymentId, signature) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Razorpay verification failed:', error);
    return false;
  }
};

// Fetch payment details
exports.fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment failed:', error);
    throw new Error('Failed to fetch payment details');
  }
};

// Create refund
exports.createRefund = async (paymentId, amount) => {
  try {
    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Amount in paise
      speed: 'normal'
    });
    return refund;
  } catch (error) {
    console.error('Razorpay refund failed:', error);
    throw new Error('Failed to process refund');
  }
};

module.exports = exports;
