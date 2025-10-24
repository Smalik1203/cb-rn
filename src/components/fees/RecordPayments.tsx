import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, SegmentedButtons, Chip, Portal, Modal, List } from 'react-native-paper';
import { DollarSign, Calendar, User, CreditCard, FileText } from 'lucide-react-native';
import { useFees } from '@/src/contexts/FeesContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { recordPayment } from '@/src/data/queries';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

interface PaymentFormData {
  studentId: string;
  componentTypeId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  receiptNumber: string;
  remarks: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
];

export const RecordPayments: React.FC = () => {
  const { state, actions } = useFees();
  const { selectedClass } = useClassSelection();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    studentId: '',
    componentTypeId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    transactionId: '',
    receiptNumber: '',
    remarks: '',
  });

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

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentId: student.id,
    }));
    setShowForm(true);
  };

  const handleSavePayment = async () => {
    try {
      if (!formData.studentId || !formData.componentTypeId || !formData.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const paymentData = {
        student_id: formData.studentId,
        component_type_id: formData.componentTypeId,
        amount_paise: Math.round(parseFloat(formData.amount) * 100),
        payment_date: formData.paymentDate,
        payment_method: formData.paymentMethod,
        transaction_id: formData.transactionId || null,
        receipt_number: formData.receiptNumber || null,
        remarks: formData.remarks || null,
        school_code: state.academicYear?.school_code,
        created_by: user?.id || '',
      };

      // Save payment to database using data layer
      const result = await recordPayment(paymentData);
      
      if (result.error) {
        Alert.alert('Error', result.error.userMessage || 'Failed to record payment');
        return;
      }
      Alert.alert('Success', 'Payment recorded successfully');
      setShowForm(false);
      resetForm();
      actions.refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      componentTypeId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      transactionId: '',
      receiptNumber: '',
      remarks: '',
    });
    setSelectedStudent(null);
  };

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const getStudentBalance = (student: any) => {
    const plan = state.studentPlans.get(student.id);
    const payments = state.payments.get(student.id) || [];
    
    let totalDue = 0;
    if (plan && (plan as any)?.items) {
      totalDue = (plan as any).items.reduce((sum: number, item: any) => {
        return sum + (item.amount_paise * item.quantity);
      }, 0);
    }

    const totalPaid = payments.reduce((sum: number, payment: any) => {
      return sum + payment.amount_paise;
    }, 0);

    return totalDue - totalPaid;
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <CreditCard size={24} color={colors.primary[600]} />
            <Text variant="titleLarge" style={styles.title}>
              Record Payments
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Record fee payments for students
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!selectedClass ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Please select a class to view students and record payments.
              </Text>
            </Card.Content>
          </Card>
        ) : state.loading ? (
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading students...
              </Text>
            </Card.Content>
          </Card>
        ) : state.error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.errorText}>
                Error: {state.error}
              </Text>
              <Button mode="outlined" onPress={() => actions.loadStudentsForClass(selectedClass.id)} style={styles.retryButton}>
                Retry
              </Button>
            </Card.Content>
          </Card>
        ) : state.students.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No students found in this class.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          state.students.map((student) => {
            const balance = getStudentBalance(student);
            const isOverdue = balance > 0;
            
            return (
              <Card key={student.id} style={styles.studentCard}>
                <Card.Content>
                  <View style={styles.studentHeader}>
                    <View style={styles.studentInfo}>
                      <Text variant="titleMedium" style={styles.studentName}>
                        {student.full_name}
                      </Text>
                      <Text variant="bodySmall" style={styles.rollNumber}>
                        Code: {student.student_code}
                      </Text>
                    </View>
                    <View style={styles.balanceInfo}>
                      <Text variant="titleMedium" style={[
                        styles.balanceAmount,
                        { color: isOverdue ? colors.error[600] : colors.success[600] }
                      ]}>
                        {formatAmount(Math.abs(balance))}
                      </Text>
                      <Text variant="bodySmall" style={styles.balanceLabel}>
                        {isOverdue ? 'Due' : 'Paid'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.studentActions}>
                    <Button
                      mode="contained"
                      onPress={() => handleStudentSelect(student)}
                      style={styles.recordButton}
                      disabled={balance <= 0}
                    >
                      Record Payment
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Record Payment
            </Text>

            {selectedStudent && (
              <Card style={styles.studentInfoCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.studentName}>
                    {selectedStudent.full_name}
                  </Text>
                  <Text variant="bodySmall" style={styles.rollNumber}>
                    Code: {selectedStudent.student_code}
                  </Text>
                </Card.Content>
              </Card>
            )}

            <TextInput
              label="Amount (₹)"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Payment Date"
              value={formData.paymentDate}
              onChangeText={(text) => setFormData({ ...formData, paymentDate: text })}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.segmentedContainer}>
              <Text variant="bodyMedium" style={styles.segmentedLabel}>
                Payment Method
              </Text>
              <SegmentedButtons
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                buttons={PAYMENT_METHODS.map(method => ({
                  value: method.value,
                  label: method.label,
                }))}
                style={styles.segmentedButtons}
              />
            </View>

            <TextInput
              label="Transaction ID (Optional)"
              value={formData.transactionId}
              onChangeText={(text) => setFormData({ ...formData, transactionId: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Receipt Number (Optional)"
              value={formData.receiptNumber}
              onChangeText={(text) => setFormData({ ...formData, receiptNumber: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Remarks (Optional)"
              value={formData.remarks}
              onChangeText={(text) => setFormData({ ...formData, remarks: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSavePayment}
                style={styles.saveButton}
              >
                Record Payment
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing['4'],
  },
  loadingCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  errorCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  errorText: {
    color: colors.error[600],
    marginBottom: spacing['2'],
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  studentCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['3'],
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['1'],
  },
  rollNumber: {
    color: colors.text.secondary,
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontWeight: typography.fontWeight.bold,
  },
  balanceLabel: {
    color: colors.text.secondary,
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  recordButton: {
    borderRadius: borderRadius.lg,
  },
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing['4'],
    borderRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['4'],
    textAlign: 'center',
  },
  studentInfoCard: {
    marginBottom: spacing['4'],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  input: {
    marginBottom: spacing['3'],
  },
  segmentedContainer: {
    marginBottom: spacing['3'],
  },
  segmentedLabel: {
    marginBottom: spacing['2'],
    color: colors.text.primary,
  },
  segmentedButtons: {
    borderRadius: borderRadius.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing['3'],
    marginTop: spacing['4'],
  },
  cancelButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
});
