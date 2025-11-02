import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { colors, typography, spacing, borderRadius } from '../../../../lib/design-system';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  valueColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  valueColor = colors.text.primary,
}) => {
  return (
    <Surface style={styles.metricCard} elevation={2}>
      <Text variant="labelLarge" style={styles.metricCardLabel}>{label}</Text>
      <Text variant="headlineMedium" style={[styles.metricCardValue, { color: valueColor }]}>
        {value}
      </Text>
      {subtext && (
        <Text variant="bodySmall" style={styles.metricCardSubtext}>{subtext}</Text>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    backgroundColor: colors.background.app,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  metricCardLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  metricCardValue: {
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize['3xl'],
  },
  metricCardSubtext: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
});

