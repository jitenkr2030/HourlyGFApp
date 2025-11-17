const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send email
exports.sendEmail = async ({ email, subject, message, html }) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: subject,
      text: message,
      html: html || message
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    throw new Error('Failed to send email');
  }
};

// Send booking confirmation email
exports.sendBookingConfirmation = async (user, booking, companion) => {
  const subject = 'Booking Confirmation - HourlyGF';
  const message = `
    Hi ${user.name},

    Your booking has been confirmed!

    Companion: ${companion.userId.name}
    Date: ${new Date(booking.bookingDate).toLocaleDateString()}
    Time: ${booking.startTime} - ${booking.endTime}
    Duration: ${booking.durationHours} hours
    Amount: ₹${booking.pricing.totalAmount}

    Thank you for using HourlyGF!

    Best regards,
    HourlyGF Team
  `;

  return await exports.sendEmail({ email: user.email, subject, message });
};

// Send OTP email
exports.sendOTPEmail = async (email, otp) => {
  const subject = 'Verification Code - HourlyGF';
  const message = `
    Your verification code is: ${otp}
    
    This code will expire in 10 minutes.
    
    If you didn't request this code, please ignore this email.
  `;

  return await exports.sendEmail({ email, subject, message });
};

module.exports = exports;
