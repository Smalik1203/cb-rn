import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Calendar, CheckSquare, DollarSign, BookOpen, Users, BarChart3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';
import { useProfile } from '@/src/hooks/useProfile';
import { useClass } from '@/src/hooks/useClasses';
import { Card, LoadingView, ErrorView } from '@/src/components/ui';

export default function DashboardScreen() {
  const router = useRouter();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { data: classData } = useClass(profile?.class_instance_id || undefined);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingView message="Loading dashboard..." />;
  }

  if (error || !profile) {
    return (
      <ErrorView
        message={error?.message || 'Failed to load your profile'}
        onRetry={() => refetch()}
      />
    );
  }

  const quickActions = [
    {
      title: 'Timetable',
      subtitle: 'View schedule',
      icon: Calendar,
      color: colors.primary[500],
      bgColor: colors.primary[50],
      route: '/timetable',
    },
    {
      title: 'Attendance',
      subtitle: 'Mark & track',
      icon: CheckSquare,
      color: colors.success[500],
      bgColor: colors.success[50],
      route: '/attendance',
    },
    {
      title: 'Fees',
      subtitle: 'Payments',
      icon: DollarSign,
      color: colors.warning[500],
      bgColor: colors.warning[50],
      route: '/fees',
    },
    {
      title: 'Resources',
      subtitle: 'Learning',
      icon: BookOpen,
      color: colors.info[500],
      bgColor: colors.info[50],
      route: '/resources',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.userName}>{profile.full_name}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {classData && (
          <Card style={styles.classCard}>
            <View style={styles.classHeader}>
              <View style={styles.classIconContainer}>
                <Users size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.classLabel}>Your Class</Text>
                <Text style={styles.className}>
                  Grade {classData.grade} - Section {classData.section}
                </Text>
              </View>
            </View>
          </Card>
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
                <View style={[styles.actionIconContainer, { backgroundColor: action.bgColor }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <Card>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: colors.primary[50] }]}>
                <Calendar size={20} color={colors.primary[600]} />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewLabel}>Classes Today</Text>
                <Text style={styles.overviewValue}>0</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: colors.success[50] }]}>
                <CheckSquare size={20} color={colors.success[600]} />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewLabel}>Attendance</Text>
                <Text style={styles.overviewValue}>-</Text>
              </View>
            </View>
          </Card>
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
  scrollContent: {
    padding: spacing.md,
  },
  classCard: {
    marginBottom: spacing.md,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  classInfo: {
    flex: 1,
  },
  classLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  className: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
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
    minWidth: 150,
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
  actionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  overviewContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  overviewValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.xs,
  },
});
