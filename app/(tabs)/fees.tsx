import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Users, TrendingUp, CreditCard, FileText, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClassSelection } from '../../src/contexts/ClassSelectionContext';
import { ClassSelector } from '../../src/components/ClassSelector';
// import { FeeComponents } from '@/src/components/fees/FeeComponents';
// import { RecordPayments } from '@/src/components/fees/RecordPayments';
// import { FeeAnalytics } from '@/src/components/fees/FeeAnalytics';
import { EmptyState } from '../../src/components/ui';
import { useStudentPayments, useClassPayments } from '../../src/hooks/useFees';
import { ThreeStateView } from '../../src/components/common/ThreeStateView';
import { colors, spacing, borderRadius, shadows, typography } from '../../lib/design-system';
import { Card, Badge, Avatar, Button } from '../../src/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FeesScreen() {
  const { profile } = useAuth();
  const { selectedClass, isSuperAdmin } = useClassSelection();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'components' | 'payments' | 'analytics'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const studentId = isSuperAdmin ? null : profile?.id;
  const classId = selectedClass?.id;

  const studentFeesQuery = useStudentPayments(studentId || undefined);
  const classFeesQuery = useClassPayments(classId || undefined);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isSuperAdmin) {
      await classFeesQuery.refetch();
    } else {
      await studentFeesQuery.refetch();
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

  const currentData = isSuperAdmin ? classFeesQuery.data : studentFeesQuery.data;
  const currentError = isSuperAdmin ? classFeesQuery.error : studentFeesQuery.error;
  const isLoading = isSuperAdmin ? classFeesQuery.isLoading : studentFeesQuery.isLoading;

  const feeStats = [
    {
      title: 'Total Due',
      value: '₹2,45,000',
      change: '+12%',
      icon: DollarSign,
      color: colors.primary[600],
      bgColor: colors.primary[50],
    },
    {
      title: 'Collected',
      value: '₹1,89,000',
      change: '+8%',
      icon: CheckCircle,
      color: colors.success[600],
      bgColor: colors.success[50],
    },
    {
      title: 'Pending',
      value: '₹56,000',
      change: '-3%',
      icon: Clock,
      color: colors.warning[600],
      bgColor: colors.warning[50],
    },
    {
      title: 'Overdue',
      value: '₹12,000',
      change: '+2%',
      icon: AlertCircle,
      color: colors.error[600],
      bgColor: colors.error[50],
    },
  ];

  const tabButtons = [
    { key: 'overview', label: 'Overview', icon: DollarSign },
    { key: 'history', label: 'History', icon: Calendar },
    { key: 'components', label: 'Components', icon: FileText },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <ThreeStateView
      state={isLoading ? 'loading' : currentError ? 'error' : !currentData?.length ? 'empty' : 'success'}
      loadingMessage="Loading fee information..."
      errorMessage="Failed to load fee data"
      errorDetails={currentError?.message}
      emptyMessage={isSuperAdmin ? "No students found in this class" : "No fee information available"}
      emptyAction={isSuperAdmin ? undefined : { label: "Contact Admin", onPress: () => {} }}
      onRetry={handleRefresh}
    >
      <View style={styles.container}>
        {/* Modern Header with Gradient */}
        <LinearGradient
          colors={colors.gradient.warning as [string, string, ...string[]]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <DollarSign size={32} color={colors.text.inverse} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Fees</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedClass ? `Grade ${selectedClass.grade}-${selectedClass.section}` :
                   profile?.class_instance?.grade ? `Grade ${profile.class_instance.grade}-${profile.class_instance.section}` :
                   'Fee Management'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Badge variant="warning" size="sm" style={styles.statusBadge}>
                Live
              </Badge>
            </View>
          </View>
          {isSuperAdmin && (
            <View style={styles.classSelectorContainer}>
              <ClassSelector />
            </View>
          )}
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {feeStats.map((stat, index) => (
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

          {/* Modern Tab Navigation */}
          <View style={styles.tabContainer}>
            <Card variant="glass" style={styles.tabCard}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScrollContent}
              >
                {tabButtons.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tabButton,
                      activeTab === tab.key && styles.activeTab
                    ]}
                    onPress={() => setActiveTab(tab.key as any)}
                  >
                    <tab.icon 
                      size={18} 
                      color={activeTab === tab.key ? colors.warning[600] : colors.neutral[500]} 
                    />
                    <Text style={[
                      styles.tabText,
                      activeTab === tab.key && styles.activeTabText
                    ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'overview' ? (
              isSuperAdmin ? (
                <ClassFeesOverview data={currentData} formatAmount={formatAmount} getStatusIcon={getStatusIcon} />
              ) : (
                <StudentFeesOverview data={currentData} formatAmount={formatAmount} getStatusIcon={getStatusIcon} />
              )
            ) : activeTab === 'history' ? (
              <FeeHistory data={currentData} formatAmount={formatAmount} getStatusIcon={getStatusIcon} />
            ) : activeTab === 'components' ? (
              <EmptyState
                title="Fee Components"
                message="Fee component management will be available in the next update"
                icon={<CreditCard size={64} color={colors.text.tertiary} />}
              />
            ) : activeTab === 'payments' ? (
              <EmptyState
                title="Record Payments"
                message="Payment recording will be available in the next update"
                icon={<DollarSign size={64} color={colors.text.tertiary} />}
              />
            ) : activeTab === 'analytics' ? (
              <EmptyState
                title="Fee Analytics"
                message="Fee analytics will be available in the next update"
                icon={<BarChart3 size={64} color={colors.text.tertiary} />}
              />
            ) : null}
          </View>
        </ScrollView>
      </View>
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
  classSelectorContainer: {
    marginTop: spacing.lg,
  },
  scrollView: {
    flex: 1,
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
    fontSize: typography.fontSize.lg,
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
  tabScrollContent: {
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    gap: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.warning[50],
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.warning[700],
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for tab bar
  },
  summaryCard: {
    marginBottom: spacing.md,
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
    backgroundColor: colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.primary[500],
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
        <Button title="Contact Admin" onPress={() => {}} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const { plan, payments, totalDue, totalPaid, balance } = data;

  return (
    <>
      <Card style={styles.summaryCard}>
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
          <Button title="Pay Now" onPress={() => {}} style={styles.actionButton} />
          <Button title="View Invoice" variant="outline" onPress={() => {}} style={styles.actionButton} />
        </View>
      </Card>

      {plan && plan.items && plan.items.length > 0 && (
        <Card style={styles.summaryCard}>
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
        </Card>
      )}

      {payments.length > 0 && (
        <Card style={styles.summaryCard}>
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
            <Button title="View All Payments" variant="ghost" style={{ marginTop: spacing.md }} onPress={() => {}} />
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
      </Card>

      <Text style={styles.sectionTitle}>Students in Class</Text>
      {data.map((student: any) => {
        const fullName = student.full_name || 'N/A';
        const initial = fullName && fullName.length > 0 ? fullName[0].toUpperCase() : '?';
        
        return (
          <Card key={student.id} style={styles.studentCard}>
            <View style={styles.studentCardContent}>
              <View style={styles.studentInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View>
                  <Text variant="titleSmall" style={styles.studentName}>{fullName}</Text>
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
            </View>
          </Card>
        );
      })}
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