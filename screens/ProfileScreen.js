import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ProfileScreen = ({ route, navigation }) => {
  const { profile } = route.params;

  return (
    <View style={styles.container}>
      <Text>{profile.name}</Text>
      <Text>{profile.age} - {profile.location}</Text>
      <Text>{profile.bio}</Text>
      <Button title="Book Now" onPress={() => navigation.navigate('Booking', { profile })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});

export default ProfileScreen;
