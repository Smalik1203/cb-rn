import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { Calendar, Clock, ChevronLeft, ChevronRight, BookOpen, User } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentTimetable } from '../../hooks/useStudentTimetable';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import dayjs from 'dayjs';

export function StudentTimetableScreen() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
  const { slots, displayPeriodNumber, loading, error, refetch } = useStudentTimetable(
    profile?.class_instance_id,
    dateStr
  );

  // Navigation functions
  const goToPreviousDay = () => {
    setSelectedDate(prev => dayjs(prev).subtract(1, 'day').toDate());
  };

  const goToNextDay = () => {
    setSelectedDate(prev => dayjs(prev).add(1, 'day').toDate());
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Group slots by time for display
  const groupedSlots = useMemo(() => {
    if (!slots) return [];
    
    return slots.map((slot, index) => {
      const isPeriod = slot.slot_type === 'period';
      const periodNumber = isPeriod ? 
        slots.slice(0, index + 1).filter(s => s.slot_type === 'period').length : 
        null;

      return {
        ...slot,
        displayPeriodNumber: periodNumber,
      };
    });
  }, [slots]);

  // Handle loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Schedule</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading timetable...</Text>
        </View>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Schedule</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load timetable</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Button mode="contained" onPress={refetch} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  // Handle empty state
  if (!profile?.class_instance_id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Schedule</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No class assigned</Text>
          <Text style={styles.emptyMessage}>
            Please contact your administrator to assign you to a class.
          </Text>
        </View>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Schedule</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No classes scheduled</Text>
          <Text style={styles.emptyMessage}>
            No classes are scheduled for {dayjs(selectedDate).format('MMMM D, YYYY')}.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Primary Header */}
      <View style={styles.primaryHeader}>
        <Text style={styles.primaryTitle}>My Schedule</Text>
        <Text style={styles.contextSubtitle}>
          {dayjs(selectedDate).format('MMMM D, YYYY')}
        </Text>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          onPress={goToPreviousDay} 
          style={styles.dateNavButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>
            {dayjs(selectedDate).format('MMM D')}
          </Text>
          <TouchableOpacity 
            onPress={goToToday} 
            style={styles.todayChip}
            activeOpacity={0.7}
          >
            <Text style={styles.todayChipText}>Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          onPress={goToNextDay} 
          style={styles.dateNavButton}
          activeOpacity={0.7}
        >
          <ChevronRight size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Timetable */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.slotsContainer}>
          {groupedSlots.map((slot, index) => (
            <Card 
              key={slot.id} 
              style={[
                styles.slotCard,
                slot.slot_type === 'period' ? styles.periodCard : styles.breakCard
              ]}
              elevation={2}
            >
              <Card.Content style={styles.slotContent}>
                <View style={styles.slotHeader}>
                  <View style={styles.slotTimeContainer}>
                    <Clock size={16} color={colors.text.secondary} />
                    <Text style={styles.slotTime}>
                      {slot.start_time} - {slot.end_time}
                    </Text>
                    {slot.slot_type === 'period' && (
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodBadgeText}>
                          Period {slot.displayPeriodNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {slot.slot_type === 'period' ? (
                  <View style={styles.periodContent}>
                    <Text style={styles.subjectTitle}>
                      {slot.subject?.subject_name || 'Unknown Subject'}
                    </Text>
                    
                    <View style={styles.detailRow}>
                      <User size={14} color={colors.text.tertiary} />
                      <Text style={styles.teacherName}>
                        {slot.teacher?.full_name || 'Unknown Teacher'}
                      </Text>
                    </View>

                    {slot.plan_text && (
                      <View style={styles.detailRow}>
                        <BookOpen size={14} color={colors.text.tertiary} />
                        <Text style={styles.planText}>{slot.plan_text}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.breakContent}>
                    <Text style={styles.breakTitle}>{slot.name || 'Break'}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.text.inverse,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
  },
  todayButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main,
  },
  todayButtonText: {
    ...typography.button,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slotsContainer: {
    padding: spacing.lg,
  },
  slotCard: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  slotContent: {
    padding: spacing.lg,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTime: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  periodChip: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.main,
  },
  periodChipText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
  },
  periodContent: {
    gap: spacing.sm,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  planContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.sm,
  },
  planLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  planText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  breakContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakText: {
    ...typography.h3,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error.main,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // New improved styles
  primaryHeader: {
    backgroundColor: colors.surface.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  primaryTitle: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  contextSubtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dateNavButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    ...shadows.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  todayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  todayChipText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  periodCard: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  breakCard: {
    backgroundColor: colors.neutral[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral[300],
  },
  periodBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  periodBadgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  subjectTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  teacherName: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  breakTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
