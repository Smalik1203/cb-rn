import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CardSkeleton, ListCardSkeleton } from './CardSkeleton';
import { colors, spacing } from '@/lib/design-system';

export function FeesSkeleton() {
  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <CardSkeleton height={40} width="48%" />
        <CardSkeleton height={40} width="48%" />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <CardSkeleton height={24} width="40%" style={{ marginBottom: spacing['4'] }} />
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <CardSkeleton height={32} width={80} style={{ marginBottom: spacing['2'] }} />
            <CardSkeleton height={16} width={60} />
          </View>
          <View style={styles.statItem}>
            <CardSkeleton height={32} width={80} style={{ marginBottom: spacing['2'] }} />
            <CardSkeleton height={16} width={60} />
          </View>
          <View style={styles.statItem}>
            <CardSkeleton height={32} width={80} style={{ marginBottom: spacing['2'] }} />
            <CardSkeleton height={16} width={60} />
          </View>
        </View>
      </View>

      {/* Fee Components */}
      <View style={styles.section}>
        <CardSkeleton height={24} width="50%" style={{ marginBottom: spacing['4'] }} />
        <ListCardSkeleton />
        <ListCardSkeleton />
        <ListCardSkeleton />
        <ListCardSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing['4'],
    backgroundColor: colors.background.primary,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['6'],
    gap: spacing['3'],
  },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing['6'],
    borderRadius: 12,
    marginBottom: spacing['6'],
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing['6'],
  },
});

