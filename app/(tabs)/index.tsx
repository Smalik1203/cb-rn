import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Calendar, CheckSquare, DollarSign, BarChart3, BookOpen, Clock, TrendingUp, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';
import { useDashboardStats } from '@/src/features/dashboard/hooks/useDashboardStats';
import { ScopeSelector } from '@/src/components/common/ScopeSelector';

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: 'Timetable',
      description: 'View schedule',
      icon: Calendar,
      color: colors.primary[500],
      route: '/timetable',
    },
    {
      title: 'Attendance',
      description: 'Mark & view',
      icon: CheckSquare,
      color: colors.success[500],
      route: '/attendance',
    },
    {
      title: 'Fees',
      description: 'Payments',
      icon: DollarSign,
      color: colors.warning[500],
      route: '/fees',
    },
    {
      title: 'Resources',
      description: 'Learning',
      icon: BookOpen,
      color: colors.info[500],
      route: '/resources',
    },
  ];

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error[500]} />
        <Text style={styles.errorTitle}>Unable to load dashboard</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Something went wrong'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day</Text>
          <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.scopeContainer}>
          <ScopeSelector compact={true} />
        </View>

        {!isLoading && stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success[50] }]}>
                <TrendingUp size={24} color={colors.success[600]} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.todayAttendance}%</Text>
                <Text style={styles.statLabel}>Today's Attendance</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary[50] }]}>
                <BookOpen size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.totalClasses}</Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.info[50] }]}>
                <BarChart3 size={24} color={colors.info[600]} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>Grade {stats.currentGrade}</Text>
                <Text style={styles.statLabel}>Current Level</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '15' }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.success[50] }]}>
                <Clock size={18} color={colors.success[600]} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Attendance Marked</Text>
                <Text style={styles.activityTime}>Today at 9:00 AM</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary[50] }]}>
                <Calendar size={18} color={colors.primary[600]} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Timetable Updated</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
            </View>
          </View>
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
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  roleBadge: {
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  scrollView: {
    flex: 1,
  },
  scopeContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  statsContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '48%',
    ...shadows.sm,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  activityCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.app,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});
