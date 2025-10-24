import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Clock } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/design-system';
import { useProfile } from '@/src/hooks/useProfile';
import { useTimetable } from '@/src/hooks/useTimetable';
import { Card, LoadingView, ErrorView, EmptyState } from '@/src/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableScreen() {
  const { data: profile } = useProfile();
  const { data: slots, isLoading, error } = useTimetable(profile?.class_instance_id);

  if (isLoading) {
    return <LoadingView message="Loading timetable..." />;
  }

  if (error) {
    return <ErrorView message={error.message} />;
  }

  if (!slots || slots.length === 0) {
    return <EmptyState title="No Timetable" message="No classes scheduled yet" />;
  }

  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, typeof slots>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Clock size={24} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Timetable</Text>
          <Text style={styles.headerSubtitle}>Weekly Schedule</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {DAYS.map((day, index) => (
          <Card key={index} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>
            {slotsByDay[index + 1]?.length > 0 ? (
              slotsByDay[index + 1].map((slot, i) => (
                <View key={i} style={styles.slot}>
                  <Text style={styles.timeText}>
                    {slot.start_time} - {slot.end_time}
                  </Text>
                  <Text style={styles.subjectText}>Subject {slot.subject_id}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noClassText}>No classes</Text>
            )}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  header: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  dayCard: {
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  slot: {
    paddingVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  subjectText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  noClassText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});
