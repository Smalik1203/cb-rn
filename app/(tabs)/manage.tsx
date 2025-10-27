import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, SegmentedButtons, Chip, List, ActivityIndicator } from 'react-native-paper';
import { Users, UserPlus, Settings, Shield, BookOpen, Calendar, TrendingUp, Activity, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/design-system';
import { useClasses } from '../../src/hooks/useClasses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { DB } from '../../src/types/db.constants';

interface UserStats {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
}

interface ClassStats {
  totalClasses: number;
  activeClasses: number;
  totalStudents: number;
}

export default function ManageScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'settings'>('users');
  const [refreshing, setRefreshing] = useState(false);

  const role = profile?.role || 'student';
  const canManage = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  if (!canManage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Users size={32} color={colors.text.inverse} />
              </View>
              <View>
                <Text variant="headlineSmall" style={styles.headerTitle}>
                  Management
                </Text>
                <Text variant="bodyLarge" style={styles.headerSubtitle}>
                  Access restricted to administrators
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.restrictedContainer}>
          <Shield size={64} color={colors.text.tertiary} />
          <Text variant="titleLarge" style={styles.restrictedTitle}>Access Restricted</Text>
          <Text variant="bodyMedium" style={styles.restrictedMessage}>
            Management features are only available to administrators.
          </Text>
        </View>
      </View>
    );
  }

  // Fetch user statistics
  const { data: userStats, isLoading: userStatsLoading, error: userStatsError, refetch: refetchUserStats } = useQuery({
    queryKey: ['user-stats', profile?.school_code],
    queryFn: async (): Promise<UserStats> => {
      if (!profile?.school_code) throw new Error('No school selected');

      const { data: studentsData, error: studentsError } = await supabase
        .from(DB.tables.student)
        .select('id')
        .eq('school_code', profile.school_code);
      
      if (studentsError) throw studentsError;

      const { data: adminsData, error: adminsError } = await supabase
        .from(DB.tables.admin)
        .select('id, role')
        .eq('school_code', profile.school_code);
      
      if (adminsError) throw adminsError;

      const teachers = adminsData?.filter(admin => admin.role === 'teacher').length || 0;
      const admins = adminsData?.filter(admin => admin.role === 'admin').length || 0;

      return {
        totalUsers: (studentsData?.length || 0) + (adminsData?.length || 0),
        students: studentsData?.length || 0,
        teachers,
        admins,
      };
    },
    enabled: !!profile?.school_code,
  });

  // Fetch class statistics
  const { data: classStats, isLoading: classStatsLoading, error: classStatsError, refetch: refetchClassStats } = useQuery({
    queryKey: ['class-stats', profile?.school_code],
    queryFn: async (): Promise<ClassStats> => {
      if (!profile?.school_code) throw new Error('No school selected');

      const { data: classesData, error: classesError } = await supabase
        .from(DB.tables.classInstances)
        .select('id')
        .eq('school_code', profile.school_code);
      
      if (classesError) throw classesError;

      const { data: studentsData, error: studentsError } = await supabase
        .from(DB.tables.student)
        .select('id')
        .eq('school_code', profile.school_code);
      
      if (studentsError) throw studentsError;

      return {
        totalClasses: classesData?.length || 0,
        activeClasses: classesData?.length || 0, // Assuming all classes are active for now
        totalStudents: studentsData?.length || 0,
      };
    },
    enabled: !!profile?.school_code,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserStats(),
        refetchClassStats(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return <Users size={16} color="#667eea" />;
      case 'teacher':
        return <BookOpen size={16} color="#10b981" />;
      case 'admin':
        return <Shield size={16} color="#f59e0b" />;
      default:
        return <Users size={16} color="#6b7280" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return '#667eea';
      case 'teacher':
        return '#10b981';
      case 'admin':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const renderUsersTab = () => {
    if (userStatsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading user statistics...</Text>
        </View>
      );
    }

    if (userStatsError) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error[500]} />
          <Text variant="titleLarge" style={styles.errorTitle}>Unable to load user data</Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {userStatsError instanceof Error ? userStatsError.message : 'Something went wrong'}
          </Text>
          <Button mode="contained" onPress={() => refetchUserStats()} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* User Statistics */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary[50] }]}>
                <Users size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {userStats?.totalUsers || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Total Users
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
                <Users size={24} color={colors.success[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {userStats?.students || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Students
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning[50] }]}>
                <BookOpen size={24} color={colors.warning[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {userStats?.teachers || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Teachers
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.error[50] }]}>
                <Shield size={24} color={colors.error[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {userStats?.admins || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Admins
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* User Management Actions */}
        <Card style={styles.actionCard}>
          <Text variant="titleMedium" style={styles.actionTitle}>User Management</Text>
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              icon={() => <UserPlus size={20} color={colors.text.inverse} />}
              style={styles.actionButton}
              onPress={() => {/* TODO: Implement add user */}}
            >
              Add User
            </Button>
            <Button 
              mode="outlined" 
              icon={() => <Users size={20} color={colors.primary[600]} />}
              style={styles.actionButton}
              onPress={() => {/* TODO: Implement view users */}}
            >
              View Users
            </Button>
          </View>
        </Card>
      </View>
    );
  };

  const renderClassesTab = () => {
    if (classStatsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading class statistics...</Text>
        </View>
      );
    }

    if (classStatsError) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error[500]} />
          <Text variant="titleLarge" style={styles.errorTitle}>Unable to load class data</Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {classStatsError instanceof Error ? classStatsError.message : 'Something went wrong'}
          </Text>
          <Button mode="contained" onPress={() => refetchClassStats()} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Class Statistics */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary[50] }]}>
                <BookOpen size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {classStats?.totalClasses || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Total Classes
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
                <Activity size={24} color={colors.success[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {classStats?.activeClasses || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Active Classes
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning[50] }]}>
                <Users size={24} color={colors.warning[600]} />
              </View>
              <View style={styles.statText}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {classStats?.totalStudents || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Total Students
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Class Management Actions */}
        <Card style={styles.actionCard}>
          <Text variant="titleMedium" style={styles.actionTitle}>Class Management</Text>
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              icon={() => <BookOpen size={20} color={colors.text.inverse} />}
              style={styles.actionButton}
              onPress={() => {/* TODO: Implement add class */}}
            >
              Add Class
            </Button>
            <Button 
              mode="outlined" 
              icon={() => <Calendar size={20} color={colors.primary[600]} />}
              style={styles.actionButton}
              onPress={() => {/* TODO: Implement manage classes */}}
            >
              Manage Classes
            </Button>
          </View>
        </Card>
      </View>
    );
  };

  const renderSettingsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card style={styles.actionCard}>
          <Text variant="titleMedium" style={styles.actionTitle}>School Settings</Text>
          <Text variant="bodyMedium" style={styles.comingSoonText}>
            School settings and configuration options will be available in the next update.
          </Text>
        </Card>

        <Card style={styles.actionCard}>
          <Text variant="titleMedium" style={styles.actionTitle}>Academic Settings</Text>
          <Text variant="bodyMedium" style={styles.comingSoonText}>
            Academic year, curriculum, and fee structure settings will be available in the next update.
          </Text>
        </Card>

        <Card style={styles.actionCard}>
          <Text variant="titleMedium" style={styles.actionTitle}>System Settings</Text>
          <Text variant="bodyMedium" style={styles.comingSoonText}>
            Notification preferences and system configuration will be available in the next update.
          </Text>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Users size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Management
              </Text>
              <Text variant="bodyLarge" style={styles.headerSubtitle}>
                User and class management
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'users' | 'classes' | 'settings')}
          buttons={[
            { value: 'users', label: 'Users' },
            { value: 'classes', label: 'Classes' },
            { value: 'settings', label: 'Settings' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'classes' && renderClassesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  restrictedTitle: {
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  restrictedMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  tabContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  segmentedButtons: {
    backgroundColor: colors.surface.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorTitle: {
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    padding: spacing.lg,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    color: colors.text.secondary,
  },
  actionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  comingSoonText: {
    color: colors.text.secondary,
    lineHeight: 24,
  },
});