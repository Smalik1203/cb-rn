import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, RefreshControl } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { Calendar, Clock, ListTodo, Coffee } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentTimetable } from '../../hooks/useStudentTimetable';
import { useSyllabusLoader } from '../../hooks/useSyllabusLoader';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import dayjs from 'dayjs';
import { DatePickerModal } from '../common/DatePickerModal';
import { ThreeStateView } from '../common/ThreeStateView';

// Clean Timetable Card Component (replicated from superadmin)
function CleanTimetableCard({
  slot,
  formatTime12Hour,
  isCurrentPeriod,
  isUpcomingPeriod,
  isPastPeriod,
  isTaught,
  syllabusContentMap,
}: any) {
  if (slot.slot_type === 'break') {
    return (
      <View style={styles.cleanBreakCard}>
        <View style={styles.cleanBreakContent}>
          <View style={styles.cleanBreakIcon}>
            <Coffee size={18} color="#a16207" />
          </View>
          <View style={styles.cleanBreakText}>
            <Text style={styles.cleanBreakTitle}>{slot.name || 'Break'}</Text>
            <Text style={styles.cleanBreakTime}>
              {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.cleanPeriodCard,
      isCurrentPeriod && styles.cleanCurrentCard,
      isUpcomingPeriod && styles.cleanUpcomingCard,
      isPastPeriod && styles.cleanPastCard,
      isTaught ? styles.cleanCompletedCard : styles.cleanPendingCard
    ]}>
      <View style={styles.cleanPeriodLeftBorder} />
      
      <View style={styles.cleanPeriodContent}>
        {/* Line 1: Time + Subject */}
        <View style={styles.cleanPeriodHeader}>
          <View style={styles.cleanContentColumn}>
            <RNText style={[styles.cleanTimeText, isTaught && styles.completedText]}>
              {`${formatTime12Hour(slot?.start_time)} - ${formatTime12Hour(slot?.end_time)}`}
            </RNText>
            <RNText style={[styles.cleanSubjectName, isTaught && styles.completedText]} numberOfLines={2} ellipsizeMode="tail">
              {slot.subject?.subject_name?.trim?.() || 'Unassigned'}
            </RNText>
          </View>
        </View>

        {/* Lines 2 & 3: Topic and Teacher */}
        <View style={styles.cleanLines}>
          <RNText style={[styles.cleanLineText, isTaught && styles.completedText]} numberOfLines={1}>
            <RNText style={[styles.cleanLabel, isTaught && styles.completedLabel]}>Topic: </RNText>
            {(() => {
              // Get topic name from syllabus content map (same as superadmin)
              const topicContent = slot.syllabus_topic_id ? syllabusContentMap?.get(`topic_${slot.syllabus_topic_id}`) : null;
              return topicContent?.title?.trim() || slot.plan_text?.trim() || '—';
            })()}
          </RNText>
          <RNText style={[styles.cleanLineText, isTaught && styles.completedText]} numberOfLines={1}>
            <RNText style={[styles.cleanLabel, isTaught && styles.completedLabel]}>Teacher: </RNText>
            {slot.teacher?.full_name?.trim?.() || '—'}
          </RNText>
        </View>
      </View>
    </View>
  );
}

export function StudentTimetableScreen() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
  const { slots, displayPeriodNumber, loading, error, refetch, taughtSlotIds } = useStudentTimetable(
    profile?.class_instance_id,
    dateStr
  );
  
  // Load syllabus data for topic names (same as superadmin)
  const { syllabusContentMap } = useSyllabusLoader(profile?.class_instance_id, profile?.school_code);

  // Time formatter
  const formatTime12Hour = (time24?: string | null) => {
    if (!time24 || typeof time24 !== 'string') {
      return '--:--';
    }
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const hour = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (Number.isNaN(hour)) return `${parts[0]}:${minutes}`;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Helper function to determine if a period is currently active
  const isCurrentPeriod = (slot: any) => {
    if (!slot || slot.slot_type !== 'period') return false;
    const currentTime = getCurrentTime();
    return currentTime >= slot.start_time && currentTime <= slot.end_time;
  };

  // Helper function to determine if a period is upcoming today
  const isUpcomingPeriod = (slot: any) => {
    if (!slot || slot.slot_type !== 'period') return false;
    const currentTime = getCurrentTime();
    return slot.start_time > currentTime;
  };

  // Helper function to determine if a period is completed
  const isCompletedPeriod = (slot: any) => {
    if (!slot || slot.slot_type !== 'period') return false;
    const currentTime = getCurrentTime();
    return slot.end_time < currentTime;
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      // Handle error silently
    } finally {
      setRefreshing(false);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={styles.container}>
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

  // Handle empty state - no class assigned
  if (!profile?.class_instance_id) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No class assigned</Text>
          <Text style={styles.emptyMessage}>
            Please contact your administrator to assign you to a class.
          </Text>
        </View>
      </View>
    );
  }

  // Handle empty state - no slots for selected date
  if (slots.length === 0) {
    return (
      <View style={styles.container}>
        {/* Filter bar (Date only) */}
        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterItem} onPress={() => setShowDatePicker(true)}>
            <View style={styles.filterIcon}>
              <ListTodo size={16} color="#ffffff" />
            </View>
            <View style={styles.filterContent}>
              <Text style={styles.filterLabel}>Date</Text>
              <Text style={styles.filterValue}>{dayjs(selectedDate).format('MMM YYYY')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ThreeStateView
          state="empty"
          emptyMessage={`No classes scheduled for ${dayjs(selectedDate).format('MMMM D, YYYY')}`}
          emptyAction={{ label: 'Change Date', onPress: () => setShowDatePicker(true) }}
        />
        <DatePickerModal
          visible={showDatePicker}
          initialDate={selectedDate}
          onDismiss={() => setShowDatePicker(false)}
          onConfirm={(date) => {
            setSelectedDate(date);
            setShowDatePicker(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter bar (Date only) */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterItem} onPress={() => setShowDatePicker(true)}>
          <View style={styles.filterIcon}>
            <ListTodo size={16} color="#ffffff" />
          </View>
          <View style={styles.filterContent}>
            <Text style={styles.filterLabel}>Date</Text>
            <Text style={styles.filterValue}>{dayjs(selectedDate).format('MMM YYYY')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Timetable */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
      >
        <View style={styles.timetableContentContainer}>
          <View style={styles.cleanTimetableGrid}>
            {slots.map((slot, index) => {
              const isTaught = taughtSlotIds.has(slot.id);
              return (
                <CleanTimetableCard
                  key={slot.id}
                  slot={slot}
                  index={index}
                  formatTime12Hour={formatTime12Hour}
                  isCurrentPeriod={isCurrentPeriod(slot)}
                  isUpcomingPeriod={isUpcomingPeriod(slot)}
                  isPastPeriod={isCompletedPeriod(slot)}
                  isTaught={isTaught}
                  syllabusContentMap={syllabusContentMap}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        initialDate={selectedDate}
        onDismiss={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          setSelectedDate(date);
          setShowDatePicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  // Filter bar styles (matching superadmin)
  filterBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContent: { flex: 1 },
  filterLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  filterValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  timetableContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cleanTimetableGrid: {
    gap: 8,
  },
  // Clean UI Styles (matching superadmin)
  cleanPeriodCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    flexDirection: 'row',
    minHeight: 96,
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral[300], // Default, will be overridden by pending/completed
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cleanCurrentCard: {
    borderWidth: 2,
    borderColor: colors.success[600],
    ...shadows.md,
  },
  cleanUpcomingCard: {
    borderWidth: 1,
    borderColor: colors.info[600],
  },
  cleanPastCard: {
    opacity: 0.85,
  },
  cleanCompletedCard: {
    borderLeftColor: colors.secondary[600], // Secondary color for completed (matches superadmin)
    backgroundColor: colors.secondary[50], // Light secondary background (matches superadmin)
    borderLeftWidth: 4,
    opacity: 0.7, // Grey out effect for completed cards
  },
  cleanPendingCard: {
    borderLeftColor: colors.primary[600], // Primary orange for pending
    backgroundColor: colors.surface.primary, // White background
    borderLeftWidth: 4,
  },
  cleanPeriodLeftBorder: {
    width: 4,
    backgroundColor: 'transparent', // Will be overridden by card status colors
  },
  cleanPeriodContent: {
    flex: 1,
    padding: spacing.sm,
    paddingBottom: spacing.sm,
    minWidth: 0,
  },
  cleanPeriodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    width: '100%',
  },
  cleanContentColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginRight: spacing.sm,
    minWidth: 0,
  },
  cleanTimeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
    width: '100%',
  },
  cleanSubjectName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 24,
    width: '100%',
    flexWrap: 'wrap',
    overflow: 'hidden',
    marginBottom: 6,
    // No paddingRight needed for students (no edit button)
  },
  cleanLines: {
    marginTop: spacing.sm,
    gap: 4,
  },
  cleanLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  cleanLineText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  completedText: {
    color: colors.text.tertiary, // Very muted grey text for completed cards
    opacity: 0.6, // Strong opacity reduction for text
  },
  completedLabel: {
    color: colors.text.tertiary, // Muted for labels
    opacity: 0.5,
  },
  cleanBreakCard: {
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.xs,
    minHeight: 96,
    opacity: 0.9,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[700],
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  cleanBreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cleanBreakIcon: {
    marginRight: 12,
  },
  cleanBreakText: {
    flex: 1,
  },
  cleanBreakTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning[800],
    marginBottom: 2,
  },
  cleanBreakTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning[700],
  },
  // Loading States
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
  // Error States
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
  // Empty States
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
});
