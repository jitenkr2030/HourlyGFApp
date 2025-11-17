// This script creates stub files for all remaining screens

const fs = require('fs');
const path = require('path');

const screenTemplate = (screenName) => `import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

const ${screenName} = ({ navigation, route }) => {
  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${screenName.replace(/([A-Z])/g, ' $1').trim()}</Text>
      <Text style={styles.subtitle}>This screen is under development</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default ${screenName};
`;

const screens = {
  'auth': ['SignupScreen', 'ForgotPasswordScreen', 'VerificationScreen'],
  'main': ['ExploreScreen', 'MatchesScreen', 'MessagesScreen', 'ProfileScreen'],
  'companion': ['CompanionProfileScreen'],
  'chat': ['ChatScreen'],
  'booking': ['BookingScreen', 'BookingConfirmationScreen', 'CalendarScreen'],
  'payment': ['PaymentScreen', 'PaymentMethodsScreen', 'TransactionHistoryScreen'],
  'profile': ['EditProfileScreen'],
  'settings': ['SettingsScreen', 'PreferencesScreen', 'PrivacySettingsScreen', 'NotificationSettingsScreen', 'BlockedUsersScreen'],
  'search': ['SearchFilterScreen', 'AdvancedSearchScreen'],
  'location': ['LocationScreen'],
  'reviews': ['ReviewsScreen', 'WriteReviewScreen'],
  'video': ['VideoCallScreen'],
  'emergency': ['EmergencyScreen'],
  'support': ['HelpSupportScreen'],
  'legal': ['CommunityGuidelinesScreen', 'TermsScreen', 'PrivacyPolicyScreen'],
  'verification': ['VerifyAccountScreen'],
  'events': ['EventPlanningScreen'],
};

Object.keys(screens).forEach(folder => {
  screens[folder].forEach(screen => {
    const filePath = path.join(__dirname, folder, `${screen}.js`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, screenTemplate(screen));
      console.log(`Created: ${folder}/${screen}.js`);
    }
  });
});

console.log('All stub files created successfully!');
