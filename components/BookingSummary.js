import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BookingSummary = ({ bookingDetails }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Summary</Text>
      <Text>{`Service: ${bookingDetails.service}`}</Text>
      <Text>{`Date: ${bookingDetails.date}`}</Text>
      <Text>{`Time: ${bookingDetails.time}`}</Text>
      <Text>{`Total Cost: $${bookingDetails.cost}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default BookingSummary;
