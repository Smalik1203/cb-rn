import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { colors, typography, spacing, borderRadius } from '../../../../../lib/design-system';
import { SuperAdminAnalytics, TimePeriod } from '../../types';
import { TimePeriodFilter } from '../../shared/TimePeriodFilter';
import { MetricCard } from '../../shared/MetricCard';

interface LearningDetailViewProps {
  data: SuperAdminAnalytics;
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
}

export const LearningDetailView: React.FC<LearningDetailViewProps> = ({
  data,
  timePeriod,
  setTimePeriod,
}) => {
  const participationRate = Math.round(data?.academics?.participationRate || 0);

  // Create comparison items for subject performance
  const subjectItems =
    data?.academics?.avgScoreBySubject?.map((subject) => {
      const scoreColor =
        subject.avgScore >= 75
          ? colors.success[600]
          : subject.avgScore >= 60
          ? colors.warning[600]
          : colors.error[600];

      return {
        label: subject.subjectName,
        value: subject.avgScore,
        color: scoreColor,
        percentage: subject.avgScore,
        subtitle: `${Math.round(subject.participationRate)}% participation`,
      };
    }) || [];

  return (
    <>
      <TimePeriodFilter timePeriod={timePeriod} setTimePeriod={setTimePeriod} />

      <MetricCard
        label="Test Participation"
        value={`${participationRate}%`}
        subtext="students taking tests"
        valueColor={colors.info[600]}
      />

      {subjectItems.length > 0 && (
        <Surface style={styles.chartCard} elevation={1}>
          <Text variant="titleMedium" style={styles.chartTitle}>Subject Performance</Text>
          <Text variant="bodySmall" style={styles.chartSubtitle}>Average scores by subject</Text>

          {data.academics.avgScoreBySubject.map((subject) => {
            const scoreColor =
              subject.avgScore >= 75
                ? colors.success[600]
                : subject.avgScore >= 60
                ? colors.warning[600]
                : colors.error[600];

            return (
              <View key={subject.subjectId} style={styles.comparisonItem}>
                <Text variant="bodyMedium" style={styles.comparisonLabel}>{subject.subjectName}</Text>
                <View style={styles.comparisonBarContainer}>
                  <View
                    style={[
                      styles.comparisonBar,
                      {
                        width: `${subject.avgScore}%`,
                        backgroundColor: scoreColor,
                      },
                    ]}
                  />
                  <Text variant="labelMedium" style={[styles.comparisonValue, { color: scoreColor }]}>
                    {Math.round(subject.avgScore)}%
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.comparisonSubtext, { marginTop: spacing.xs }]}>
                  {Math.round(subject.participationRate)}% participation
                </Text>
              </View>
            );
          })}
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
  comparisonSubtext: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
});

