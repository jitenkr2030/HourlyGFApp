import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const SearchFilterScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleApplyFilters = () => {
    // Apply filters logic here
    navigation.navigate('Home', { searchTerm });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search"
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.input}
      />
      <Button title="Apply Filters" onPress={handleApplyFilters} />
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

export default SearchFilterScreen;
