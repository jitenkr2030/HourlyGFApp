# HourlyGF Backend - Complete Setup Guide

## 🚀 Quick Start (Development)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB
sudo service mongodb start
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env` file

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Minimum Required Configuration:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hourlygf
JWT_SECRET=mysupersecretkey123456
JWT_REFRESH_SECRET=myrefreshsecret123456
```

### Step 4: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on http://localhost:5000

---

## 📋 Complete Configuration

### 1. Payment Gateways

#### Razorpay Setup
1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Copy Key ID and Key Secret
4. Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

#### Cashfree Setup
1. Sign up at https://www.cashfree.com
2. Get API credentials from dashboard
3. Add to `.env`:
```env
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=TEST
```

### 2. Email Configuration (Nodemailer)

#### Using Gmail:
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_digit_app_password
FROM_EMAIL=noreply@hourlygf.com
FROM_NAME=HourlyGF
```

### 3. SMS Configuration (Twilio)

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Get a Twilio phone number
4. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Firebase (Push Notifications)

1. Go to Firebase Console: https://console.firebase.google.com
2. Create project
3. Download service account JSON
4. Extract credentials and add to `.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

---

## 🧪 Testing the API

### 1. Test Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2025-11-17T15:08:35.000Z"
}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "password123",
    "gender": "male",
    "dob": "1995-01-01"
  }'
```

### 3. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@example.com",
    "password": "password123"
  }'
```

### 4. Test Protected Route

```bash
# Get token from login response, then:
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📱 Connecting React Native App

### Update Frontend Config

In `/workspace/HourlyGFApp/src/constants/config.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',  // Development
  // BASE_URL: 'https://your-production-url.com/api',  // Production
  SOCKET_URL: 'http://localhost:5000',
};
```

**For Android Emulator:**
```javascript
BASE_URL: 'http://10.0.2.2:5000/api'
```

**For iOS Simulator:**
```javascript
BASE_URL: 'http://localhost:5000/api'
```

**For Physical Device:**
```javascript
BASE_URL: 'http://YOUR_COMPUTER_IP:5000/api'  // e.g., http://192.168.1.100:5000/api
```

---

## 🔧 Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Solution:**
```bash
# Check MongoDB status
sudo service mongodb status

# Restart MongoDB
sudo service mongodb restart

# Check MongoDB logs
tail -f /var/log/mongodb/mongodb.log
```

### Issue: Port 5000 Already in Use

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 PID

# Or change port in .env
PORT=5001
```

### Issue: JWT Token Errors

**Solution:**
- Ensure JWT_SECRET is set in `.env`
- Check token expiration time
- Verify token format in Authorization header: `Bearer <token>`

### Issue: File Upload Fails

**Solution:**
```bash
# Create upload directories
mkdir -p uploads/profiles uploads/reviews uploads/verification uploads/chat

# Set permissions
chmod 755 uploads -R
```

---

## 🎯 Production Deployment

### 1. Prepare for Production

```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server.js --name hourlygf-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 2. Environment Configuration

Update `.env` for production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hourlygf
CLIENT_URL=https://your-app-url.com
```

### 3. Setup Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 📊 Monitoring & Logs

### View Logs
```bash
# PM2 logs
pm2 logs hourlygf-api

# Application logs
tail -f logs/combined.log
tail -f logs/error.log
```

### Monitor Performance
```bash
pm2 monit
```

---

## 🔐 Security Checklist

- [ ] Change default JWT secrets
- [ ] Use strong passwords for MongoDB
- [ ] Enable MongoDB authentication
- [ ] Setup SSL/TLS for production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables for all secrets
- [ ] Setup firewall rules
- [ ] Regular security updates
- [ ] Backup database regularly

---

## 📞 Support

For issues or questions:
- Check logs: `logs/error.log`
- Review error messages
- Check MongoDB connection
- Verify environment variables
- Test API endpoints individually

---

**Next Steps:**
1. ✅ Backend setup complete
2. 🔄 Start backend server
3. 📱 Update React Native app API configuration
4. 🧪 Test all API endpoints
5. 🚀 Deploy to production

Good luck! 🎉
