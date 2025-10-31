import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Calendar, CheckSquare, DollarSign, BookOpen, TrendingUp, Clock, Activity, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { useDashboardStats, useRecentActivity } from '../../src/hooks/useDashboard';
import { Card } from '../../src/components/ui';
import { ThreeStateView } from '../../src/components/common/ThreeStateView';
import { LinearGradient } from 'expo-linear-gradient';
import { log } from '../../src/lib/logger';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Real data hooks
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(
    profile?.auth_id || '', 
    profile?.class_instance_id || undefined
  );
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity(
    profile?.auth_id || '', 
    profile?.class_instance_id || undefined
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh logic would go here - TanStack Query handles refetching automatically
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      icon: Calendar,
      color: colors.primary[600],
      bgColor: colors.primary[50],
      route: '/timetable',
      gradient: colors.gradient.primary,
    },
    {
      title: 'Attendance',
      subtitle: 'Mark & track',
      icon: CheckSquare,
      color: colors.success[600],
      bgColor: colors.success[50],
      route: '/attendance',
      gradient: colors.gradient.success,
    },
    {
      title: 'Fees',
      subtitle: 'Payments',
      icon: DollarSign,
      color: colors.warning[600],
      bgColor: colors.warning[50],
      route: '/fees',
      gradient: colors.gradient.warning,
    },
    {
      title: 'Resources',
      subtitle: 'Learning',
      icon: BookOpen,
      color: colors.info[600],
      bgColor: colors.info[50],
      route: '/resources',
      gradient: colors.gradient.ocean,
    },
  ];

  // Dynamic stats based on real data
  const dashboardStats = stats ? [
    {
      title: 'Today\'s Classes',
      value: stats.todaysClasses.toString(),
      change: stats.todaysClasses > 0 ? `+${stats.todaysClasses}` : '0',
      icon: Calendar,
      color: colors.primary[600],
      bgColor: colors.primary[50],
    },
    {
      title: 'Attendance',
      value: `${stats.attendancePercentage}%`,
      change: stats.attendancePercentage >= 90 ? '+Good' : stats.attendancePercentage >= 80 ? '+Fair' : 'Needs Improvement',
      icon: TrendingUp,
      color: stats.attendancePercentage >= 90 ? colors.success[600] : stats.attendancePercentage >= 80 ? colors.warning[600] : colors.error[600],
      bgColor: stats.attendancePercentage >= 90 ? colors.success[50] : stats.attendancePercentage >= 80 ? colors.warning[50] : colors.error[50],
    },
    {
      title: 'Assignments',
      value: stats.pendingAssignments.toString(),
      change: stats.pendingAssignments > 0 ? 'Due' : 'All Done',
      icon: Clock,
      color: stats.pendingAssignments > 0 ? colors.warning[600] : colors.success[600],
      bgColor: stats.pendingAssignments > 0 ? colors.warning[50] : colors.success[50],
    },
    {
      title: 'Achievements',
      value: stats.achievements.toString(),
      change: stats.achievements > 0 ? `+${stats.achievements}` : '0',
      icon: Award,
      color: colors.secondary[600],
      bgColor: colors.secondary[50],
    },
  ] : [];

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
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {dashboardStats.map((stat, index) => (
            <Card key={index} variant="elevated" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <View style={styles.statText}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={[styles.statChange, { color: stat.color }]}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient as [string, string, ...string[]]}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconContainer}>
                    <action.icon size={28} color={colors.text.inverse} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="elevated" style={styles.activityCard}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.success[50] }]}>
                    <CheckSquare size={16} color={colors.success[600]} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: colors.neutral[50] }]}>
                  <Activity size={16} color={colors.neutral[400]} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>No recent activity</Text>
                  <Text style={styles.activitySubtitle}>Your activity will appear here</Text>
                </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: (width - spacing.lg * 3) / 2,
    padding: spacing.lg,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  statChange: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: (width - spacing.lg * 3) / 2,
    height: 140,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  actionGradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  activityCard: {
    padding: spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
