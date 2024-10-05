import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const AccountScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Your Profile</Text>
      {/* Display user details */}
      <Button title="Edit Profile" onPress={() => {/* Navigate to Edit Profile */}} />
      <Button title="View Bookings" onPress={() => {/* Navigate to Bookings */}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});

export default AccountScreen;
