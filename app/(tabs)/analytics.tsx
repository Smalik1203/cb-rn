import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons, ProgressBar } from 'react-native-paper';
import { BarChart3, TrendingUp, Users, BookOpen, CheckSquare } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClassSelection } from '../../src/contexts/ClassSelectionContext';
import { ClassSelector } from '../../src/components/ClassSelector';
import { colors, typography, spacing, borderRadius } from '../../lib/design-system';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { DB } from '../../src/types/db.constants';

interface AnalyticsData {
  totalStudents: number;
  totalClasses: number;
  attendanceRate: number;
  recentActivity: number;
  topPerformingStudents: {
    id: string;
    name: string;
    attendanceRate: number;
  }[];
  classStats: {
    className: string;
    attendanceRate: number;
    totalStudents: number;
  }[];
}

export default function AnalyticsScreen() {
  const { profile } = useAuth();
  const { selectedClass } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  const role = profile?.role;
  const canViewAnalytics = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics', selectedClass?.id, profile?.school_code],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!profile?.school_code) throw new Error('No school selected');

      // Get total students
      const { data: studentsData, error: studentsError } = await supabase
        .from(DB.tables.student)
        .select('id')
        .eq('school_code', profile.school_code);
      
      if (studentsError) throw studentsError;

      // Get total classes
      const { data: classesData, error: classesError } = await supabase
        .from(DB.tables.classInstances)
        .select('id')
        .eq('school_code', profile.school_code);
      
      if (classesError) throw classesError;

      // Get attendance rate (simplified calculation)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from(DB.tables.attendance)
        .select('status')
        .eq('school_code', profile.school_code);
      
      if (attendanceError) throw attendanceError;

      const totalAttendance = attendanceData.length;
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Get top performing students (simplified)
      const topPerformingStudents = studentsData?.slice(0, 5).map((student, index) => ({
        id: student.id,
        name: `Student ${index + 1}`,
        attendanceRate: Math.floor(Math.random() * 20) + 80, // Mock data for now
      })) || [];

      // Get class stats
      const classStats = classesData?.slice(0, 3).map((cls, index) => ({
        className: `Class ${index + 1}`,
        attendanceRate: Math.floor(Math.random() * 20) + 80, // Mock data for now
        totalStudents: Math.floor(Math.random() * 20) + 20,
      })) || [];

      return {
        totalStudents: studentsData?.length || 0,
        totalClasses: classesData?.length || 0,
        attendanceRate,
        recentActivity: Math.floor(Math.random() * 50) + 20, // Mock data
        topPerformingStudents,
        classStats,
      };
    },
    enabled: canViewAnalytics && !!profile?.school_code,
  });

  if (!canViewAnalytics) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <BarChart3 size={32} color={colors.text.inverse} />
              </View>
              <View>
                <Text variant="headlineSmall" style={styles.headerTitle}>
                  Analytics
                </Text>
                <Text variant="bodyLarge" style={styles.headerSubtitle}>
                  Access restricted to administrators
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.restrictedContainer}>
          <BarChart3 size={64} color={colors.text.tertiary} />
          <Text variant="titleLarge" style={styles.restrictedTitle}>Access Restricted</Text>
          <Text variant="bodyMedium" style={styles.restrictedMessage}>
            Analytics dashboard is only available to administrators.
          </Text>
        </View>
      </View>
    );
  }

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: colors.primary[50] }]}>
                <Users size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.metricText}>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.totalStudents}
                </Text>
                <Text variant="bodyMedium" style={styles.metricLabel}>
                  Total Students
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: colors.success[50] }]}>
                <BookOpen size={24} color={colors.success[600]} />
              </View>
              <View style={styles.metricText}>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.totalClasses}
                </Text>
                <Text variant="bodyMedium" style={styles.metricLabel}>
                  Total Classes
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: colors.warning[50] }]}>
                <CheckSquare size={24} color={colors.warning[600]} />
              </View>
              <View style={styles.metricText}>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.attendanceRate}%
                </Text>
                <Text variant="bodyMedium" style={styles.metricLabel}>
                  Attendance Rate
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: colors.info[50] }]}>
                <TrendingUp size={24} color={colors.info[600]} />
              </View>
              <View style={styles.metricText}>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.recentActivity}
                </Text>
                <Text variant="bodyMedium" style={styles.metricLabel}>
                  Recent Activity
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Top Performing Students */}
        <Card style={styles.sectionCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Top Performing Students</Text>
          {analyticsData.topPerformingStudents.map((student, index) => (
            <View key={student.id} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text variant="bodyMedium" style={styles.studentName}>{student.name}</Text>
                <Text variant="bodySmall" style={styles.studentAttendance}>
                  {student.attendanceRate}% attendance
                </Text>
              </View>
              <View style={styles.studentProgress}>
                <ProgressBar 
                  progress={student.attendanceRate / 100} 
                  color={student.attendanceRate >= 90 ? colors.success[600] : colors.warning[600]}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Class Statistics */}
        <Card style={styles.sectionCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Class Statistics</Text>
          {analyticsData.classStats.map((cls, index) => (
            <View key={index} style={styles.classRow}>
              <View style={styles.classInfo}>
                <Text variant="bodyMedium" style={styles.className}>{cls.className}</Text>
                <Text variant="bodySmall" style={styles.classStudents}>
                  {cls.totalStudents} students
                </Text>
              </View>
              <View style={styles.classProgress}>
                <ProgressBar 
                  progress={cls.attendanceRate / 100} 
                  color={cls.attendanceRate >= 90 ? colors.success[600] : colors.warning[600]}
                />
                <Text variant="bodySmall" style={styles.classAttendance}>
                  {cls.attendanceRate}%
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    );
  };

  const renderDetailedTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Detailed Analytics</Text>
          <Text variant="bodyMedium" style={styles.comingSoonText}>
            Detailed analytics including charts, trends, and advanced metrics will be available in the next update.
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
              <BarChart3 size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Analytics
              </Text>
              <Text variant="bodyLarge" style={styles.headerSubtitle}>
                School performance and insights
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ClassSelector />

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'overview' | 'detailed')}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'detailed', label: 'Detailed' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading analytics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load analytics</Text>
          </View>
        ) : (
          activeTab === 'overview' ? renderOverviewTab() : renderDetailedTab()
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    color: colors.error[600],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: '48%',
    padding: spacing.lg,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  metricText: {
    flex: 1,
  },
  metricValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  metricLabel: {
    color: colors.text.secondary,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  studentInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  studentName: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  studentAttendance: {
    color: colors.text.secondary,
  },
  studentProgress: {
    width: 100,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  classInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  className: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  classStudents: {
    color: colors.text.secondary,
  },
  classProgress: {
    width: 100,
    alignItems: 'flex-end',
  },
  classAttendance: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  comingSoonText: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});