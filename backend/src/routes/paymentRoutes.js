const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

const {
  createOrder,
  verifyPayment,
  getPaymentMethods,
  getTransactions,
  requestRefund,
  razorpayWebhook,
  cashfreeWebhook
} = require('../controllers/paymentController');

router.post('/create-order', protect, paymentLimiter, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/methods', protect, getPaymentMethods);
router.get('/transactions', protect, getTransactions);
router.post('/refund', protect, requestRefund);

// Webhooks (public routes)
router.post('/webhook/razorpay', razorpayWebhook);
router.post('/webhook/cashfree', cashfreeWebhook);

module.exports = router;
