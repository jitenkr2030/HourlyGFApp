# HourlyGF Backend API

Complete Node.js/Express backend for the HourlyGF Tinder-style companion booking application.

## Features

- ✅ Complete RESTful API
- ✅ JWT Authentication with refresh tokens
- ✅ MongoDB database with Mongoose ODM
- ✅ Real-time chat with Socket.IO
- ✅ Payment integration (Razorpay & Cashfree)
- ✅ File upload handling (Multer)
- ✅ Email & SMS notifications
- ✅ Rate limiting & security middleware
- ✅ Error handling & logging
- ✅ Input validation
- ✅ Background jobs support

## Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Real-time:** Socket.IO
- **Payment:** Razorpay, Cashfree
- **Email:** Nodemailer
- **SMS:** Twilio
- **File Storage:** Multer (with Sharp for image processing)
- **Logging:** Winston
- **Security:** Helmet, express-rate-limit, xss-clean, hpp

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js
│   │   └── logger.js
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── companionController.js
│   │   ├── matchController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   ├── chatController.js
│   │   └── reviewController.js
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Companion.js
│   │   ├── Match.js
│   │   ├── Booking.js
│   │   ├── Chat.js
│   │   ├── Payment.js
│   │   ├── Review.js
│   │   └── Notification.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── companionRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── chatRoutes.js
│   │   └── reviewRoutes.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   ├── rateLimiter.js
│   │   └── upload.js
│   ├── services/        # Business logic services
│   │   ├── razorpayService.js
│   │   ├── cashfreeService.js
│   │   ├── socketService.js
│   │   ├── emailService.js
│   │   └── smsService.js
│   └── utils/           # Utility functions
├── uploads/             # Uploaded files
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── server.js            # Application entry point
└── package.json         # Dependencies

```

## Installation

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or cloud)
- Redis (for background jobs, optional)

### Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your configuration:**
   - MongoDB connection string
   - JWT secrets
   - Razorpay API keys
   - Cashfree API keys
   - SMTP credentials
   - Twilio credentials
   - Other API keys

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Start production server:**
   ```bash
   npm start
   ```

## Environment Variables

### Required Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hourlygf

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cashfree
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret
CASHFREE_ENV=TEST or PROD

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/photos` - Upload photos
- `DELETE /api/users/photos/:id` - Delete photo
- `POST /api/users/verify` - Submit verification documents

### Companions
- `GET /api/companions` - Get all companions
- `GET /api/companions/:id` - Get companion details
- `GET /api/companions/nearby` - Get nearby companions
- `POST /api/companions/filter` - Filter companions
- `GET /api/companions/:id/availability` - Get availability

### Matches
- `POST /api/matches/like/:companionId` - Like companion
- `POST /api/matches/super-like/:companionId` - Super like
- `POST /api/matches/pass/:companionId` - Pass companion
- `GET /api/matches` - Get matches
- `DELETE /api/matches/:id` - Unmatch

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/confirm` - Confirm booking
- `DELETE /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/upcoming` - Get upcoming bookings

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/methods` - Get payment methods
- `GET /api/payments/transactions` - Get transaction history
- `POST /api/payments/refund` - Request refund

### Chat
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Get or create chat
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/chats/:id/read` - Mark as read
- `DELETE /api/chats/:id` - Delete chat

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/:companionId` - Get companion reviews
- `POST /api/reviews/:id/helpful` - Mark review helpful

## Socket.IO Events

### Client → Server
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `online` - User is online

### Server → Client
- `new_message` - New message received
- `user_typing` - User typing indicator
- `user_online` - User came online
- `user_offline` - User went offline
- `message_read_update` - Message read status update

## Payment Integration

### Razorpay
1. Create order using `/api/payments/create-order`
2. Process payment on client
3. Verify payment using `/api/payments/verify`

### Cashfree
1. Create order using `/api/payments/create-order`
2. Redirect to Cashfree payment page
3. Handle callback and verify

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all routes
- XSS protection
- MongoDB injection prevention
- Input validation
- CORS configuration
- Helmet security headers

## Development

### Run in development mode:
```bash
npm run dev
```

### Run tests:
```bash
npm test
```

### Seed database:
```bash
npm run seed
```

## Deployment

### Production Build
```bash
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Use production database
- Configure production API keys
- Set up SSL/TLS
- Configure reverse proxy (nginx)

## Error Handling

All errors are handled by the global error handler middleware. API responses follow this format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [...]
}
```

## Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT License

## Support

For support, email support@hourlygf.com

---

**Created by:** MiniMax Agent  
**Version:** 1.0.0  
**Last Updated:** 2025-11-17
