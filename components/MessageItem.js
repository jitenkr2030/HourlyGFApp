import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MessageItem = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sender}>{message.sender}</Text>
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  sender: {
    fontWeight: 'bold',
  },
  text: {
    marginTop: 5,
  },
});

export default MessageItem;
