import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons, ProgressBar, Chip } from 'react-native-paper';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react-native';
import { useFees } from '@/src/contexts/FeesContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

interface FeeAnalyticsData {
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  collectionRate: number;
  overdueStudents: number;
  fullyPaidStudents: number;
  partiallyPaidStudents: number;
}

export const FeeAnalytics: React.FC = () => {
  const { state, actions } = useFees();
  const { selectedClass } = useClassSelection();
  const [analyticsData, setAnalyticsData] = useState<FeeAnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    if (selectedClass?.id) {
      actions.loadStudentsForClass(selectedClass.id);
    }
  }, [selectedClass?.id]);

  useEffect(() => {
    if (state.students.length > 0) {
      const studentIds = state.students.map(s => s.id);
      actions.loadStudentPlans(studentIds);
      actions.loadPayments(studentIds);
    }
  }, [state.students]);

  useEffect(() => {
    calculateAnalytics();
  }, [state.students, state.studentPlans, state.payments]);

  const calculateAnalytics = () => {
    if (state.students.length === 0) {
      setAnalyticsData(null);
      return;
    }

    let totalDue = 0;
    let totalPaid = 0;
    let overdueStudents = 0;
    let fullyPaidStudents = 0;
    let partiallyPaidStudents = 0;

    state.students.forEach((student) => {
      const plan = state.studentPlans.get(student.id);
      const payments = state.payments.get(student.id) || [];
      
      let studentDue = 0;
      if (plan && (plan as any)?.items) {
        studentDue = (plan as any).items.reduce((sum: number, item: any) => {
          return sum + (item.amount_paise * item.quantity);
        }, 0);
      }

      const studentPaid = payments.reduce((sum: number, payment: any) => {
        return sum + payment.amount_paise;
      }, 0);

      totalDue += studentDue;
      totalPaid += studentPaid;

      const balance = studentDue - studentPaid;
      if (balance > 0) {
        overdueStudents++;
      } else if (balance === 0 && studentPaid > 0) {
        fullyPaidStudents++;
      } else if (studentPaid > 0) {
        partiallyPaidStudents++;
      }
    });

    const totalBalance = totalDue - totalPaid;
    const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    setAnalyticsData({
      totalStudents: state.students.length,
      totalDue,
      totalPaid,
      totalBalance,
      collectionRate,
      overdueStudents,
      fullyPaidStudents,
      partiallyPaidStudents,
    });
  };

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!selectedClass) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Please select a class to view fee analytics.
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

  if (!analyticsData) {
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

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <BarChart3 size={24} color={colors.primary[600]} />
            <Text variant="titleLarge" style={styles.title}>
              Fee Analytics
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
            { value: 'current', label: 'Current' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <DollarSign size={20} color={colors.primary[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {formatAmount(analyticsData.totalDue)}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Due
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <TrendingUp size={20} color={colors.success[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {formatAmount(analyticsData.totalPaid)}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Collected
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Users size={20} color={colors.info[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {analyticsData.totalStudents}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Students
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <AlertCircle size={20} color={colors.warning[600]} />
              <Text variant="titleMedium" style={styles.summaryValue}>
                {analyticsData.overdueStudents}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Overdue
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Collection Rate */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Collection Rate
            </Text>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={analyticsData.collectionRate / 100}
                color={analyticsData.collectionRate >= 80 ? colors.success[600] : 
                       analyticsData.collectionRate >= 60 ? colors.warning[600] : colors.error[600]}
                style={styles.progressBar}
              />
              <Text variant="titleLarge" style={styles.progressText}>
                {formatPercentage(analyticsData.collectionRate)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Payment Status Distribution */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Payment Status
            </Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Chip mode="outlined" style={[styles.statusChip, { backgroundColor: colors.success[50] }]}>
                  Fully Paid: {analyticsData.fullyPaidStudents}
                </Chip>
              </View>
              <View style={styles.statusItem}>
                <Chip mode="outlined" style={[styles.statusChip, { backgroundColor: colors.warning[50] }]}>
                  Partial: {analyticsData.partiallyPaidStudents}
                </Chip>
              </View>
              <View style={styles.statusItem}>
                <Chip mode="outlined" style={[styles.statusChip, { backgroundColor: colors.error[50] }]}>
                  Overdue: {analyticsData.overdueStudents}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Outstanding Balance */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Outstanding Balance
            </Text>
            <View style={styles.balanceContainer}>
              <Text variant="displaySmall" style={[
                styles.balanceAmount,
                { color: analyticsData.totalBalance > 0 ? colors.error[600] : colors.success[600] }
              ]}>
                {formatAmount(Math.abs(analyticsData.totalBalance))}
              </Text>
              <Text variant="bodyMedium" style={styles.balanceLabel}>
                {analyticsData.totalBalance > 0 ? 'Outstanding' : 'Overpaid'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Payments */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Recent Activity
            </Text>
            <Text variant="bodyMedium" style={styles.activityText}>
              Last updated: {state.lastUpdated ? new Date(state.lastUpdated).toLocaleDateString() : 'Never'}
            </Text>
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
  balanceContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2'],
  },
  balanceAmount: {
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['1'],
  },
  balanceLabel: {
    color: colors.text.secondary,
  },
  activityText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
