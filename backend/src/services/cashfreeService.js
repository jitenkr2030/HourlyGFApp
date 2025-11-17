const axios = require('axios');
const crypto = require('crypto');

const CASHFREE_URL = process.env.CASHFREE_ENV === 'PROD' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

// Create Cashfree order
exports.createCashfreeOrder = async (amount, bookingId, user) => {
  try {
    const orderId = `order_${Date.now()}_${bookingId}`;

    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/payment/callback`,
        notify_url: `${process.env.API_URL}/api/payments/webhook/cashfree`
      },
      order_note: `Booking ${bookingId}`
    };

    const response = await axios.post(
      `${CASHFREE_URL}/orders`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Cashfree order creation failed:', error.response?.data || error);
    throw new Error('Failed to create Cashfree order');
  }
};

// Verify Cashfree payment
exports.verifyCashfreePayment = async (orderId) => {
  try {
    const response = await axios.get(
      `${CASHFREE_URL}/orders/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01'
        }
      }
    );

    return response.data.order_status === 'PAID';
  } catch (error) {
    console.error('Cashfree verification failed:', error.response?.data || error);
    return false;
  }
};

// Create Cashfree refund
exports.createCashfreeRefund = async (orderId, refundAmount) => {
  try {
    const refundId = `refund_${Date.now()}`;

    const refundData = {
      refund_id: refundId,
      refund_amount: refundAmount,
      refund_note: 'Booking cancellation refund'
    };

    const response = await axios.post(
      `${CASHFREE_URL}/orders/${orderId}/refunds`,
      refundData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Cashfree refund failed:', error.response?.data || error);
    throw new Error('Failed to process Cashfree refund');
  }
};

module.exports = exports;
