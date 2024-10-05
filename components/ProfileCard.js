import React from 'react';
import { View, Text, Image, Button, StyleSheet } from 'react-native';

const ProfileCard = ({ profile, onViewProfile }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: profile.picture }} style={styles.image} />
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.info}>{`${profile.age} | ${profile.location}`}</Text>
      <Text style={styles.interests}>{profile.interests.join(', ')}</Text>
      <Button title="View Profile" onPress={onViewProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
    elevation: 1,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    color: 'gray',
  },
  interests: {
    marginVertical: 5,
  },
});

export default ProfileCard;
