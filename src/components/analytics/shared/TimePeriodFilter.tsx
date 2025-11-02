import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { spacing } from '../../../../lib/design-system';
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

  return (
    <View style={styles.filterChips}>
      <Chip
        selected={timePeriod === 'daily'}
        onPress={() => handlePeriodChange('daily')}
        style={styles.filterChip}
      >
        Daily
      </Chip>
      <Chip
        selected={timePeriod === 'weekly'}
        onPress={() => handlePeriodChange('weekly')}
        style={styles.filterChip}
      >
        Weekly
      </Chip>
      <Chip
        selected={timePeriod === 'monthly'}
        onPress={() => handlePeriodChange('monthly')}
        style={styles.filterChip}
      >
        Monthly
      </Chip>
    </View>
  );
};

const styles = StyleSheet.create({
  filterChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 0,
    marginBottom: spacing.xs,
    minHeight: 36,
  },
});

