import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Card, Chip, Button, ProgressBar, Portal, Modal, SegmentedButtons } from 'react-native-paper';
import { DollarSign, Calendar, CheckCircle, AlertCircle, Download, CreditCard, Clock } from 'lucide-react-native';

const MOCK_FEE_SUMMARY = {
  totalFee: 50000,
  paidAmount: 35000,
  pendingAmount: 15000,
  dueDate: '30 Nov 2024',
};

const MOCK_FEE_STRUCTURE = [
  { id: '1', category: 'Tuition Fee', amount: 30000, status: 'paid', icon: 'book-open' },
  { id: '2', category: 'Lab Fee', amount: 5000, status: 'paid', icon: 'flask' },
  { id: '3', category: 'Library Fee', amount: 2000, status: 'pending', icon: 'library' },
  { id: '4', category: 'Sports Fee', amount: 3000, status: 'pending', icon: 'trophy' },
  { id: '5', category: 'Transport Fee', amount: 8000, status: 'pending', icon: 'bus' },
  { id: '6', category: 'Exam Fee', amount: 2000, status: 'pending', icon: 'file-text' },
];

const MOCK_PAYMENT_HISTORY = [
  { id: '1', date: '15 Aug 2024', amount: 20000, category: 'Tuition Fee (Partial)', method: 'UPI', status: 'success' },
  { id: '2', date: '20 Sep 2024', amount: 10000, category: 'Tuition Fee (Remaining)', method: 'Card', status: 'success' },
  { id: '3', date: '25 Sep 2024', amount: 5000, category: 'Lab Fee', method: 'Net Banking', status: 'success' },
];

const MOCK_INSTALLMENTS = [
  { id: '1', term: '1st Installment', amount: 20000, dueDate: '15 Aug 2024', status: 'paid', paidDate: '15 Aug 2024' },
  { id: '2', term: '2nd Installment', amount: 15000, dueDate: '15 Sep 2024', status: 'paid', paidDate: '20 Sep 2024' },
  { id: '3', term: '3rd Installment', amount: 15000, dueDate: '30 Nov 2024', status: 'pending', paidDate: null },
];

export default function DemoFeesScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'installments'>('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);

  const percentage = (MOCK_FEE_SUMMARY.paidAmount / MOCK_FEE_SUMMARY.totalFee) * 100;

  const handlePayment = (amount: number) => {
    setSelectedAmount(amount);
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    setShowPaymentModal(false);
    Alert.alert('Success', `Payment of ₹${selectedAmount.toLocaleString()} processed successfully! 🎉`);
  };

  const renderOverview = () => (
    <ScrollView style={styles.content}>
      <Card style={styles.summaryCard} elevation={3}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <DollarSign size={32} color="#667eea" />
            </View>
            <View style={styles.summaryInfo}>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                Total Fee Amount
              </Text>
              <Text variant="headlineMedium" style={styles.summaryTotal}>
                ₹{MOCK_FEE_SUMMARY.totalFee.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressValue}>{Math.round(percentage)}%</Text>
            </View>
            <ProgressBar progress={percentage / 100} color="#10b981" style={styles.progressBar} />
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <View style={[styles.amountDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountValue, { color: '#10b981' }]}>
                ₹{MOCK_FEE_SUMMARY.paidAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
              <View style={[styles.amountDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.amountLabel}>Pending</Text>
              <Text style={[styles.amountValue, { color: '#ef4444' }]}>
                ₹{MOCK_FEE_SUMMARY.pendingAmount.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.dueBanner}>
            <Clock size={18} color="#f59e0b" />
            <Text style={styles.dueText}>
              Due Date: {MOCK_FEE_SUMMARY.dueDate}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={() => handlePayment(MOCK_FEE_SUMMARY.pendingAmount)}
            style={styles.payButton}
            buttonColor="#667eea"
            contentStyle={styles.payButtonContent}
            icon="credit-card"
          >
            Pay Pending Amount
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Fee Breakdown
        </Text>

        {MOCK_FEE_STRUCTURE.map((fee) => (
          <Card key={fee.id} style={styles.feeCard} elevation={1}>
            <Card.Content style={styles.feeContent}>
              <View style={styles.feeLeft}>
                <View style={[
                  styles.feeIcon,
                  { backgroundColor: fee.status === 'paid' ? '#d1fae5' : '#fee2e2' }
                ]}>
                  {fee.status === 'paid' ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <AlertCircle size={20} color="#ef4444" />
                  )}
                </View>
                <View style={styles.feeInfo}>
                  <Text style={styles.feeCategory}>{fee.category}</Text>
                  <Chip
                    mode="flat"
                    style={fee.status === 'paid' ? styles.paidChip : styles.pendingChip}
                    textStyle={styles.chipText}
                  >
                    {fee.status === 'paid' ? '✓ Paid' : '○ Pending'}
                  </Chip>
                </View>
              </View>
              <Text style={styles.feeAmount}>₹{fee.amount.toLocaleString()}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Payment History
          </Text>
          <TouchableOpacity>
            <Download size={20} color="#667eea" />
          </TouchableOpacity>
        </View>

        {MOCK_PAYMENT_HISTORY.map((payment) => (
          <Card key={payment.id} style={styles.historyCard} elevation={1}>
            <Card.Content>
              <View style={styles.historyHeader}>
                <View style={styles.historyIcon}>
                  <CreditCard size={20} color="#667eea" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyCategory}>{payment.category}</Text>
                  <Text style={styles.historyDate}>{payment.date}</Text>
                </View>
              </View>

              <View style={styles.historyFooter}>
                <View style={styles.historyMethod}>
                  <Text style={styles.methodLabel}>via {payment.method}</Text>
                </View>
                <Text style={styles.historyAmount}>₹{payment.amount.toLocaleString()}</Text>
              </View>

              <Chip mode="flat" style={styles.successChip} textStyle={styles.successText}>
                ✓ Success
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderInstallments = () => (
    <ScrollView style={styles.content}>
      <Card style={styles.infoCard} elevation={2}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            Installment Plan
          </Text>
          <Text variant="bodySmall" style={styles.infoSubtitle}>
            Pay your fees in 3 convenient installments
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.section}>
        {MOCK_INSTALLMENTS.map((installment, index) => (
          <Card key={installment.id} style={styles.installmentCard} elevation={1}>
            <View style={[
              styles.installmentBorder,
              { backgroundColor: installment.status === 'paid' ? '#10b981' : '#f59e0b' }
            ]} />
            <Card.Content style={styles.installmentContent}>
              <View style={styles.installmentHeader}>
                <View style={styles.installmentLeft}>
                  <View style={[
                    styles.installmentNumber,
                    {
                      backgroundColor: installment.status === 'paid' ? '#d1fae5' : '#fef3c7',
                      borderColor: installment.status === 'paid' ? '#10b981' : '#f59e0b'
                    }
                  ]}>
                    <Text style={[
                      styles.installmentNumberText,
                      { color: installment.status === 'paid' ? '#10b981' : '#f59e0b' }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.installmentTerm}>{installment.term}</Text>
                    <View style={styles.installmentDate}>
                      <Calendar size={14} color="#6b7280" />
                      <Text style={styles.installmentDateText}>
                        Due: {installment.dueDate}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.installmentAmount}>
                  ₹{installment.amount.toLocaleString()}
                </Text>
              </View>

              {installment.status === 'paid' ? (
                <View style={styles.paidBanner}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={styles.paidText}>Paid on {installment.paidDate}</Text>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={() => handlePayment(installment.amount)}
                  style={styles.payInstallmentButton}
                  buttonColor="#f59e0b"
                  compact
                >
                  Pay Now
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Fees
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Academic Year 2024-25
        </Text>
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        buttons={[
          { value: 'overview', label: 'Overview', icon: 'view-dashboard' },
          { value: 'history', label: 'History', icon: 'history' },
          { value: 'installments', label: 'Plans', icon: 'calendar-check' },
        ]}
        style={styles.tabs}
      />

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'installments' && renderInstallments()}

      <Portal>
        <Modal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <CreditCard size={48} color="#667eea" />
            </View>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Confirm Payment
            </Text>
          </View>

          <View style={styles.modalAmount}>
            <Text style={styles.modalAmountLabel}>Amount to Pay</Text>
            <Text style={styles.modalAmountValue}>₹{selectedAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.paymentMethods}>
            <Text variant="titleSmall" style={styles.methodsTitle}>
              Select Payment Method
            </Text>
            <TouchableOpacity style={styles.methodOption}>
              <View style={styles.methodIcon}>
                <CreditCard size={20} color="#667eea" />
              </View>
              <Text style={styles.methodText}>Credit / Debit Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.methodOption}>
              <View style={styles.methodIcon}>
                <DollarSign size={20} color="#667eea" />
              </View>
              <Text style={styles.methodText}>UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.methodOption}>
              <View style={styles.methodIcon}>
                <DollarSign size={20} color="#667eea" />
              </View>
              <Text style={styles.methodText}>Net Banking</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowPaymentModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmPayment}
              style={styles.modalButton}
              buttonColor="#667eea"
            >
              Pay Now
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
    elevation: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#e0e7ff',
    marginTop: 4,
  },
  tabs: {
    margin: 16,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryTotal: {
    fontWeight: 'bold',
    color: '#111827',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  amountRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    marginBottom: 16,
  },
  dueText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  payButton: {
    paddingVertical: 4,
  },
  payButtonContent: {
    paddingVertical: 8,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  feeCard: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  feeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  feeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeInfo: {
    flex: 1,
  },
  feeCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  paidChip: {
    backgroundColor: '#d1fae5',
    alignSelf: 'flex-start',
  },
  pendingChip: {
    backgroundColor: '#fee2e2',
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyMethod: {},
  methodLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  successChip: {
    backgroundColor: '#d1fae5',
    alignSelf: 'flex-start',
  },
  successText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 11,
  },
  infoCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  infoTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoSubtitle: {
    color: '#6b7280',
  },
  installmentCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  installmentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  installmentContent: {
    paddingLeft: 8,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  installmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  installmentNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  installmentNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  installmentTerm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  installmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  installmentDateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  installmentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 6,
  },
  paidText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  payInstallmentButton: {
    marginTop: 4,
  },
  modal: {
    backgroundColor: '#ffffff',
    padding: 24,
    margin: 20,
    borderRadius: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  modalAmount: {
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAmountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalAmountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentMethods: {
    marginBottom: 20,
  },
  methodsTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
