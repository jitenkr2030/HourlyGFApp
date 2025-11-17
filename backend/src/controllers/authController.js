const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, gender, dob, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      gender,
      dob,
      role: role || 'user'
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email and SMS
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your HourlyGF account',
        message: `Your verification code is: ${otp}. Valid for 10 minutes.`
      });

      await sendSMS(user.phone, `Your HourlyGF verification code is: ${otp}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
    }

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Please verify your account.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verified: user.verified
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Validate input
    if (!emailOrPhone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email/phone and password'
      });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Update last login and online status
    user.lastActive = Date.now();
    user.isOnline = true;
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verified: user.verified,
          photos: user.photos
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Private
exports.verifyOTP = async (req, res, next) => {
  try {
    const { otp, type } = req.body; // type: 'email' or 'phone'

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Update verification status
    if (type === 'email') {
      user.verified.email = true;
    } else if (type === 'phone') {
      user.verified.phone = true;
    }

    // Clear OTP
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `${type} verified successfully`,
      data: {
        verified: user.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Private
exports.resendOTP = async (req, res, next) => {
  try {
    const { type } = req.body; // 'email' or 'phone'

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP
    if (type === 'email') {
      await sendEmail({
        email: user.email,
        subject: 'Verify your HourlyGF account',
        message: `Your verification code is: ${otp}. Valid for 10 minutes.`
      });
    } else if (type === 'phone') {
      await sendSMS(user.phone, `Your HourlyGF verification code is: ${otp}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Update user online status
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastActive: Date.now()
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate new tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      status: 'success',
      data: {
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with this email'
      });
    }

    // Generate OTP for password reset
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - HourlyGF',
      message: `Your password reset code is: ${otp}. Valid for 10 minutes.`
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
