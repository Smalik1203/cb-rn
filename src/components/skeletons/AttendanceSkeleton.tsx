import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CardSkeleton } from './CardSkeleton';
import { colors, spacing } from '@/lib/design-system';

export function AttendanceSkeleton() {
  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterCard}>
        <CardSkeleton height={24} width="40%" style={{ marginBottom: spacing['3'] }} />
        <View style={styles.filterRow}>
          <CardSkeleton height={40} width="30%" />
          <CardSkeleton height={40} width="30%" />
          <CardSkeleton height={40} width="30%" />
        </View>
        <CardSkeleton height={24} width="30%" style={{ marginTop: spacing['4'], marginBottom: spacing['3'] }} />
        <CardSkeleton height={40} width="100%" />
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <CardSkeleton height={24} width="50%" style={{ marginBottom: spacing['4'] }} />
        <CardSkeleton height={8} width="100%" style={{ marginBottom: spacing['4'] }} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <CardSkeleton height={40} width={40} style={{ marginBottom: spacing['2'], borderRadius: 20 }} />
            <CardSkeleton height={24} width={40} style={{ marginBottom: spacing['1'] }} />
            <CardSkeleton height={16} width={60} />
          </View>
          <View style={styles.statItem}>
            <CardSkeleton height={40} width={40} style={{ marginBottom: spacing['2'], borderRadius: 20 }} />
            <CardSkeleton height={24} width={40} style={{ marginBottom: spacing['1'] }} />
            <CardSkeleton height={16} width={60} />
          </View>
          <View style={styles.statItem}>
            <CardSkeleton height={40} width={40} style={{ marginBottom: spacing['2'], borderRadius: 20 }} />
            <CardSkeleton height={24} width={40} style={{ marginBottom: spacing['1'] }} />
            <CardSkeleton height={16} width={60} />
          </View>
        </View>
        <View style={styles.bulkActions}>
          <CardSkeleton height={36} width="30%" />
          <CardSkeleton height={36} width="30%" />
          <CardSkeleton height={36} width="30%" />
        </View>
      </View>

      {/* Student List */}
      <View style={styles.studentsList}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View key={index} style={styles.studentCard}>
            <CardSkeleton height={20} width="60%" style={{ marginBottom: spacing['2'] }} />
            <CardSkeleton height={28} width={100} />
          </View>
        ))}
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
  filterCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing['4'],
    borderRadius: 12,
    marginBottom: spacing['4'],
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing['6'],
    borderRadius: 12,
    marginBottom: spacing['4'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing['6'],
  },
  statItem: {
    alignItems: 'center',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentsList: {
    gap: spacing['3'],
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing['4'],
    borderRadius: 12,
  },
});

