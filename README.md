# HourlyGF

HourlyGF is a mobile application designed to connect users with temporary companionship services on an hourly basis. It offers a seamless booking system, secure payments, and a user-friendly experience.

## 🚀 Features
- **Instant Booking** – Find and book a service provider within minutes.
- **Profile Verification** – Ensuring authenticity and safety.
- **Flexible Scheduling** – Choose your preferred date, time, and duration.
- **Ratings & Reviews** – Transparent feedback from other users.
- **Secure Payments** – Multiple payment options with end-to-end encryption.

## 📱 Tech Stack
- **Frontend:** React Native (Expo)
- **Backend:** Nhost.io (GraphQL, PostgreSQL, Authentication)
- **State Management:** Redux Toolkit
- **UI Library:** TailwindCSS, ShadCN
- **Notifications:** Firebase Cloud Messaging
- **Deployment:** Vercel & Expo Go

## 📂 Directory Structure
```
HourlyGF/
│── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App Screens
│   ├── navigation/     # Navigation setup
│   ├── store/          # Redux state management
│   ├── assets/         # Images and Icons
│   ├── services/       # API Calls
│── package.json        # Dependencies & Scripts
│── app.json            # Expo configuration
│── README.md           # Project Documentation
```

## ⚡ Installation & Setup

### 1️⃣ Clone the repository:
```sh
git clone https://github.com/yourusername/HourlyGF.git
cd HourlyGF
```

### 2️⃣ Install dependencies:
```sh
pnpm install  # or npm install / yarn install
```

### 3️⃣ Start the development server:
```sh
pnpm start   # Runs on Expo Go
```

### 4️⃣ Run on Android/iOS:
```sh
expo start --android  # For Android
expo start --ios      # For iOS (Mac required)
```

## 🌍 Environment Variables
Create a `.env` file in the root directory and add:
```sh
EXPO_PUBLIC_API_URL=<Your_API_URL>
EXPO_PUBLIC_FIREBASE_API_KEY=<Your_Firebase_Key>
```

## 🤝 Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Added new feature'`
4. Push to your branch: `git push origin feature-name`
5. Submit a pull request.

## 🛠 Upcoming Features
- AI-driven matching algorithm.
- Advanced filtering and search options.
- Dark mode support.

## 📜 License
This project is licensed under the MIT License.

## 💡 Support & Contact
For issues, open an [issue](https://github.com/yourusername/HourlyGF/issues) on GitHub.

📧 Email: support@hourlygf.com  
🌐 Website: [HourlyGF.com](https://hourlygf.com)

