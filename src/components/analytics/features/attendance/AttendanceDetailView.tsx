import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { colors, typography, spacing, borderRadius } from '../../../../../lib/design-system';
import { SuperAdminAnalytics, TimePeriod } from '../../types';
import { TimePeriodFilter } from '../../shared/TimePeriodFilter';
import { MetricCard } from '../../shared/MetricCard';

interface AttendanceDetailViewProps {
  data: SuperAdminAnalytics;
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
}

export const AttendanceDetailView: React.FC<AttendanceDetailViewProps> = ({
  data,
  timePeriod,
  setTimePeriod,
}) => {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return colors.success[600];
    if (rate >= 80) return colors.warning[600];
    return colors.error[600];
  };

  const attendanceRate = data?.attendance?.avgRate || 0;

  return (
    <>
      <TimePeriodFilter timePeriod={timePeriod} setTimePeriod={setTimePeriod} />

      <MetricCard
        label="Overall Attendance Rate"
        value={`${Math.round(attendanceRate)}%`}
        subtext={
          timePeriod === 'daily'
            ? 'Last 7 days average'
            : timePeriod === 'weekly'
            ? 'Last 30 days average'
            : 'Last 90 days average'
        }
        valueColor={getAttendanceColor(attendanceRate)}
      />

      {data?.attendance?.classesByConsistency && data.attendance.classesByConsistency.length > 0 && (
        <Surface style={styles.chartCard} elevation={1}>
          <Text variant="titleMedium" style={styles.chartTitle}>Class-wise Comparison</Text>
          <Text variant="bodySmall" style={styles.chartSubtitle}>Top performing classes</Text>

          {data.attendance.classesByConsistency.slice(0, 5).map((classItem) => (
            <View key={classItem.classId} style={styles.comparisonItem}>
              <Text variant="bodyMedium" style={styles.comparisonLabel}>{classItem.className}</Text>
              <View style={styles.comparisonBarContainer}>
                <View
                  style={[
                    styles.comparisonBar,
                    {
                      width: `${classItem.avgRate}%`,
                      backgroundColor: getAttendanceColor(classItem.avgRate),
                    },
                  ]}
                />
                <Text variant="labelMedium" style={[styles.comparisonValue, { color: getAttendanceColor(classItem.avgRate) }]}>
                  {Math.round(classItem.avgRate)}%
                </Text>
              </View>
            </View>
          ))}
        </Surface>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  chartSubtitle: {
    color: colors.text.secondary,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.xs,
  },
  comparisonItem: {
    marginBottom: spacing.md,
  },
  comparisonLabel: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  comparisonBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonBar: {
    height: 24,
    borderRadius: borderRadius.sm,
    minWidth: 2,
  },
  comparisonValue: {
    fontWeight: typography.fontWeight.bold,
    minWidth: 45,
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.sm,
  },
});

