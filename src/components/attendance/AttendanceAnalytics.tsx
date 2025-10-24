import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons, ProgressBar, Chip, DataTable } from 'react-native-paper';
import { BarChart3, TrendingUp, Users, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { useAttendance } from '@/src/contexts/AttendanceContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

export const AttendanceAnalytics: React.FC = () => {
  const { state, actions } = useAttendance();
  const { selectedClass } = useClassSelection();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  useEffect(() => {
    if (selectedClass?.id) {
      const endDate = new Date().toISOString().split('T')[0];
      let startDate: string;
      
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '90days':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      actions.loadAttendanceAnalytics(selectedClass.id, startDate, endDate);
    }
  }, [selectedClass?.id, selectedPeriod]);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return colors.success[600];
      case 'absent':
        return colors.error[600];
      case 'late':
        return colors.warning[600];
      case 'excused':
        return colors.info[600];
      default:
        return colors.text.secondary;
    }
  };

  if (!selectedClass) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>

              Please select a specific class to view attendance analytics.
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Analytics are available for individual classes only.
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (state.loading) {
    return (
      <View style={styles.container}>
        <Card style={styles.loadingCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading analytics...
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.errorText}>
              Error: {state.error}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!state.analytics) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No analytics data available.
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const { analytics } = state;

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <BarChart3 size={24} color={colors.primary[600]} />
            <Text variant="titleLarge" style={styles.title}>
              Attendance Analytics
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Grade {selectedClass.grade}-{selectedClass.section}
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.periodSelector}>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={[
            { value: '7days', label: '7 Days' },
            { value: '30days', label: '30 Days' },
            { value: '90days', label: '90 Days' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Users size={20} color={colors.primary[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {analytics.totalStudents}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Students
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <TrendingUp size={20} color={colors.success[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {formatPercentage(analytics.attendanceRate)}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Overall Rate
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <CheckCircle size={20} color={colors.success[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {analytics.presentCount}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Present
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <AlertCircle size={20} color={colors.error[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {analytics.absentCount}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Absent
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Attendance Rate Progress */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Overall Attendance Rate
            </Text>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={analytics.attendanceRate / 100}
                color={analytics.attendanceRate >= 90 ? colors.success[600] : 
                       analytics.attendanceRate >= 75 ? colors.warning[600] : colors.error[600]}
                style={styles.progressBar}
              />
              <Text variant="titleLarge" style={styles.progressText}>
                {formatPercentage(analytics.attendanceRate)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Status Distribution */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Status Distribution
            </Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { backgroundColor: colors.success[50] }]}
                  icon={() => <CheckCircle size={16} color={colors.success[600]} />}
                >
                  Present: {analytics.presentCount}
                </Chip>
              </View>
              <View style={styles.statusItem}>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { backgroundColor: colors.error[50] }]}
                  icon={() => <AlertCircle size={16} color={colors.error[600]} />}
                >
                  Absent: {analytics.absentCount}
                </Chip>
              </View>
              <View style={styles.statusItem}>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { backgroundColor: colors.warning[50] }]}
                  icon={() => <Clock size={16} color={colors.warning[600]} />}
                >
                  Late: {analytics.lateCount}
                </Chip>
              </View>
              <View style={styles.statusItem}>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { backgroundColor: colors.info[50] }]}
                  icon={() => <Calendar size={16} color={colors.info[600]} />}
                >
                  Excused: {analytics.excusedCount}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Student Performance Table */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Student Performance
            </Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Student</DataTable.Title>
                <DataTable.Title numeric>Present</DataTable.Title>
                <DataTable.Title numeric>Absent</DataTable.Title>
                <DataTable.Title numeric>Rate</DataTable.Title>
              </DataTable.Header>

              {analytics.studentStats.slice(0, 10).map((student) => (
                <DataTable.Row key={student.student_id}>
                  <DataTable.Cell>
                    <Text variant="bodyMedium" style={styles.studentName}>
                      {student.student_name}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text variant="bodyMedium" style={styles.presentCount}>
                      {student.presentDays}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text variant="bodyMedium" style={styles.absentCount}>
                      {student.absentDays}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text 
                      variant="bodyMedium" 
                      style={[
                        styles.rateText,
                        { color: student.attendanceRate >= 90 ? colors.success[600] : 
                                 student.attendanceRate >= 75 ? colors.warning[600] : colors.error[600] }
                      ]}
                    >
                      {formatPercentage(student.attendanceRate)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        {/* Daily Trends */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Recent Trends
            </Text>
            {analytics.dailyTrends.slice(-7).map((trend) => (
              <View key={trend.date} style={styles.trendItem}>
                <Text variant="bodySmall" style={styles.trendDate}>
                  {new Date(trend.date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </Text>
                <View style={styles.trendStats}>
                  <Text variant="bodySmall" style={styles.trendPresent}>
                    P: {trend.present}
                  </Text>
                  <Text variant="bodySmall" style={styles.trendAbsent}>
                    A: {trend.absent}
                  </Text>
                  <Text variant="bodySmall" style={styles.trendRate}>
                    {formatPercentage(trend.rate)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerCard: {
    margin: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['2'],
  },
  title: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  periodSelector: {
    paddingHorizontal: spacing['4'],
    marginBottom: spacing['4'],
  },
  segmentedButtons: {
    borderRadius: borderRadius.lg,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing['4'],
  },
  loadingCard: {
    margin: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  errorCard: {
    margin: spacing['4'],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  errorText: {
    color: colors.error[600],
  },
  emptyCard: {
    margin: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing['2'],
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
    marginBottom: spacing['4'],
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: spacing['3'],
  },
  summaryValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing['1'],
    marginBottom: spacing['1'],
  },
  summaryLabel: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  analyticsCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['3'],
  },
  progressContainer: {
    gap: spacing['2'],
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.md,
  },
  progressText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statusContainer: {
    gap: spacing['2'],
  },
  statusItem: {
    marginBottom: spacing['1'],
  },
  statusChip: {
    borderRadius: borderRadius.md,
  },
  studentName: {
    fontWeight: typography.fontWeight.medium,
  },
  presentCount: {
    color: colors.success[600],
    fontWeight: typography.fontWeight.medium,
  },
  absentCount: {
    color: colors.error[600],
    fontWeight: typography.fontWeight.medium,
  },
  rateText: {
    fontWeight: typography.fontWeight.bold,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['2'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  trendDate: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  trendStats: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  trendPresent: {
    color: colors.success[600],
    fontWeight: typography.fontWeight.medium,
  },
  trendAbsent: {
    color: colors.error[600],
    fontWeight: typography.fontWeight.medium,
  },
  trendRate: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
