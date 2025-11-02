import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { CalendarRange, UserCheck, CreditCard, NotebookText, UsersRound, LineChart, TrendingUp, Bell, Activity, FileText, CalendarDays, CheckCircle2, Target, AlertCircle, FolderOpen, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClass } from '../../src/hooks/useClasses';
import { useDashboardStats, useRecentActivity, useUpcomingEvents, useFeeOverview, useTaskOverview } from '../../src/hooks/useDashboard';
import { Card, Badge, Avatar } from '../../src/components/ui';
import { ThreeStateView } from '../../src/components/common/ThreeStateView';
import { ProgressRing } from '../../src/components/analytics/ProgressRing';
import { log } from '../../src/lib/logger';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  
  const isStudent = profile?.role === 'student';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  
  // Get class data for display
  const { data: classData } = useClass(profile?.class_instance_id || '');
  
  // Real data hooks
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats(
    profile?.auth_id || '', 
    profile?.class_instance_id || undefined,
    profile?.role
  );
  const { data: recentActivity, isLoading: activityLoading, error: activityError, refetch: refetchActivity } = useRecentActivity(
    profile?.auth_id || '', 
    profile?.class_instance_id || undefined
  );
  const { data: upcomingEvents, refetch: refetchEvents } = useUpcomingEvents(
    profile?.school_code || '',
    profile?.class_instance_id || undefined
  );
  const { data: feeOverview, refetch: refetchFee } = useFeeOverview(
    isStudent ? profile?.auth_id || '' : ''
  );
  const { data: taskOverview, refetch: refetchTask } = useTaskOverview(
    isStudent ? profile?.auth_id || '' : '',
    profile?.class_instance_id || undefined
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Only refetch if we have the required data
      const promises = [];
      
      if (profile?.auth_id && profile?.class_instance_id) {
        promises.push(refetchStats(), refetchActivity());
      }
      
      if (profile?.school_code) {
        promises.push(refetchEvents());
      }
      
      if (isStudent && profile?.auth_id) {
        promises.push(refetchFee(), refetchTask());
      }
      
      await Promise.all(promises);
    } catch (err) {
      log.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };


  const quickActions = [
    {
      title: 'Timetable',
      subtitle: 'View schedule',
      icon: CalendarRange,
      color: colors.primary[600],
      bgColor: colors.primary[50],
      route: '/timetable',
      gradient: colors.gradient.primary,
    },
    {
      title: 'Attendance',
      subtitle: 'Mark & track',
      icon: UserCheck,
      color: colors.success[600],
      bgColor: colors.success[50],
      route: '/attendance',
      gradient: colors.gradient.success,
    },
    {
      title: 'Tasks',
      subtitle: 'Assignments',
      icon: CheckCircle2,
      color: colors.secondary[600],
      bgColor: colors.secondary[50],
      route: '/tasks',
      gradient: colors.gradient.secondary,
    },
    {
      title: 'Calendar',
      subtitle: 'Events',
      icon: CalendarDays,
      color: colors.info[600],
      bgColor: colors.info[50],
      route: '/calendar',
      gradient: colors.gradient.ocean,
    },
    {
      title: 'Fees',
      subtitle: 'Payments',
      icon: CreditCard,
      color: colors.warning[600],
      bgColor: colors.warning[50],
      route: '/fees',
      gradient: colors.gradient.warning,
    },
    {
      title: 'Resources',
      subtitle: 'Learning',
      icon: FolderOpen,
      color: colors.secondary[600],
      bgColor: colors.secondary[50],
      route: '/resources',
      gradient: colors.gradient.cosmic,
    },
  ];

  // Dynamic stats based on real data with navigation and trends
  const dashboardStats = stats ? [
    {
      title: 'Today\'s Classes',
      value: stats.todaysClasses.toString(),
      change: stats.todaysClasses > 0 ? `${stats.todaysClasses} scheduled` : 'No classes',
      icon: CalendarRange,
      color: colors.primary[600],
      bgColor: colors.primary[50],
      route: '/(tabs)/timetable',
      showProgress: false,
      trend: null,
    },
    {
      title: isStudent ? 'Month Attendance' : 'Total Students',
      value: isStudent ? `${stats.attendancePercentage}%` : (stats.totalStudents?.toString() || '0'),
      change: isStudent ? (stats.attendancePercentage >= 90 ? 'Excellent' : stats.attendancePercentage >= 80 ? 'Good' : stats.attendancePercentage >= 75 ? 'Fair' : 'Low') : 'in class',
      icon: isStudent ? TrendingUp : UsersRound,
      color: isStudent ? (stats.attendancePercentage >= 90 ? colors.success[600] : stats.attendancePercentage >= 80 ? colors.info[600] : stats.attendancePercentage >= 75 ? colors.warning[600] : colors.error[600]) : colors.info[600],
      bgColor: isStudent ? (stats.attendancePercentage >= 90 ? colors.success[50] : stats.attendancePercentage >= 80 ? colors.info[50] : stats.attendancePercentage >= 75 ? colors.warning[50] : colors.error[50]) : colors.info[50],
      route: isStudent ? '/(tabs)/attendance' : '/(tabs)/manage',
      showProgress: isStudent,
      progressValue: isStudent ? stats.attendancePercentage : undefined,
      trend: isStudent ? (stats.attendancePercentage >= 75 ? 'up' : 'down') : null,
    },
    {
      title: 'Assignments',
      value: stats.pendingAssignments.toString(),
      change: stats.pendingAssignments > 0 ? 'Pending' : 'All done',
      icon: FileText,
      color: stats.pendingAssignments > 0 ? colors.warning[600] : colors.success[600],
      bgColor: stats.pendingAssignments > 0 ? colors.warning[50] : colors.success[50],
      route: '/(tabs)/tasks',
      showProgress: false,
      trend: null,
    },
    {
      title: 'Upcoming Tests',
      value: stats.upcomingTests.toString(),
      change: stats.upcomingTests > 0 ? 'This week' : 'None',
      icon: Target,
      color: stats.upcomingTests > 0 ? colors.error[600] : colors.success[600],
      bgColor: stats.upcomingTests > 0 ? colors.error[50] : colors.success[50],
      route: '/(tabs)/assessments',
      showProgress: false,
      trend: null,
    },
    ...(isStudent ? [{
      title: 'Week Attendance',
      value: `${stats.weekAttendance}%`,
      change: stats.weekAttendance >= 90 ? 'Great' : stats.weekAttendance >= 75 ? 'Good' : 'Improve',
      icon: UserCheck,
      color: stats.weekAttendance >= 90 ? colors.success[600] : stats.weekAttendance >= 75 ? colors.info[600] : colors.warning[600],
      bgColor: stats.weekAttendance >= 90 ? colors.success[50] : stats.weekAttendance >= 75 ? colors.info[50] : colors.warning[50],
      route: '/(tabs)/attendance',
      showProgress: true,
      progressValue: stats.weekAttendance,
      trend: stats.weekAttendance >= 75 ? 'up' : 'down',
    }] : []),
  ] : [];

  // Get most recent task/test for quick access
  const mostRecentTask = recentActivity?.find(a => a.type === 'assignment');
  const mostRecentTest = recentActivity?.find(a => a.type === 'test');
  
  const viewState = (authLoading || statsLoading || activityLoading) ? 'loading' : (statsError || activityError) ? 'error' : !profile ? 'empty' : 'success';
  
  // Determine if user has incomplete profile (fallback profile)
  const hasIncompleteProfile = profile && (!profile.school_code || !profile.class_instance_id);
  
  return (
    <ThreeStateView
      state={viewState}
      loadingMessage="Loading dashboard..."
      errorMessage="Failed to load dashboard"
      errorDetails={statsError?.message || activityError?.message}
      emptyMessage={
        hasIncompleteProfile 
          ? "Profile setup required. Please contact your administrator to complete your account setup."
          : "No profile data available"
      }
      onRetry={handleRefresh}
    >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
        {/* Profile Header - Personalized */}
        <View style={styles.profileHeader}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Avatar 
                name={profile?.full_name || 'User'} 
                size="lg"
                variant="primary"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.greetingText}>
                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
              </Text>
              <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
              {classData && (
                <View style={styles.classInfoRow}>
                  <View style={styles.classBadge}>
                    <Text style={styles.classBadgeText}>
                      Class {classData.grade}-{classData.section}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {/* TODO: Navigate to notifications */}}
              activeOpacity={0.7}
            >
              <View style={styles.notificationIconContainer}>
                <Bell size={22} color={colors.primary[600]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions - Horizontal Scroll with Modern Design */}
        <View style={styles.quickActionsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions && quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionItem}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.6}
              >
                <View style={[styles.quickActionCircle, { backgroundColor: action.bgColor }]}>
                  <action.icon size={24} color={action.color} strokeWidth={2} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Grid - Enhanced with Visual Hierarchy */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {statsLoading ? (
              // Skeleton loaders for stats
              Array.from({ length: isStudent ? 5 : 4 }).map((_, index) => (
                <View key={index} style={[styles.statCard, styles.statCardSkeleton]}>
                  <View style={[styles.statSkeletonIcon, { backgroundColor: colors.neutral[200] }]} />
                  <View style={[styles.statSkeletonValue, { backgroundColor: colors.neutral[200] }]} />
                  <View style={[styles.statSkeletonTitle, { backgroundColor: colors.neutral[200] }]} />
                  <View style={[styles.statSkeletonChange, { backgroundColor: colors.neutral[200] }]} />
                </View>
              ))
            ) : (
              dashboardStats && dashboardStats.map((stat, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.statCard}
                  activeOpacity={0.7}
                  onPress={() => stat.route && router.push(stat.route as any)}
                >
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                      <stat.icon size={18} color={stat.color} strokeWidth={2.5} />
                    </View>
                    {stat.trend && (
                      <View style={styles.trendIndicator}>
                        {stat.trend === 'up' ? (
                          <ArrowUpRight size={12} color={colors.success[600]} />
                        ) : (
                          <ArrowDownRight size={12} color={colors.error[600]} />
                        )}
                      </View>
                    )}
                    {stat.route && (
                      <ChevronRight size={14} color={colors.text.tertiary} style={styles.chevronIcon} />
                    )}
                  </View>
                  {stat.showProgress && stat.progressValue !== undefined ? (
                    <View style={styles.statProgressContainer}>
                      <ProgressRing
                        progress={stat.progressValue}
                        size={60}
                        strokeWidth={6}
                        color={stat.color}
                        backgroundColor={colors.neutral[100]}
                        showPercentage={false}
                      />
                      <Text style={styles.statProgressValue}>{stat.value}</Text>
                    </View>
                  ) : (
                    <Text style={styles.statValue}>{stat.value}</Text>
                  )}
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <View style={[styles.statIndicator, { backgroundColor: stat.color }]}>
                    <Text style={styles.statChange}>{stat.change}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Quick Access - Most Recent Items */}
        {(mostRecentTask || mostRecentTest) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessContainer}>
              {mostRecentTask && (
                <TouchableOpacity
                  style={styles.quickAccessCard}
                  onPress={() => router.push('/(tabs)/tasks')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickAccessIcon, { backgroundColor: colors.info[50] }]}>
                    <FileText size={20} color={colors.info[600]} />
                  </View>
                  <View style={styles.quickAccessContent}>
                    <Text style={styles.quickAccessTitle} numberOfLines={1}>
                      {mostRecentTask.title}
                    </Text>
                    <Text style={styles.quickAccessSubtitle} numberOfLines={1}>
                      {mostRecentTask.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
              {mostRecentTest && (
                <TouchableOpacity
                  style={styles.quickAccessCard}
                  onPress={() => router.push('/(tabs)/assessments')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickAccessIcon, { backgroundColor: colors.secondary[50] }]}>
                    <Target size={20} color={colors.secondary[600]} />
                  </View>
                  <View style={styles.quickAccessContent}>
                    <Text style={styles.quickAccessTitle} numberOfLines={1}>
                      {mostRecentTest.title}
                    </Text>
                    <Text style={styles.quickAccessSubtitle} numberOfLines={1}>
                      {mostRecentTest.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Class Overview (Admin/Teacher Only) */}
        {isAdmin && stats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Class Overview</Text>
              <TouchableOpacity onPress={() => router.push('/manage')}>
                <Text style={styles.sectionLink}>Manage</Text>
              </TouchableOpacity>
            </View>
            <Card variant="elevated" style={styles.classOverviewCard}>
              <View style={styles.classOverviewGrid}>
                <View style={styles.classOverviewItem}>
                  <View style={[styles.classOverviewIconContainer, { backgroundColor: colors.info[50] }]}>
                    <UsersRound size={20} color={colors.info[600]} />
                  </View>
                  <Text style={styles.classOverviewValue}>{stats.totalStudents || 0}</Text>
                  <Text style={styles.classOverviewLabel}>Total Students</Text>
                </View>
                <View style={styles.classOverviewItem}>
                  <View style={[styles.classOverviewIconContainer, { backgroundColor: colors.primary[50] }]}>
                    <CalendarRange size={20} color={colors.primary[600]} />
                  </View>
                  <Text style={styles.classOverviewValue}>{stats.todaysClasses}</Text>
                  <Text style={styles.classOverviewLabel}>Today&apos;s Classes</Text>
                </View>
                <View style={styles.classOverviewItem}>
                  <View style={[styles.classOverviewIconContainer, { backgroundColor: colors.warning[50] }]}>
                    <FileText size={20} color={colors.warning[600]} />
                  </View>
                  <Text style={styles.classOverviewValue}>{stats.pendingAssignments}</Text>
                  <Text style={styles.classOverviewLabel}>Active Tasks</Text>
                </View>
                <View style={styles.classOverviewItem}>
                  <View style={[styles.classOverviewIconContainer, { backgroundColor: colors.error[50] }]}>
                    <Target size={20} color={colors.error[600]} />
                  </View>
                  <Text style={styles.classOverviewValue}>{stats.upcomingTests}</Text>
                  <Text style={styles.classOverviewLabel}>Upcoming Tests</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Quick Stats Summary (Admin/Teacher Only) */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <TouchableOpacity onPress={() => router.push('/analytics')}>
                <Text style={styles.sectionLink}>Analytics</Text>
              </TouchableOpacity>
            </View>
            <Card variant="elevated" style={styles.quickStatsCard}>
              <View style={styles.quickStatRow}>
                <View style={styles.quickStatItem}>
                  <UserCheck size={20} color={colors.success[600]} />
                  <View style={styles.quickStatContent}>
                    <Text style={styles.quickStatLabel}>Class Attendance</Text>
                    <Text style={styles.quickStatValue}>
                      {stats?.attendancePercentage || 0}% Today
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatRow}>
                <View style={styles.quickStatItem}>
                  <FolderOpen size={20} color={colors.info[600]} />
                  <View style={styles.quickStatContent}>
                    <Text style={styles.quickStatLabel}>Resources Shared</Text>
                    <Text style={styles.quickStatValue}>View resources →</Text>
                  </View>
                </View>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatRow}>
                <View style={styles.quickStatItem}>
                  <LineChart size={20} color={colors.secondary[600]} />
                  <View style={styles.quickStatContent}>
                    <Text style={styles.quickStatLabel}>Class Performance</Text>
                    <Text style={styles.quickStatValue}>View analytics →</Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Task Overview (Students Only) */}
        {isStudent && taskOverview && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Task Overview</Text>
              <TouchableOpacity onPress={() => router.push('/tasks')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            <Card variant="elevated" style={styles.taskOverviewCard}>
              {taskOverview.total > 0 ? (
                <>
                  <View style={styles.taskOverviewGrid}>
                    <View style={styles.taskOverviewItem}>
                      <Text style={styles.taskOverviewValue}>{taskOverview.total}</Text>
                      <Text style={styles.taskOverviewLabel}>Total</Text>
                    </View>
                    <View style={styles.taskOverviewItem}>
                      <Text style={[styles.taskOverviewValue, { color: colors.success[600] }]}>
                        {taskOverview.completed}
                      </Text>
                      <Text style={styles.taskOverviewLabel}>Completed</Text>
                    </View>
                    <View style={styles.taskOverviewItem}>
                      <Text style={[styles.taskOverviewValue, { color: colors.warning[600] }]}>
                        {taskOverview.dueThisWeek}
                      </Text>
                      <Text style={styles.taskOverviewLabel}>This Week</Text>
                    </View>
                    <View style={styles.taskOverviewItem}>
                      <Text style={[styles.taskOverviewValue, { color: colors.error[600] }]}>
                        {taskOverview.overdue}
                      </Text>
                      <Text style={styles.taskOverviewLabel}>Overdue</Text>
                    </View>
                  </View>
                  {taskOverview.overdue > 0 && (
                    <View style={styles.taskAlert}>
                      <AlertCircle size={16} color={colors.error[600]} />
                      <Text style={styles.taskAlertText}>
                        You have {taskOverview.overdue} overdue task{taskOverview.overdue > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <CheckCircle2 size={40} color={colors.primary[400]} />
                  </View>
                  <Text style={styles.emptyStateTitle}>All caught up! 🎉</Text>
                  <Text style={styles.emptyStateText}>
                    No tasks assigned yet. Check back soon for new homework and assignments.
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyStateCTA}
                    onPress={() => router.push('/tasks')}
                  >
                    <Text style={styles.emptyStateCTAText}>View All Tasks</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Fee Overview (Students Only) */}
        {isStudent && feeOverview && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fee Overview</Text>
              <TouchableOpacity onPress={() => router.push('/fees')}>
                <Text style={styles.sectionLink}>Details</Text>
              </TouchableOpacity>
            </View>
            <Card variant="elevated" style={styles.feeCard}>
              {feeOverview.totalFee > 0 ? (
                <>
                  <View style={styles.feeRow}>
                    <View style={styles.feeItem}>
                      <Text style={styles.feeLabel}>Total Fee</Text>
                      <Text style={styles.feeValue}>₹{feeOverview.totalFee.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.feeItem}>
                      <Text style={styles.feeLabel}>Paid</Text>
                      <Text style={[styles.feeValue, { color: colors.success[600] }]}>
                        ₹{feeOverview.paidAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.feeItem}>
                      <Text style={styles.feeLabel}>Pending</Text>
                      <Text style={[styles.feeValue, { color: colors.error[600] }]}>
                        ₹{feeOverview.pendingAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.feeProgressContainer}>
                    <View style={styles.feeProgressBar}>
                      <View 
                        style={[
                          styles.feeProgressFill, 
                          { 
                            width: `${(feeOverview.paidAmount / feeOverview.totalFee) * 100}%`,
                            backgroundColor: colors.success[600]
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.feeProgressText}>
                      {Math.round((feeOverview.paidAmount / feeOverview.totalFee) * 100)}% paid
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <CreditCard size={40} color={colors.warning[400]} />
                  </View>
                  <Text style={styles.emptyStateTitle}>Fee plan not set up yet</Text>
                  <Text style={styles.emptyStateText}>
                    Your school will assign your fee structure soon. You&apos;ll be notified once it&apos;s ready.
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyStateCTA}
                    onPress={() => router.push('/fees')}
                  >
                    <Text style={styles.emptyStateCTAText}>Learn More</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/calendar')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <Card variant="elevated" style={styles.eventsCard}>
            {upcomingEvents && Array.isArray(upcomingEvents) && upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <View 
                  key={event.id} 
                  style={[
                    styles.eventItem,
                    index < upcomingEvents.length - 1 && styles.eventItemBorder
                  ]}
                >
                  <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventMeta}>
                      <CalendarDays size={14} color={colors.text.tertiary} />
                      <Text style={styles.eventDate}>
                        {new Date(event.date).toLocaleDateString('en-IN', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                      <Badge variant="secondary" size="sm">{event.type}</Badge>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                  <CalendarDays size={40} color={colors.info[400]} />
                </View>
                <Text style={styles.emptyStateTitle}>Nothing planned yet 📅</Text>
                <Text style={styles.emptyStateText}>
                  No upcoming events in the next 30 days. Enjoy your regular schedule!
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateCTA}
                  onPress={() => router.push('/calendar')}
                >
                  <Text style={styles.emptyStateCTAText}>View Full Calendar</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <Card variant="elevated" style={styles.activityCard}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'attendance': return UserCheck;
                    case 'assignment': return NotebookText;
                    case 'test': return Target;
                    case 'event': return CalendarDays;
                    default: return Activity;
                  }
                };
                
                const getActivityColor = (color?: string) => {
                  switch (color) {
                    case 'success': return { bg: colors.success[50], icon: colors.success[600] };
                    case 'error': return { bg: colors.error[50], icon: colors.error[600] };
                    case 'warning': return { bg: colors.warning[50], icon: colors.warning[600] };
                    case 'info': return { bg: colors.info[50], icon: colors.info[600] };
                    case 'secondary': return { bg: colors.secondary[50], icon: colors.secondary[600] };
                    default: return { bg: colors.primary[50], icon: colors.primary[600] };
                  }
                };

                const ActivityIcon = getActivityIcon(activity.type);
                const activityColor = getActivityColor(activity.color);

                return (
                  <View 
                    key={activity.id} 
                    style={[
                      styles.activityItem,
                      index < recentActivity.length - 1 && styles.activityItemBorder
                    ]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: activityColor.bg }]}>
                      <ActivityIcon size={16} color={activityColor.icon} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                  <Activity size={40} color={colors.secondary[400]} />
                </View>
                <Text style={styles.emptyStateTitle}>👀 Nothing yet</Text>
                <Text style={styles.emptyStateText}>
                  Your activity feed will light up here soon. Check back after your first class!
                </Text>
              </View>
            )}
          </Card>
        </View>
        </ScrollView>
      </ThreeStateView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  profileHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
    fontWeight: typography.fontWeight.medium,
  },
  profileName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  classBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  notificationButton: {
    padding: spacing.xs,
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: (width - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  statCardSkeleton: {
    opacity: 0.6,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendIndicator: {
    marginLeft: 'auto',
    marginRight: spacing.xs,
    padding: 2,
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  statProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  statProgressValue: {
    position: 'absolute',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  statIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  statChange: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  // Skeleton styles
  statSkeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  statSkeletonValue: {
    width: '60%',
    height: 28,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  statSkeletonTitle: {
    width: '80%',
    height: 14,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  statSkeletonChange: {
    width: '50%',
    height: 20,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  sectionLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  taskOverviewCard: {
    padding: spacing.md,
  },
  taskOverviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  taskOverviewItem: {
    alignItems: 'center',
  },
  taskOverviewValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  taskOverviewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  taskAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  taskAlertText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[700],
    marginLeft: spacing.xs,
    flex: 1,
  },
  feeCard: {
    padding: spacing.md,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  feeItem: {
    flex: 1,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  feeValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  feeProgressContainer: {
    marginTop: spacing.sm,
  },
  feeProgressBar: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  feeProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  feeProgressText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  eventsCard: {
    padding: spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  eventColorBar: {
    width: 3,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  quickActionsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionsScroll: {
    paddingVertical: spacing.sm,
  },
  quickActionItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  quickActionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    maxWidth: 70,
  },
  statsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  activityCard: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 1,
  },
  activitySubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  emptyStateCTA: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  emptyStateCTAText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  quickAccessContainer: {
    gap: spacing.sm,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quickAccessIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  quickAccessContent: {
    flex: 1,
    minWidth: 0,
  },
  quickAccessTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  quickAccessSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  classOverviewCard: {
    padding: spacing.md,
  },
  classOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  classOverviewItem: {
    width: (width - spacing.md * 2 - spacing.sm) / 2,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  classOverviewIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  classOverviewValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  classOverviewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickStatsCard: {
    padding: spacing.md,
  },
  quickStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickStatContent: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  quickStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 1,
  },
  quickStatValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  quickStatDivider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
});
