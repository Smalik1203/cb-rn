import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../../lib/design-system';
import { useHolidayCheck } from '../../hooks/useCalendarEvents';

interface HolidayCheckerProps {
  schoolCode: string;
  date: string;
  classInstanceId?: string;
  onHolidayClick?: () => void;
  showAsAlert?: boolean;
}

export default function HolidayChecker({
  schoolCode,
  date,
  classInstanceId,
  onHolidayClick,
  showAsAlert = true,
}: HolidayCheckerProps) {
  const { data: holidayInfo, isLoading } = useHolidayCheck(schoolCode, date, classInstanceId);

  if (isLoading || !holidayInfo) {
    return null;
  }

  if (showAsAlert) {
    return (
      <View style={styles.alertContainer}>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <AlertCircle size={20} color={colors.warning[600]} />
            <Text variant="titleMedium" style={styles.alertTitle}>
              {holidayInfo.title || 'Holiday'}
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={styles.alertDescription}>
            {holidayInfo.description || 'This is a holiday. Timetable entries cannot be created or modified.'}
          </Text>

          {onHolidayClick && (
            <Button
              mode="text"
              onPress={onHolidayClick}
              style={styles.alertButton}
              labelStyle={styles.alertButtonLabel}
            >
              View Calendar
            </Button>
          )}
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={onHolidayClick}
      disabled={!onHolidayClick}
    >
      <CalendarIcon size={16} color={colors.warning[600]} />
      <Text variant="bodySmall" style={styles.compactText}>
        {holidayInfo.title || 'Holiday'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  alertContainer: {
    backgroundColor: '#fff7e6',
    borderWidth: 1,
    borderColor: '#ffd591',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertContent: {
    gap: spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertTitle: {
    color: '#d46b08',
    fontWeight: typography.fontWeight.bold,
  },
  alertDescription: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  alertButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  alertButtonLabel: {
    color: '#d46b08',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#fff7e6',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#ffd591',
  },
  compactText: {
    color: '#d46b08',
    fontWeight: typography.fontWeight.medium,
  },
});

