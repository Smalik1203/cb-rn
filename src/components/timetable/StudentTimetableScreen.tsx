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
          <ActivityIndicator size="large" color={colors.primary[600]} />
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
                    <Text style={styles.subjectTitle} numberOfLines={2} ellipsizeMode="tail">
                      {slot.subject?.subject_name || 'Unknown Subject'}
                    </Text>
                    
                    <View style={styles.detailRow}>
                      <User size={14} color={colors.text.tertiary} />
                      <Text style={styles.teacherName} numberOfLines={1} ellipsizeMode="tail">
                        {slot.teacher?.full_name || 'Unknown Teacher'}
                      </Text>
                    </View>

                    {slot.plan_text && (
                      <View style={styles.detailRow}>
                        <BookOpen size={14} color={colors.text.tertiary} />
                        <Text style={styles.planText} numberOfLines={3} ellipsizeMode="tail">
                          {slot.plan_text}
                        </Text>
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
    backgroundColor: colors.background.app,
  },
  header: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    lineHeight: typography.lineHeight.tight,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.inverse,
    opacity: 0.9,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.normal,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.app,
  },
  todayButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[600],
  },
  todayButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    lineHeight: typography.lineHeight.normal,
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
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    lineHeight: typography.lineHeight.normal,
  },
  periodChip: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[600],
  },
  periodChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    lineHeight: typography.lineHeight.normal,
  },
  periodContent: {
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    lineHeight: typography.lineHeight.tight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    lineHeight: typography.lineHeight.normal,
  },
  planContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
  },
  planLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.normal,
  },
  planText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  breakContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.tight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    marginTop: spacing.md,
    lineHeight: typography.lineHeight.normal,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[600],
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.tight,
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.normal,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.tight,
  },
  emptyMessage: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
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
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.tight,
  },
  contextSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
  dateNavButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.app,
    ...shadows.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.tight,
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
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    lineHeight: typography.lineHeight.normal,
  },
  periodCard: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
  },
  breakCard: {
    backgroundColor: colors.neutral[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral[300],
  },
  periodBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  periodBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    lineHeight: typography.lineHeight.normal,
  },
  subjectTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.tight,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  teacherName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  breakTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: typography.lineHeight.tight,
  },
});
