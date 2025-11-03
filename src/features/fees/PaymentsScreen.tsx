import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../lib/design-system';
import PaymentHistory from '../../components/fees/PaymentHistory';

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      <PaymentHistory />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
});


