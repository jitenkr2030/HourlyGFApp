import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Rating = ({ rating, onRate }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }, (_, index) => (
        <TouchableOpacity key={index} onPress={() => onRate(index + 1)}>
          <Text style={rating > index ? styles.filledStar : styles.emptyStar}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  filledStar: {
    color: '#FFD700',
    fontSize: 30,
  },
  emptyStar: {
    color: '#ccc',
    fontSize: 30,
  },
});

export default Rating;
