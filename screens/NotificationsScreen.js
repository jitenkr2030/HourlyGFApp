import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const NotificationsScreen = () => {
  const notifications = [/* Array of notifications */];

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <Text>{item.message}</Text>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});

export default NotificationsScreen;
