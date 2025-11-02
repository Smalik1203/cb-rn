import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, typography, spacing, borderRadius } from '../../../../lib/design-system';

interface ComparisonItem {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface ComparisonChartProps {
  title: string;
  subtitle?: string;
  items: ComparisonItem[];
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  title,
  subtitle,
  items,
}) => {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.chartTitle}>{title}</Text>
      {subtitle && (
        <Text variant="bodySmall" style={styles.chartSubtitle}>{subtitle}</Text>
      )}

      {items.map((item, index) => (
        <View key={index} style={styles.comparisonItem}>
          <Text variant="bodyMedium" style={styles.comparisonLabel}>{item.label}</Text>
          <View style={styles.comparisonBarContainer}>
            <View
              style={[
                styles.comparisonBar,
                {
                  width: `${item.percentage || item.value}%`,
                  backgroundColor: item.color,
                },
              ]}
            />
            <Text variant="labelMedium" style={[styles.comparisonValue, { color: item.color }]}>
              {typeof item.value === 'number' && item.value > 1000
                ? `₹${(item.value / 100).toLocaleString('en-IN')}`
                : `${Math.round(item.value)}%`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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

