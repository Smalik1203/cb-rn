import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StudentFeesView } from '../../components/fees/StudentFeesView';
import { colors } from '../../../lib/design-system';

export default function StudentFeesScreen() {
  return (
    <View style={styles.container}>
      <StudentFeesView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
});



