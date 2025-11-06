import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { spacing, colors, typography, borderRadius } from '../../../../lib/design-system';
import { TimePeriod } from '../types';
import * as Haptics from 'expo-haptics';

interface TimePeriodFilterProps {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
}

export const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({
  timePeriod,
  setTimePeriod,
}) => {
  const handlePeriodChange = (period: TimePeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimePeriod(period);
  };

  const FilterButton: React.FC<{ period: TimePeriod; label: string }> = ({ period, label }) => {
    const isSelected = timePeriod === period;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handlePeriodChange(period)}
        style={[
          styles.filterButton,
          isSelected && styles.filterButtonSelected,
        ]}
      >
        <Text style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextSelected,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.filterChips}>
      <FilterButton period="daily" label="Daily" />
      <FilterButton period="weekly" label="Weekly" />
      <FilterButton period="monthly" label="Monthly" />
    </View>
  );
};

const styles = StyleSheet.create({
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  filterButtonTextSelected: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
});

