import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';

const PaymentScreen = () => {
  const [paymentMethod, setPaymentMethod] = useState('');

  const handlePayment = () => {
    // Handle payment logic here
  };

  return (
    <View style={styles.container}>
      <Text>Select Payment Method:</Text>
      <TextInput
        placeholder="Credit Card / Mobile Wallet"
        value={paymentMethod}
        onChangeText={setPaymentMethod}
        style={styles.input}
      />
      <Button title="Pay Now" onPress={handlePayment} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default PaymentScreen;
