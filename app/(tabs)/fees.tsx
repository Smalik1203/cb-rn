import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, SegmentedButtons } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { ClassSelector } from '@/src/components/ClassSelector';
import { FeeComponents } from '@/src/components/fees/FeeComponents';
import { RecordPayments } from '@/src/components/fees/RecordPayments';
import { FeeAnalytics } from '@/src/components/fees/FeeAnalytics';
import { useStudentFees, useClassStudentsFees } from '@/src/features/fees/hooks/useFees';
import { ThreeStateView } from '@/src/components/common/ThreeStateView';
import { useThreeStateQuery, emptyConditions } from '@/src/hooks/useThreeStateQuery';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/design-system';

export default function FeesScreen() {
  const { profile } = useAuth();
  const { selectedClass, isSuperAdmin } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'components' | 'payments' | 'analytics'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const studentId = isSuperAdmin ? null : profile?.id;
  const classId = selectedClass?.id;

  const studentFeesQuery = useStudentFees(studentId);
  const classStudentsFeesQuery = useClassStudentsFees(classId);

  const studentFeesState = useThreeStateQuery(studentFeesQuery, {
    emptyCondition: (data) => !data || (!data.plan && data.payments.length === 0)
  });

  const classFeesState = useThreeStateQuery(classStudentsFeesQuery, {
    emptyCondition: emptyConditions.array
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isSuperAdmin) {
      await classFeesState.refetch();
    } else {
      await studentFeesState.refetch();
    }
    setRefreshing(false);
  };

  const formatAmount = (amountPaise: number) => {
    return `₹${(amountPaise / 100).toLocaleString('en-IN')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      default:
        return <AlertCircle size={16} color="#ef4444" />;
    }
  };

  const currentState = isSuperAdmin ? classFeesState : studentFeesState;
  const currentData = isSuperAdmin ? classStudentsFeesQuery.data : studentFeesQuery.data;
  const currentError = isSuperAdmin ? classStudentsFeesQuery.error : studentFeesQuery.error;

  return (
    <ThreeStateView
      state={currentState.state}
      loadingMessage="Loading fee information..."
      errorMessage="Failed to load fee data"
      errorDetails={currentError?.message}
      emptyMessage={isSuperAdmin ? "No students found in this class" : "No fee information available"}
      emptyAction={isSuperAdmin ? undefined : { label: "Contact Admin", onPress: () => {} }}
      onRetry={handleRefresh}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <LinearGradient
          colors={gradients.warning}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text variant="headlineLarge" style={styles.title}>Fees</Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                {selectedClass ? `Grade ${selectedClass.grade}-${selectedClass.section}` :
                 profile?.class_instance?.grade ? `Grade ${profile.class_instance.grade}-${profile.class_instance.section}` :
                 'Fee Management'}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <DollarSign size={32} color={colors.text.inverse} />
            </View>
          </View>
          {isSuperAdmin && (
            <View style={styles.classSelectorContainer}>
              <ClassSelector />
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'overview' | 'history' | 'components' | 'payments' | 'analytics')}
            buttons={[
              { value: 'overview', label: 'Overview', icon: 'information-outline' },
              { value: 'history', label: 'History', icon: 'history' },
              { value: 'components', label: 'Components', icon: 'format-list-bulleted' },
              { value: 'payments', label: 'Payments', icon: 'credit-card-outline' },
              { value: 'analytics', label: 'Analytics', icon: 'chart-bar' },
            ]}
            style={styles.segmentedButtons}
          />

          {activeTab === 'overview' ? (
            isSuperAdmin ? (
              <ClassFeesOverview data={currentData} formatAmount={formatAmount} getStatusIcon={getStatusIcon} />
            ) : (
              <StudentFeesOverview data={currentData} formatAmount={formatAmount} getStatusIcon={getStatusIcon} />
            )
          ) : activeTab === 'history' ? (
            <FeeHistory data={currentData} formatAmount={formatAmount} getStatusIcon={getStatusIcon} />
          ) : activeTab === 'components' ? (
            <FeeComponents />
          ) : activeTab === 'payments' ? (
            <RecordPayments />
          ) : activeTab === 'analytics' ? (
            <FeeAnalytics />
          ) : null}
        </View>
      </ScrollView>
    </ThreeStateView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
  headerIcon: {
    marginLeft: spacing.md,
  },
  classSelectorContainer: {
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    marginLeft: spacing.sm,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  studentCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  studentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  studentName: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  rollNumber: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  feeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: spacing.xs,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
});

interface StudentFeesOverviewProps {
  data: any;
  formatAmount: (amount: number) => string;
  getStatusIcon: (status: string) => React.ReactElement;
}

const StudentFeesOverview: React.FC<StudentFeesOverviewProps> = ({ data, formatAmount, getStatusIcon }) => {
  if (!data || (!data.plan && data.payments.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <DollarSign size={64} color={colors.neutral[400]} />
        <Text variant="titleMedium" style={styles.emptyTitle}>No Fee Plan or Payments</Text>
        <Text variant="bodySmall" style={styles.emptyMessage}>
          Your fee plan is not yet available or you have no payments recorded.
        </Text>
        <Button mode="contained" onPress={() => {}} style={{ marginTop: spacing.md }}>
          Contact Admin
        </Button>
      </View>
    );
  }

  const { plan, payments, totalDue, totalPaid, balance } = data;

  return (
    <>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color="#667eea" />
            <Text variant="titleMedium" style={styles.summaryTitle}>Your Fee Summary</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{formatAmount(totalDue)}</Text>
              <Text style={styles.statLabel}>Total Due</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{formatAmount(totalPaid)}</Text>
              <Text style={styles.statLabel}>Total Paid</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{formatAmount(balance)}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button mode="contained" icon="credit-card-outline" style={styles.actionButton} onPress={() => {}}>
              Pay Now
            </Button>
            <Button mode="outlined" icon="file-document-outline" style={styles.actionButton} onPress={() => {}}>
              View Invoice
            </Button>
          </View>
        </Card.Content>
      </Card>

      {plan && plan.items && plan.items.length > 0 && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Fee Components</Text>
            {plan.items.map((item: any) => {
              const totalAmount = item.amount_paise * item.quantity;
              return (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', color: colors.text.primary }}>
                      {item.component.name}
                    </Text>
                    <Text style={{ color: colors.text.primary, fontWeight: 'bold' }}>{formatAmount(totalAmount)}</Text>
                    {item.quantity > 1 && (
                      <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                        {formatAmount(item.amount_paise)} × {item.quantity}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {payments.length > 0 && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {payments.slice(0, 3).map((payment: any) => (
              <View key={payment.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ marginRight: spacing.sm }}>{getStatusIcon('paid')}</View>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', color: colors.text.primary }}>
                      {formatAmount(payment.amount_paise)}
                    </Text>
                    <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </Text>
                    {payment.payment_method && (
                      <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>Method: {payment.payment_method}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
            <Button mode="text" style={{ marginTop: spacing.md }} onPress={() => {}}>
              View All Payments
            </Button>
          </Card.Content>
        </Card>
      )}
    </>
  );
};

interface ClassFeesOverviewProps {
  data: any;
  formatAmount: (amount: number) => string;
  getStatusIcon: (status: string) => React.ReactElement;
}

const ClassFeesOverview: React.FC<ClassFeesOverviewProps> = ({ data, formatAmount, getStatusIcon }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <DollarSign size={64} color={colors.neutral[400]} />
        <Text variant="titleMedium" style={styles.emptyTitle}>No students found</Text>
        <Text variant="bodySmall" style={styles.emptyMessage}>
          There are no students in the selected class.
        </Text>
      </View>
    );
  }

  const totalDue = data.reduce((sum: number, student: any) => sum + (student.feeDetails?.totalDue || 0), 0);
  const totalPaid = data.reduce((sum: number, student: any) => sum + (student.feeDetails?.totalPaid || 0), 0);
  const totalBalance = totalDue - totalPaid;

  return (
    <>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color="#667eea" />
            <Text variant="titleMedium" style={styles.summaryTitle}>Class Fee Summary</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{formatAmount(totalDue)}</Text>
              <Text style={styles.statLabel}>Total Due</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{formatAmount(totalPaid)}</Text>
              <Text style={styles.statLabel}>Total Paid</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{formatAmount(totalBalance)}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text style={styles.sectionTitle}>Students in Class</Text>
      {data.map((student: any) => (
        <Card key={student.id} style={styles.studentCard}>
          <Card.Content style={styles.studentCardContent}>
            <View style={styles.studentInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student.full_name[0]}</Text>
              </View>
              <View>
                <Text variant="titleSmall" style={styles.studentName}>{student.full_name}</Text>
                {student.student_code && (
                  <Text style={styles.rollNumber}>Code: {student.student_code}</Text>
                )}
              </View>
            </View>
            <View style={styles.feeStatus}>
              {getStatusIcon(student.feeDetails?.balance > 0 ? 'pending' : 'paid')}
              <Text
                style={[
                  styles.statusText,
                  { color: student.feeDetails?.balance > 0 ? '#f59e0b' : '#10b981' },
                ]}
              >
                {student.feeDetails?.balance > 0 ? formatAmount(student.feeDetails.balance) : 'Paid'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </>
  );
};

interface FeeHistoryProps {
  data: any;
  formatAmount: (amount: number) => string;
  getStatusIcon: (status: string) => React.ReactElement;
}

const FeeHistory: React.FC<FeeHistoryProps> = ({ data, formatAmount, getStatusIcon }) => {
  return (
    <View style={styles.emptyContainer}>
      <Calendar size={64} color={colors.neutral[400]} />
      <Text variant="titleMedium" style={styles.emptyTitle}>Payment History</Text>
      <Text variant="bodySmall" style={styles.emptyMessage}>
        Payment history feature coming soon.
      </Text>
    </View>
  );
};