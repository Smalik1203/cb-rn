import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react-native';
import { useStudentAttendance } from '../../hooks/useAttendance';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import { ProgressRing } from '../analytics/ProgressRing';
import { ThreeStateView } from '../common/ThreeStateView';
import { supabase } from '../../data/supabaseClient';
import dayjs from 'dayjs';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  created_at?: string;
}

export const StudentAttendanceView: React.FC = () => {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loadingStudentId, setLoadingStudentId] = useState(true);

  // Get student ID from profile (matching V1 pattern with fallback logic)
  useEffect(() => {
    const fetchStudent = async () => {
      if (!profile?.auth_id || profile?.role !== 'student') {
        setLoadingStudentId(false);
        return;
      }

      setLoadingStudentId(true);
      try {
        const schoolCode = profile.school_code;
        
        if (!schoolCode) {
          throw new Error('School information not found in your profile. Please contact support.');
        }

        // Try to find student by auth_user_id first (most reliable)
        let { data, error: queryError } = await supabase
          .from('student')
          .select('id')
          .eq('auth_user_id', profile.auth_id)
          .eq('school_code', schoolCode)
          .maybeSingle();

        // If not found by auth_user_id, try by email (fallback)
        if (!data && !queryError && profile.email) {
          const result = await supabase
            .from('student')
            .select('id')
            .eq('email', profile.email)
            .eq('school_code', schoolCode)
            .maybeSingle();
          data = result.data;
          queryError = result.error;
        }

        if (queryError) {
          console.error('Student lookup error:', queryError);
          throw new Error(`Failed to find student profile: ${queryError.message || 'Please contact support if this issue persists.'}`);
        }
        
        if (!data) {
          throw new Error('Student profile not found. Please contact your administrator to ensure your account is properly linked.');
        }
        
        setStudentId(data.id);
      } catch (err: any) {
        console.error('Error fetching student:', err);
        // Error will be caught and loading set to false
        // Don't set studentId, so viewState will be 'empty'
      } finally {
        setLoadingStudentId(false);
      }
    };

    fetchStudent();
  }, [profile?.auth_id, profile?.role, profile?.school_code, profile?.email]);

  // Fetch student attendance data
  const { data: attendanceRecords = [], isLoading, error, refetch } = useStudentAttendance(studentId || undefined);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Calculate month stats
  const monthStats = useMemo(() => {
    const startOfMonth = dayjs(selectedMonth).startOf('month');
    const endOfMonth = dayjs(selectedMonth).endOf('month');
    const startDateStr = startOfMonth.format('YYYY-MM-DD');
    const endDateStr = endOfMonth.format('YYYY-MM-DD');
    
    const monthRecords = attendanceRecords.filter(record => {
      // Use string comparison for reliable date filtering
      return record.date >= startDateStr && record.date <= endDateStr;
    });

    const present = monthRecords.filter(r => r.status === 'present').length;
    const absent = monthRecords.filter(r => r.status === 'absent').length;
    const total = monthRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  }, [attendanceRecords, selectedMonth]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const total = attendanceRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  }, [attendanceRecords]);

  // Group records by date for calendar view
  const recordsByDate = useMemo(() => {
    const grouped: { [key: string]: AttendanceRecord } = {};
    attendanceRecords.forEach(record => {
      grouped[record.date] = record;
    });
    return grouped;
  }, [attendanceRecords]);

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const start = dayjs(selectedMonth).startOf('month');
    const end = dayjs(selectedMonth).endOf('month');
    const daysInMonth = end.date();
    const firstDayOfWeek = start.day();

    const days: Array<{ date: Date; isCurrentMonth: boolean; record?: AttendanceRecord }> = [];

    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = start.subtract(i + 1, 'day');
      days.push({
        date: date.toDate(),
        isCurrentMonth: false,
      });
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = start.date(i);
      const dateStr = date.format('YYYY-MM-DD');
      days.push({
        date: date.toDate(),
        isCurrentMonth: true,
        record: recordsByDate[dateStr],
      });
    }

    // Fill remaining days to complete week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = end.add(i, 'day');
        days.push({
          date: date.toDate(),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [selectedMonth, recordsByDate]);

  // Recent attendance history
  const recentRecords = useMemo(() => {
    return [...attendanceRecords]
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
      .slice(0, 10);
  }, [attendanceRecords]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = dayjs(prev);
      return direction === 'prev' 
        ? newDate.subtract(1, 'month').toDate()
        : newDate.add(1, 'month').toDate();
    });
  };

  const goToToday = () => {
    setSelectedMonth(new Date());
  };

  const getStatusColor = (status?: 'present' | 'absent') => {
    if (!status) return colors.neutral[200];
    return status === 'present' ? colors.success[600] : colors.error[600];
  };

  const getStatusBgColor = (status?: 'present' | 'absent') => {
    if (!status) return colors.neutral[50];
    return status === 'present' ? colors.success[50] : colors.error[50];
  };

  const viewState = loadingStudentId || isLoading ? 'loading' : error ? 'error' : !studentId ? 'empty' : 'success';

  if (!studentId && !loadingStudentId) {
    return (
      <ThreeStateView
        state="empty"
        emptyMessage="Student profile not found"
        errorDetails="Unable to load your student profile. Please contact support."
      />
    );
  }

  return (
    <ThreeStateView
      state={viewState}
      loadingMessage="Loading attendance..."
      errorMessage="Failed to load attendance"
      errorDetails={error?.message}
      onRetry={handleRefresh}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
        {/* Overall Stats Cards */}
        <View style={styles.statsSection}>
          <Card mode="elevated" style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
                <ProgressRing
                  progress={overallStats.percentage}
                  size={64}
                  strokeWidth={6}
                  color={colors.success[600]}
                  backgroundColor={colors.neutral[100]}
                  showPercentage={true}
                />
              </View>
              <Text style={styles.statValue}>{overallStats.percentage}%</Text>
              <Text style={styles.statLabel}>Overall Attendance</Text>
            </View>
          </Card>

          <View style={styles.statsRow}>
            <Card mode="elevated" style={styles.miniStatCard}>
              <View style={[styles.miniStatIcon, { backgroundColor: colors.success[50] }]}>
                <CheckCircle size={20} color={colors.success[600]} />
              </View>
              <Text style={styles.miniStatValue}>{overallStats.present}</Text>
              <Text style={styles.miniStatLabel}>Present</Text>
            </Card>

            <Card mode="elevated" style={styles.miniStatCard}>
              <View style={[styles.miniStatIcon, { backgroundColor: colors.error[50] }]}>
                <XCircle size={20} color={colors.error[600]} />
              </View>
              <Text style={styles.miniStatValue}>{overallStats.absent}</Text>
              <Text style={styles.miniStatLabel}>Absent</Text>
            </Card>
          </View>
        </View>

        {/* Monthly Calendar View */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly View</Text>
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>

          <Card mode="elevated" style={styles.calendarCard}>
            {/* Month Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                <ChevronLeft size={20} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                {dayjs(selectedMonth).format('MMMM YYYY')}
              </Text>
              <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                <ChevronRight size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Month Stats */}
            <View style={styles.monthStatsContainer}>
              <View style={styles.monthStatItem}>
                <Text style={styles.monthStatLabel}>This Month</Text>
                <Text style={styles.monthStatValue}>{monthStats.percentage}%</Text>
              </View>
              <View style={styles.monthStatDivider} />
              <View style={styles.monthStatItem}>
                <Text style={styles.monthStatLabel}>Present</Text>
                <Text style={[styles.monthStatValue, { color: colors.success[600] }]}>
                  {monthStats.present}
                </Text>
              </View>
              <View style={styles.monthStatDivider} />
              <View style={styles.monthStatItem}>
                <Text style={styles.monthStatLabel}>Absent</Text>
                <Text style={[styles.monthStatValue, { color: colors.error[600] }]}>
                  {monthStats.absent}
                </Text>
              </View>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const isToday = dayjs(day.date).isSame(dayjs(), 'day');
                const hasRecord = !!day.record;
                const status = day.record?.status;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      !day.isCurrentMonth && styles.calendarDayOtherMonth,
                      isToday && styles.calendarDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                        isToday && styles.calendarDayTextToday,
                      ]}
                    >
                      {dayjs(day.date).format('D')}
                    </Text>
                    {hasRecord && (
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(status) },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success[600] }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.error[600] }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.neutral[300] }]} />
                <Text style={styles.legendText}>Not Marked</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Recent History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent History</Text>
          </View>

          {recentRecords.length > 0 ? (
            <View style={styles.historyContainer}>
              {recentRecords.map((record) => {
                const isPresent = record.status === 'present';
                const recordDate = dayjs(record.date);
                const isToday = recordDate.isSame(dayjs(), 'day');
                const isYesterday = recordDate.isSame(dayjs().subtract(1, 'day'), 'day');

                let dateLabel = recordDate.format('MMM D, YYYY');
                if (isToday) dateLabel = 'Today';
                else if (isYesterday) dateLabel = 'Yesterday';

                return (
                  <Card key={record.id} mode="elevated" style={styles.historyCard}>
                    <View style={styles.historyCardContent}>
                      <View
                        style={[
                          styles.historyIcon,
                          {
                            backgroundColor: isPresent ? colors.success[50] : colors.error[50],
                          },
                        ]}
                      >
                        {isPresent ? (
                          <CheckCircle size={24} color={colors.success[600]} />
                        ) : (
                          <XCircle size={24} color={colors.error[600]} />
                        )}
                      </View>
                      <View style={styles.historyDetails}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyStatus}>
                            {isPresent ? 'Present' : 'Absent'}
                          </Text>
                          <Chip
                            style={[
                              styles.statusChip,
                              {
                                backgroundColor: isPresent
                                  ? colors.success[100]
                                  : colors.error[100],
                              },
                            ]}
                            textStyle={[
                              styles.statusChipText,
                              {
                                color: isPresent ? colors.success[700] : colors.error[700],
                              },
                            ]}
                          >
                            {record.status.toUpperCase()}
                          </Chip>
                        </View>
                        <View style={styles.historyMeta}>
                          <CalendarDays size={14} color={colors.text.secondary} />
                          <Text style={styles.historyDate}>{dateLabel}</Text>
                          <Text style={styles.historyDay}>
                            {recordDate.format('dddd')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card mode="elevated" style={styles.emptyCard}>
              <View style={styles.emptyContainer}>
                <AlertCircle size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Records Yet</Text>
                <Text style={styles.emptyText}>
                  Your attendance records will appear here once marked by your teacher.
                </Text>
              </View>
            </Card>
          )}
        </View>
        </ScrollView>
      </View>
    </ThreeStateView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  statsSection: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  statContent: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  miniStatCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  miniStatIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  miniStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  miniStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  todayButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  calendarCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonth: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  monthStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  monthStatItem: {
    alignItems: 'center',
  },
  monthStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  monthStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  monthStatDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  dayHeader: {
    width: `${100 / 7}%`,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: spacing.xs,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
  },
  calendarDayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  calendarDayTextOtherMonth: {
    color: colors.text.tertiary,
  },
  calendarDayTextToday: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  historyContainer: {
    gap: spacing.sm,
  },
  historyCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  historyCardContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  historyDetails: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyStatus: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  historyDay: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

