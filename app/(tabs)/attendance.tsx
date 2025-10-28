import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { CheckSquare, TrendingUp, Users, Calendar, Clock, Award } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClassSelection } from '../../src/contexts/ClassSelectionContext';
import { ClassSelector } from '../../src/components/ClassSelector';
import { UnifiedAttendance } from '../../src/components/attendance/UnifiedAttendance';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/design-system';
import { Card, Badge, Avatar, Button } from '../../src/components/ui';
import { ThreeStateView } from '../../src/components/common/ThreeStateView';
import { LinearGradient } from 'expo-linear-gradient';
import { useClassAttendance } from '../../src/hooks/useAttendance';
import { log } from '../../src/lib/logger';

const { width } = Dimensions.get('window');

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const { isSuperAdmin, selectedClass } = useClassSelection();
  const role = profile?.role;
  const canMark = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  // Fetch attendance data for stats
  const { data: attendanceData, isLoading, error, refetch } = useClassAttendance(
    selectedClass?.id,
    new Date().toISOString().split('T')[0]
  );

  // Calculate stats from real data
  const presentCount = attendanceData?.filter(record => record.status === 'present').length || 0;
  const absentCount = attendanceData?.filter(record => record.status === 'absent').length || 0;
  const totalStudents = (attendanceData?.length || 0);
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const attendanceStats = [
    {
      title: 'Present Today',
      value: presentCount.toString(),
      change: '+0',
      icon: Users,
      color: colors.success[600],
      bgColor: colors.success[50],
    },
    {
      title: 'Absent Today',
      value: absentCount.toString(),
      change: '+0',
      icon: Clock,
      color: colors.error[600],
      bgColor: colors.error[50],
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceRate}%`,
      change: '+0%',
      icon: TrendingUp,
      color: colors.primary[600],
      bgColor: colors.primary[50],
    },
    {
      title: 'Total Students',
      value: totalStudents.toString(),
      change: '+0',
      icon: Award,
      color: colors.warning[600],
      bgColor: colors.warning[50],
    },
  ];

  return (
    <ThreeStateView
      state={
        !selectedClass?.id 
          ? 'empty' 
          : isLoading 
            ? 'loading' 
            : error 
              ? 'error' 
              : 'success'
      }
      loadingMessage="Loading attendance data..."
      errorMessage="Failed to load attendance data"
      errorDetails={error?.message}
      emptyMessage={
        !selectedClass?.id 
          ? "Please select a class to view attendance"
          : "No attendance data available"
      }
      onRetry={refetch}
    >
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={colors.gradient.success as [string, string, ...string[]]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <CheckSquare size={32} color={colors.text.inverse} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Attendance</Text>
              <Text style={styles.headerSubtitle}>
                {canMark ? 'Mark and track attendance' : 'View your attendance'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Badge variant="success" size="sm" style={styles.statusBadge}>
              Live
            </Badge>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Class Selector */}
        <View style={styles.selectorContainer}>
          <ClassSelector />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {attendanceStats.map((stat, index) => (
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

        {/* Content */}
        <View style={styles.contentContainer}>
          <UnifiedAttendance />
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
  header: {
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  selectorContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
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
  tabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tabCard: {
    padding: spacing.sm,
  },
  tabButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.success[50],
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.success[700],
    fontWeight: typography.fontWeight.semibold,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for tab bar
  },
});
