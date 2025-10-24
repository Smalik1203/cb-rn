import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CardSkeleton, StatCardSkeleton, ListCardSkeleton } from './CardSkeleton';
import { colors, spacing, borderRadius } from '@/lib/design-system';

export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CardSkeleton height={32} width="60%" style={{ marginBottom: spacing['2'] }} />
        <CardSkeleton height={20} width="40%" />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <CardSkeleton height={24} width="40%" style={{ marginBottom: spacing['4'] }} />
        <View style={styles.actionsGrid}>
          <CardSkeleton height={80} width="48%" />
          <CardSkeleton height={80} width="48%" />
          <CardSkeleton height={80} width="48%" />
          <CardSkeleton height={80} width="48%" />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <CardSkeleton height={24} width="50%" style={{ marginBottom: spacing['4'] }} />
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
  header: {
    marginBottom: spacing['6'],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['6'],
  },
  section: {
    marginBottom: spacing['6'],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing['3'],
  },
});

