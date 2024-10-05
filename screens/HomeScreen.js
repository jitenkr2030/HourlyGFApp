import React from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';

const profiles = [
  { id: '1', name: 'John Doe', age: 25, location: 'New York', interests: 'Reading' },
  // Add more profiles
];

export default function HomeScreen({ navigation }) {
  return (
    <View>
      <TextInput placeholder="Search Profiles" />
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { profile: item })}>
            <Text>{item.name} - {item.age} - {item.location}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
