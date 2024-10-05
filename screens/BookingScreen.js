import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, DatePickerIOS, TimePickerAndroid } from 'react-native';

const BookingScreen = ({ route }) => {
  const { profile } = route.params;
  const [date, setDate] = useState(new Date());

  const handleBooking = () => {
    // Handle booking logic here
  };

  return (
    <View style={styles.container}>
      <Text>Book {profile.name}</Text>
      <DatePickerIOS date={date} onDateChange={setDate} />
      <Button title="Confirm Booking" onPress={handleBooking} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});

export default BookingScreen;
