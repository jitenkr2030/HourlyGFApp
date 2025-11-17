import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';
import { API_BASE_URL, RAZORPAY_KEY_ID } from '../constants/config';

/**
 * Payment Service
 * Handles payment processing for Razorpay, Cashfree, and Custom payment methods
 */

class PaymentService {
  /**
   * Initialize Razorpay Payment
   */
  async processRazorpayPayment(orderData) {
    try {
      const { amount, bookingId, userId, userName, userEmail, userPhone } = orderData;

      // Create order on backend
      const orderResponse = await axios.post(`${API_BASE_URL}/payments/razorpay/create-order`, {
        amount,
        currency: 'INR',
        bookingId,
        userId,
      });

      const { orderId, key } = orderResponse.data;

      // Razorpay options
      const options = {
        description: 'HourlyGF Booking Payment',
        image: 'https://yourdomain.com/logo.png',
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paise
        order_id: orderId,
        name: 'HourlyGF',
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        theme: {
          color: '#FF6B6B',
        },
      };

      return new Promise((resolve, reject) => {
        RazorpayCheckout.open(options)
          .then((data) => {
            // Payment successful
            this.verifyRazorpayPayment(data, bookingId)
              .then(resolve)
              .catch(reject);
          })
          .catch((error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.error('Razorpay Payment Error:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay Payment
   */
  async verifyRazorpayPayment(paymentData, bookingId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/razorpay/verify`, {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        bookingId,
      });

      return response.data;
    } catch (error) {
      console.error('Payment Verification Error:', error);
      throw error;
    }
  }

  /**
   * Process Cashfree Payment
   */
  async processCashfreePayment(orderData) {
    try {
      const { amount, bookingId, userId, userName, userEmail, userPhone } = orderData;

      // Create order on backend
      const orderResponse = await axios.post(`${API_BASE_URL}/payments/cashfree/create-order`, {
        amount,
        currency: 'INR',
        bookingId,
        userId,
        customerName: userName,
        customerEmail: userEmail,
        customerPhone: userPhone,
      });

      const { orderId, paymentSessionId } = orderResponse.data;

      // Open Cashfree payment page
      // You'll need to integrate Cashfree SDK or use WebView
      return {
        orderId,
        paymentSessionId,
        // Return URL for WebView implementation
        paymentUrl: `https://payments.cashfree.com/order/${paymentSessionId}`,
      };
    } catch (error) {
      console.error('Cashfree Payment Error:', error);
      throw error;
    }
  }

  /**
   * Verify Cashfree Payment
   */
  async verifyCashfreePayment(orderId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/cashfree/verify`, {
        orderId,
      });

      return response.data;
    } catch (error) {
      console.error('Cashfree Verification Error:', error);
      throw error;
    }
  }

  /**
   * Process UPI Payment
   */
  async processUPIPayment(orderData) {
    try {
      const { amount, bookingId, userId, upiId } = orderData;

      const response = await axios.post(`${API_BASE_URL}/payments/upi/create`, {
        amount,
        bookingId,
        userId,
        upiId,
      });

      return response.data;
    } catch (error) {
      console.error('UPI Payment Error:', error);
      throw error;
    }
  }

  /**
   * Get Payment Methods
   */
  async getPaymentMethods(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/methods/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get Payment Methods Error:', error);
      throw error;
    }
  }

  /**
   * Add Payment Method
   */
  async addPaymentMethod(userId, methodData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/methods`, {
        userId,
        ...methodData,
      });
      return response.data;
    } catch (error) {
      console.error('Add Payment Method Error:', error);
      throw error;
    }
  }

  /**
   * Delete Payment Method
   */
  async deletePaymentMethod(methodId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/payments/methods/${methodId}`);
      return response.data;
    } catch (error) {
      console.error('Delete Payment Method Error:', error);
      throw error;
    }
  }

  /**
   * Get Transaction History
   */
  async getTransactionHistory(userId, page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/transactions/${userId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get Transaction History Error:', error);
      throw error;
    }
  }

  /**
   * Request Refund
   */
  async requestRefund(paymentId, reason) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/refund`, {
        paymentId,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Refund Request Error:', error);
      throw error;
    }
  }

  /**
   * Get Payment Status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/status/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Get Payment Status Error:', error);
      throw error;
    }
  }
}

export default new PaymentService();
