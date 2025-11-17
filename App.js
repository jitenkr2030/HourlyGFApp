import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Icon from 'react-native-vector-icons/Ionicons';
import { store, persistor } from './src/store/store';

// Auth Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import VerificationScreen from './src/screens/auth/VerificationScreen';

// Main Screens
import SwipeScreen from './src/screens/main/SwipeScreen';
import MatchesScreen from './src/screens/main/MatchesScreen';
import MessagesScreen from './src/screens/main/MessagesScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import ExploreScreen from './src/screens/main/ExploreScreen';

// Feature Screens
import CompanionProfileScreen from './src/screens/companion/CompanionProfileScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import BookingScreen from './src/screens/booking/BookingScreen';
import BookingConfirmationScreen from './src/screens/booking/BookingConfirmationScreen';
import CalendarScreen from './src/screens/booking/CalendarScreen';
import PaymentScreen from './src/screens/payment/PaymentScreen';
import PaymentMethodsScreen from './src/screens/payment/PaymentMethodsScreen';
import TransactionHistoryScreen from './src/screens/payment/TransactionHistoryScreen';

// Settings & Profile Screens
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import PreferencesScreen from './src/screens/settings/PreferencesScreen';
import PrivacySettingsScreen from './src/screens/settings/PrivacySettingsScreen';
import NotificationSettingsScreen from './src/screens/settings/NotificationSettingsScreen';
import BlockedUsersScreen from './src/screens/settings/BlockedUsersScreen';

// Additional Screens
import SearchFilterScreen from './src/screens/search/SearchFilterScreen';
import AdvancedSearchScreen from './src/screens/search/AdvancedSearchScreen';
import LocationScreen from './src/screens/location/LocationScreen';
import ReviewsScreen from './src/screens/reviews/ReviewsScreen';
import WriteReviewScreen from './src/screens/reviews/WriteReviewScreen';
import VideoCallScreen from './src/screens/video/VideoCallScreen';
import EmergencyScreen from './src/screens/emergency/EmergencyScreen';
import HelpSupportScreen from './src/screens/support/HelpSupportScreen';
import CommunityGuidelinesScreen from './src/screens/legal/CommunityGuidelinesScreen';
import TermsScreen from './src/screens/legal/TermsScreen';
import PrivacyPolicyScreen from './src/screens/legal/PrivacyPolicyScreen';
import VerifyAccountScreen from './src/screens/verification/VerifyAccountScreen';
import EventPlanningScreen from './src/screens/events/EventPlanningScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

LogBox.ignoreAllLogs(); // Ignore all log notifications

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Swipe') {
            iconName = focused ? 'flame' : 'flame-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Swipe" component={SwipeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function App() {
  useEffect(() => {
    // Initialize app services
    // Setup push notifications
    // Configure analytics
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            {/* Auth Flow */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />

            {/* Main App */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Companion Screens */}
            <Stack.Screen 
              name="CompanionProfile" 
              component={CompanionProfileScreen}
              options={{ headerShown: true, title: 'Profile' }}
            />

            {/* Chat Screens */}
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ headerShown: true }}
            />
            <Stack.Screen 
              name="VideoCall" 
              component={VideoCallScreen}
              options={{ presentation: 'fullScreenModal' }}
            />

            {/* Booking Screens */}
            <Stack.Screen 
              name="Booking" 
              component={BookingScreen}
              options={{ headerShown: true, title: 'Book Companion' }}
            />
            <Stack.Screen 
              name="Calendar" 
              component={CalendarScreen}
              options={{ headerShown: true, title: 'Select Date & Time' }}
            />
            <Stack.Screen 
              name="BookingConfirmation" 
              component={BookingConfirmationScreen}
              options={{ headerShown: false }}
            />

            {/* Payment Screens */}
            <Stack.Screen 
              name="Payment" 
              component={PaymentScreen}
              options={{ headerShown: true, title: 'Payment' }}
            />
            <Stack.Screen 
              name="PaymentMethods" 
              component={PaymentMethodsScreen}
              options={{ headerShown: true, title: 'Payment Methods' }}
            />
            <Stack.Screen 
              name="TransactionHistory" 
              component={TransactionHistoryScreen}
              options={{ headerShown: true, title: 'Transactions' }}
            />

            {/* Profile & Settings */}
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ headerShown: true, title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ headerShown: true, title: 'Settings' }}
            />
            <Stack.Screen 
              name="Preferences" 
              component={PreferencesScreen}
              options={{ headerShown: true, title: 'Preferences' }}
            />
            <Stack.Screen 
              name="PrivacySettings" 
              component={PrivacySettingsScreen}
              options={{ headerShown: true, title: 'Privacy' }}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{ headerShown: true, title: 'Notifications' }}
            />
            <Stack.Screen 
              name="BlockedUsers" 
              component={BlockedUsersScreen}
              options={{ headerShown: true, title: 'Blocked Users' }}
            />

            {/* Search & Filter */}
            <Stack.Screen 
              name="SearchFilter" 
              component={SearchFilterScreen}
              options={{ headerShown: true, title: 'Filters' }}
            />
            <Stack.Screen 
              name="AdvancedSearch" 
              component={AdvancedSearchScreen}
              options={{ headerShown: true, title: 'Advanced Search' }}
            />

            {/* Location */}
            <Stack.Screen 
              name="Location" 
              component={LocationScreen}
              options={{ headerShown: true, title: 'Location' }}
            />

            {/* Reviews */}
            <Stack.Screen 
              name="Reviews" 
              component={ReviewsScreen}
              options={{ headerShown: true, title: 'Reviews' }}
            />
            <Stack.Screen 
              name="WriteReview" 
              component={WriteReviewScreen}
              options={{ headerShown: true, title: 'Write Review' }}
            />

            {/* Verification */}
            <Stack.Screen 
              name="VerifyAccount" 
              component={VerifyAccountScreen}
              options={{ headerShown: true, title: 'Verify Account' }}
            />

            {/* Events */}
            <Stack.Screen 
              name="EventPlanning" 
              component={EventPlanningScreen}
              options={{ headerShown: true, title: 'Plan Event' }}
            />

            {/* Emergency & Support */}
            <Stack.Screen 
              name="Emergency" 
              component={EmergencyScreen}
              options={{ presentation: 'modal', headerShown: true, title: 'Emergency' }}
            />
            <Stack.Screen 
              name="HelpSupport" 
              component={HelpSupportScreen}
              options={{ headerShown: true, title: 'Help & Support' }}
            />

            {/* Legal */}
            <Stack.Screen 
              name="CommunityGuidelines" 
              component={CommunityGuidelinesScreen}
              options={{ headerShown: true, title: 'Community Guidelines' }}
            />
            <Stack.Screen 
              name="Terms" 
              component={TermsScreen}
              options={{ headerShown: true, title: 'Terms of Service' }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{ headerShown: true, title: 'Privacy Policy' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}

export default App;
