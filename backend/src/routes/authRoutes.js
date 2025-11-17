const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  verifyOTP,
  resendOTP,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { protect, verifyRefreshToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required')
];

const loginValidation = [
  body('emailOrPhone').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/verify-otp', protect, verifyOTP);
router.post('/resend-otp', protect, otpLimiter, resendOTP);
router.post('/logout', protect, logout);
router.post('/refresh-token', verifyRefreshToken, refreshToken);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
