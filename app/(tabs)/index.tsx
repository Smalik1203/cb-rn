import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, CheckSquare, DollarSign, BarChart3, Users, BookOpen, TrendingUp, Activity, AlertCircle, Clock, User, School } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows, gradients } from '@/lib/design-system';
import { useDashboardStats } from '@/src/features/dashboard/hooks/useDashboardStats';
import { ScopeSelector } from '@/src/components/common/ScopeSelector';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { profile } = useAuth();
  const { scope } = useAppScope();
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
      description: 'Daily Schedule',
      icon: Calendar,
      color: '#3B82F6',
      onPress: () => router.push('/timetable'),
    },
    {
      title: 'Attendance',
      description: 'Mark & View',
      icon: CheckSquare,
      color: '#10B981',
      onPress: () => router.push('/attendance'),
    },
    {
      title: 'Fees',
      description: 'Payment Details',
      icon: DollarSign,
      color: '#F59E0B',
      onPress: () => router.push('/fees'),
    },
    {
      title: 'Analytics',
      description: 'Performance',
      icon: BarChart3,
      color: '#8B5CF6',
      onPress: () => router.push('/analytics'),
    },
  ];

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={colors.error} />
        <Text variant="titleLarge" style={styles.errorTitle}>Unable to load dashboard</Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
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
      {/* Modern Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Good Morning!</Text>
            <Text style={styles.welcomeSubtitle}>{profile?.full_name || 'User'}</Text>
            <View style={styles.roleContainer}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
              </View>
              <View style={styles.schoolInfo}>
                <School size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.schoolText}>{profile?.school_name}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerIcon}>
            <User size={32} color="white" />
          </View>
        </View>
      </LinearGradient>

      {/* Scope Selector for Admins */}
      <View style={styles.scopeSelectorContainer}>
        <ScopeSelector compact={true} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Cards - Mobile Vertical Layout */}
        {!isLoading && stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
                <CheckSquare size={20} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.todayAttendance}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
                <BookOpen size={20} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.totalClasses}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF6' }]}>
                <TrendingUp size={20} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.currentGrade}</Text>
                <Text style={styles.statLabel}>Grade</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions - Mobile Vertical Layout */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <action.icon size={20} color={action.color} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Surface style={styles.activityCard} elevation={2}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
                <Clock size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Last Attendance Marked</Text>
                <Text style={styles.activitySubtitle}>October 21, 2025</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#3B82F6' }]}>
                <Calendar size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Timetable Updated</Text>
                <Text style={styles.activitySubtitle}>October 17, 2025</Text>
              </View>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeSelectorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  schoolText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
  },
  errorTitle: {
    marginTop: 24,
    marginBottom: 8,
    color: '#1F2937',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
