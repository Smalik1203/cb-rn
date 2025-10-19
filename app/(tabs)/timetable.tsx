import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TimetableScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Timetable</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Coming soon - Feature to be implemented
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
});
