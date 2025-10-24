import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, SegmentedButtons, Chip, List, ActivityIndicator } from 'react-native-paper';
import { Users, UserPlus, Settings, Shield, BookOpen, Calendar, TrendingUp, Activity, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';
import { useUserStats, useRecentUsers } from '@/src/features/users/hooks/useUsers';
import { useClassStats, useClassesList } from '@/src/features/classes/hooks/useClasses';

export default function ManageScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'settings'>('users');
  const [refreshing, setRefreshing] = useState(false);

  const { data: userStats, isLoading: userStatsLoading, error: userStatsError, refetch: refetchUserStats } = useUserStats();
  const { data: recentUsers, isLoading: recentUsersLoading, error: recentUsersError, refetch: refetchRecentUsers } = useRecentUsers();
  const { data: classStats, isLoading: classStatsLoading, error: classStatsError, refetch: refetchClassStats } = useClassStats();
  const { data: classList, isLoading: classListLoading, error: classListError, refetch: refetchClassList } = useClassesList(0, 10);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'users') {
      await Promise.all([refetchUserStats(), refetchRecentUsers()]);
    } else if (activeTab === 'classes') {
      await Promise.all([refetchClassStats(), refetchClassList()]);
    }
    setRefreshing(false);
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

  const handleAddUser = () => {
    Alert.alert('Add User', 'User management functionality will be implemented soon.');
  };

  const handleAddClass = () => {
    Alert.alert('Add Class', 'Class management functionality will be implemented soon.');
  };

  if (activeTab === 'users' && userStatsError) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={colors.error[500]} />
        <Text variant="titleLarge" style={styles.errorTitle}>Unable to load user data</Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {userStatsError instanceof Error ? userStatsError.message : 'Something went wrong'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { refetchUserStats(); refetchRecentUsers(); }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (activeTab === 'classes' && classStatsError) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={colors.error[500]} />
        <Text variant="titleLarge" style={styles.errorTitle}>Unable to load class data</Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {classStatsError instanceof Error ? classStatsError.message : 'Something went wrong'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { refetchClassStats(); refetchClassList(); }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <LinearGradient
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text variant="headlineLarge" style={styles.title}>Manage</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {profile?.school_name || 'School Administration'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Activity size={32} color={colors.text.inverse} />
          </View>
        </View>
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'users' | 'classes' | 'settings')}
        buttons={[
          { value: 'users', label: 'Users', icon: 'account-group' },
          { value: 'classes', label: 'Classes', icon: 'school' },
          { value: 'settings', label: 'Settings', icon: 'cog' },
        ]}
        style={styles.tabs}
      />

      {activeTab === 'users' && (
        <>
          {userStatsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading user data...</Text>
            </View>
          ) : userStats ? (
            <>
              <View style={styles.summaryCard}>
                <LinearGradient
                  style={styles.summaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryIconContainer}>
                      <Users size={28} color={colors.text.inverse} />
                    </View>
                    <Text variant="titleLarge" style={styles.summaryTitle}>User Overview</Text>
                  </View>
                  
                  <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{userStats.total}</Text>
                      <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.primary[200] }]}>{userStats.students}</Text>
                      <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.success[500] }]}>{userStats.teachers}</Text>
                      <Text style={styles.statLabel}>Teachers</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.warning[500] }]}>{userStats.admins}</Text>
                      <Text style={styles.statLabel}>Admins</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="titleLarge" style={styles.cardTitle}>Recent Users</Text>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
                    <UserPlus size={20} color={colors.text.inverse} />
                    <Text style={styles.addButtonText}>Add User</Text>
                  </TouchableOpacity>
                </View>
                
                {recentUsersLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                  </View>
                ) : !recentUsers || recentUsers.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Users size={48} color={colors.neutral[400]} />
                    <Text variant="bodyMedium" style={styles.emptyText}>No users found</Text>
                  </View>
                ) : (
                  <View style={styles.userList}>
                    {recentUsers.map((user) => (
                      <TouchableOpacity key={user.id} style={styles.userItem}>
                        <View style={styles.userAvatar}>
                          {getRoleIcon(user.role)}
                        </View>
                        <View style={styles.userInfo}>
                          <Text variant="titleMedium" style={styles.userName}>{user.full_name}</Text>
                          <Text style={styles.userDetails}>
                            {user.role} {user.class_info ? `• ${user.class_info}` : ''}
                          </Text>
                          <Text style={styles.userDate}>
                            Joined {new Date(user.created_at).toLocaleDateString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.userStatus}>
                          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '15' }]}>
                            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                              {user.role.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}
        </>
      )}

      {activeTab === 'classes' && (
        <>
          {classStatsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading class data...</Text>
            </View>
          ) : classStats ? (
            <>
              <View style={styles.summaryCard}>
                <LinearGradient
                  style={styles.summaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryIconContainer}>
                      <BookOpen size={28} color={colors.text.inverse} />
                    </View>
                    <Text variant="titleLarge" style={styles.summaryTitle}>Class Overview</Text>
                  </View>
                  
                  <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{classStats.total}</Text>
                      <Text style={styles.statLabel}>Total Classes</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.success[500] }]}>{classStats.active}</Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.primary[200] }]}>{classStats.students}</Text>
                      <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.warning[500] }]}>{classStats.teachers}</Text>
                      <Text style={styles.statLabel}>Teachers</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="titleLarge" style={styles.cardTitle}>Class List</Text>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddClass}>
                    <UserPlus size={20} color={colors.text.inverse} />
                    <Text style={styles.addButtonText}>Add Class</Text>
                  </TouchableOpacity>
                </View>
                
                {classListLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                  </View>
                ) : !classList || classList.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <BookOpen size={48} color={colors.neutral[400]} />
                    <Text variant="bodyMedium" style={styles.emptyText}>No classes found</Text>
                  </View>
                ) : (
                  <View style={styles.classList}>
                    {classList.map((classItem) => (
                      <TouchableOpacity key={classItem.id} style={styles.classItem}>
                        <View style={styles.classIcon}>
                          <Calendar size={24} color={colors.primary[500]} />
                        </View>
                        <View style={styles.classInfo}>
                          <Text variant="titleMedium" style={styles.className}>
                            Grade {classItem.grade}-{classItem.section}
                          </Text>
                          <Text style={styles.classDetails}>
                            {classItem.student_count} students
                          </Text>
                          {classItem.class_teacher_name && (
                            <Text style={styles.classTeacher}>
                              Teacher: {classItem.class_teacher_name}
                            </Text>
                          )}
                        </View>
                        <View style={styles.classActions}>
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>ACTIVE</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}
        </>
      )}

      {activeTab === 'settings' && (
        <View style={styles.card}>
          <Text variant="titleLarge" style={styles.cardTitle}>School Settings</Text>
          
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Settings', 'School settings functionality will be implemented soon.')}>
              <View style={styles.settingIcon}>
                <Shield size={24} color={colors.primary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="titleMedium" style={styles.settingTitle}>School Information</Text>
                <Text style={styles.settingDescription}>Update school details and contact information</Text>
              </View>
              <View style={styles.settingArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Settings', 'Academic year settings functionality will be implemented soon.')}>
              <View style={styles.settingIcon}>
                <Calendar size={24} color={colors.success[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="titleMedium" style={styles.settingTitle}>Academic Year</Text>
                <Text style={styles.settingDescription}>Manage academic year and terms</Text>
              </View>
              <View style={styles.settingArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Settings', 'Curriculum settings functionality will be implemented soon.')}>
              <View style={styles.settingIcon}>
                <BookOpen size={24} color={colors.secondary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="titleMedium" style={styles.settingTitle}>Subjects & Curriculum</Text>
                <Text style={styles.settingDescription}>Configure subjects and curriculum</Text>
              </View>
              <View style={styles.settingArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Settings', 'Fee structure settings functionality will be implemented soon.')}>
              <View style={styles.settingIcon}>
                <TrendingUp size={24} color={colors.warning[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="titleMedium" style={styles.settingTitle}>Fee Structure</Text>
                <Text style={styles.settingDescription}>Manage fee components and structure</Text>
              </View>
              <View style={styles.settingArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Settings', 'Notification settings functionality will be implemented soon.')}>
              <View style={styles.settingIcon}>
                <Settings size={24} color={colors.error[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="titleMedium" style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>Configure notification preferences</Text>
              </View>
              <View style={styles.settingArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: spacing['12'],
    paddingBottom: spacing['8'],
    paddingHorizontal: spacing['6'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
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
  title: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['1'],
  },
  subtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
  tabs: {
    margin: spacing['6'],
    marginBottom: spacing['2'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  summaryCard: {
    margin: spacing['6'],
    marginBottom: spacing['3'],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  summaryGradient: {
    padding: spacing['6'],
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing['3'],
  },
  summaryTitle: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing['1'],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    opacity: 0.8,
    fontWeight: typography.fontWeight.medium,
  },
  card: {
    margin: spacing['6'],
    marginBottom: spacing['3'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius['2xl'],
    padding: spacing['6'],
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  cardTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['4'],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  addButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing['2'],
  },
  userList: {
    gap: spacing['3'],
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['4'],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing['4'],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  userDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing['0.5'],
  },
  userDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  userStatus: {
    marginLeft: spacing['4'],
  },
  roleBadge: {
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['3'],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  classList: {
    gap: spacing['3'],
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['4'],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing['4'],
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  classDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing['0.5'],
  },
  classTeacher: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  classActions: {
    marginLeft: spacing['4'],
  },
  activeBadge: {
    backgroundColor: colors.success[500] + '20',
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['3'],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: {
    color: colors.success[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  settingsList: {
    gap: spacing['2'],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['4'],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing['4'],
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['0.5'],
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  settingArrow: {
    marginLeft: spacing['4'],
  },
  arrowText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.bold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['20'],
    marginTop: spacing['12'],
  },
  loadingText: {
    marginTop: spacing['4'],
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['8'],
    backgroundColor: colors.background.secondary,
  },
  errorTitle: {
    marginTop: spacing['6'],
    marginBottom: spacing['2'],
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['8'],
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['3'],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['12'],
  },
  emptyText: {
    marginTop: spacing['4'],
    color: colors.text.secondary,
  },
});
