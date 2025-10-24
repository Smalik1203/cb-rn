import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons, ProgressBar, Chip, DataTable, ActivityIndicator } from 'react-native-paper';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { useAnalytics } from '@/src/contexts/AnalyticsContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

export const AnalyticsDashboard: React.FC = () => {
  const { state, actions } = useAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
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
    
    actions.loadAttendanceAnalytics(startDate, endDate);
    actions.loadFeeAnalytics(startDate, endDate);
  }, [selectedPeriod]);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (rate: number, type: 'attendance' | 'fee') => {
    if (type === 'attendance') {
      return rate >= 90 ? colors.success[600] : 
             rate >= 75 ? colors.warning[600] : colors.error[600];
    } else {
      return rate >= 80 ? colors.success[600] : 
             rate >= 60 ? colors.warning[600] : colors.error[600];
    }
  };

  if (state.loading) {
    return (
      <View style={styles.container}>
        <Card style={styles.loadingCard}>
          <Card.Content>
            <ActivityIndicator size="large" color={colors.primary[500]} />
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

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <BarChart3 size={24} color={colors.primary[600]} />
            <Text variant="titleLarge" style={styles.title}>
              Analytics Dashboard
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Comprehensive insights and performance metrics
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.controlsContainer}>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={[
            { value: '7days', label: '7 Days' },
            { value: '30days', label: '30 Days' },
            { value: '90days', label: '90 Days' },
          ]}
          style={styles.periodButtons}
        />
        
        <SegmentedButtons
          value={selectedMetric}
          onValueChange={setSelectedMetric}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'attendance', label: 'Attendance' },
            { value: 'fees', label: 'Fees' },
          ]}
          style={styles.metricButtons}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Dashboard Stats */}
        {state.dashboardStats && (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Users size={20} color={colors.primary[600]} />
                <Text variant="titleLarge" style={styles.statValue}>
                  {state.dashboardStats.totalStudents}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Students
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <CheckCircle size={20} color={colors.success[600]} />
                <Text variant="titleLarge" style={styles.statValue}>
                  {formatPercentage(state.dashboardStats.attendanceRate)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Attendance Rate
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <DollarSign size={20} color={colors.info[600]} />
                <Text variant="titleLarge" style={styles.statValue}>
                  {formatPercentage(state.dashboardStats.feeCollectionRate)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Fee Collection
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Calendar size={20} color={colors.warning[600]} />
                <Text variant="titleLarge" style={styles.statValue}>
                  {formatPercentage(state.dashboardStats.todayAttendance)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Today's Attendance
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Attendance Analytics */}
        {selectedMetric === 'attendance' && state.attendanceAnalytics && (
          <View>
            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Overall Attendance Rate
                </Text>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={state.attendanceAnalytics.overallRate / 100}
                    color={getStatusColor(state.attendanceAnalytics.overallRate, 'attendance')}
                    style={styles.progressBar}
                  />
                  <Text variant="titleLarge" style={styles.progressText}>
                    {formatPercentage(state.attendanceAnalytics.overallRate)}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Class Comparison
                </Text>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Class</DataTable.Title>
                    <DataTable.Title numeric>Students</DataTable.Title>
                    <DataTable.Title numeric>Rate</DataTable.Title>
                  </DataTable.Header>

                  {state.attendanceAnalytics.classComparison.slice(0, 5).map((cls) => (
                    <DataTable.Row key={cls.classId}>
                      <DataTable.Cell>
                        <Text variant="bodyMedium" style={styles.className}>
                          {cls.className}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text variant="bodyMedium" style={styles.studentCount}>
                          {cls.totalStudents}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text 
                          variant="bodyMedium" 
                          style={[
                            styles.rateText,
                            { color: getStatusColor(cls.attendanceRate, 'attendance') }
                          ]}
                        >
                          {formatPercentage(cls.attendanceRate)}
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>

            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Recent Trends
                </Text>
                {state.attendanceAnalytics.dailyTrends.slice(-7).map((trend) => (
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
          </View>
        )}

        {/* Fee Analytics */}
        {selectedMetric === 'fees' && state.feeAnalytics && (
          <View>
            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Fee Collection Overview
                </Text>
                <View style={styles.feeOverview}>
                  <View style={styles.feeItem}>
                    <Text variant="bodySmall" style={styles.feeLabel}>Total Due</Text>
                    <Text variant="titleMedium" style={styles.feeValue}>
                      {formatCurrency(state.feeAnalytics.totalDue)}
                    </Text>
                  </View>
                  <View style={styles.feeItem}>
                    <Text variant="bodySmall" style={styles.feeLabel}>Collected</Text>
                    <Text variant="titleMedium" style={[styles.feeValue, { color: colors.success[600] }]}>
                      {formatCurrency(state.feeAnalytics.totalCollected)}
                    </Text>
                  </View>
                  <View style={styles.feeItem}>
                    <Text variant="bodySmall" style={styles.feeLabel}>Pending</Text>
                    <Text variant="titleMedium" style={[styles.feeValue, { color: colors.warning[600] }]}>
                      {formatCurrency(state.feeAnalytics.pendingAmount)}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={state.feeAnalytics.collectionRate / 100}
                    color={getStatusColor(state.feeAnalytics.collectionRate, 'fee')}
                    style={styles.progressBar}
                  />
                  <Text variant="titleLarge" style={styles.progressText}>
                    {formatPercentage(state.feeAnalytics.collectionRate)}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Class Fee Performance
                </Text>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Class</DataTable.Title>
                    <DataTable.Title numeric>Due</DataTable.Title>
                    <DataTable.Title numeric>Collected</DataTable.Title>
                    <DataTable.Title numeric>Rate</DataTable.Title>
                  </DataTable.Header>

                  {state.feeAnalytics.classComparison.slice(0, 5).map((cls) => (
                    <DataTable.Row key={cls.classId}>
                      <DataTable.Cell>
                        <Text variant="bodyMedium" style={styles.className}>
                          {cls.className}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text variant="bodyMedium" style={styles.feeAmount}>
                          {formatCurrency(cls.totalDue)}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text variant="bodyMedium" style={[styles.feeAmount, { color: colors.success[600] }]}>
                          {formatCurrency(cls.totalCollected)}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text 
                          variant="bodyMedium" 
                          style={[
                            styles.rateText,
                            { color: getStatusColor(cls.collectionRate, 'fee') }
                          ]}
                        >
                          {formatPercentage(cls.collectionRate)}
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Overview */}
        {selectedMetric === 'overview' && (
          <View>
            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Key Performance Indicators
                </Text>
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiItem}>
                    <TrendingUp size={24} color={colors.primary[600]} />
                    <Text variant="titleMedium" style={styles.kpiValue}>
                      {state.dashboardStats?.attendanceRate ? formatPercentage(state.dashboardStats.attendanceRate) : '0%'}
                    </Text>
                    <Text variant="bodySmall" style={styles.kpiLabel}>
                      Attendance Rate
                    </Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <DollarSign size={24} color={colors.success[600]} />
                    <Text variant="titleMedium" style={styles.kpiValue}>
                      {state.dashboardStats?.feeCollectionRate ? formatPercentage(state.dashboardStats.feeCollectionRate) : '0%'}
                    </Text>
                    <Text variant="bodySmall" style={styles.kpiLabel}>
                      Fee Collection
                    </Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Users size={24} color={colors.info[600]} />
                    <Text variant="titleMedium" style={styles.kpiValue}>
                      {state.dashboardStats?.totalStudents || 0}
                    </Text>
                    <Text variant="bodySmall" style={styles.kpiLabel}>
                      Total Students
                    </Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <AlertCircle size={24} color={colors.warning[600]} />
                    <Text variant="titleMedium" style={styles.kpiValue}>
                      {state.dashboardStats?.pendingFees ? formatCurrency(state.dashboardStats.pendingFees) : '₹0'}
                    </Text>
                    <Text variant="bodySmall" style={styles.kpiLabel}>
                      Pending Fees
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
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
  controlsContainer: {
    paddingHorizontal: spacing['4'],
    gap: spacing['3'],
    marginBottom: spacing['4'],
  },
  periodButtons: {
    borderRadius: borderRadius.lg,
  },
  metricButtons: {
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
    marginTop: spacing['2'],
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
    marginBottom: spacing['4'],
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing['3'],
  },
  statValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing['1'],
    marginBottom: spacing['1'],
  },
  statLabel: {
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
  className: {
    fontWeight: typography.fontWeight.medium,
  },
  studentCount: {
    color: colors.text.secondary,
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
  feeOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing['3'],
  },
  feeItem: {
    alignItems: 'center',
  },
  feeLabel: {
    color: colors.text.secondary,
    marginBottom: spacing['1'],
  },
  feeValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  feeAmount: {
    fontWeight: typography.fontWeight.medium,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
  },
  kpiItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing['3'],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  kpiValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing['2'],
    marginBottom: spacing['1'],
  },
  kpiLabel: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
