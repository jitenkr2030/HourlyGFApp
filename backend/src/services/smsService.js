const twilio = require('twilio');
const { logger } = require('../config/logger');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
exports.sendSMS = async (phone, message) => {
  try {
    // Ensure phone number has country code
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    logger.info(`SMS sent to ${phone}: ${result.sid}`);
    return result;
  } catch (error) {
    logger.error(`SMS send failed: ${error.message}`);
    // Don't throw error - SMS is not critical
    console.error('SMS sending failed:', error);
  }
};

// Send OTP via SMS
exports.sendOTPSMS = async (phone, otp) => {
  const message = `Your HourlyGF verification code is: ${otp}. Valid for 10 minutes.`;
  return await exports.sendSMS(phone, message);
};

module.exports = exports;
