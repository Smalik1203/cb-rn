import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, ActivityIndicator, Portal, Modal, TextInput } from 'react-native-paper';
import { Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Save } from 'lucide-react-native';
import { useAttendance } from '@/src/contexts/AttendanceContext';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { DatePicker } from '@/src/components/DatePicker';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  remarks?: string;
}

export const UnifiedAttendance: React.FC = () => {
  const { state, actions } = useAttendance();
  const { selectedClass } = useClassSelection();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedClass?.id) {
      actions.loadStudentsForClass(selectedClass.id);
    }
  }, [selectedClass?.id]);

  useEffect(() => {
    if (selectedClass?.id && state.students.length > 0) {
      loadAttendanceForDate();
    }
  }, [selectedClass?.id, selectedDate, state.students]);

  const loadAttendanceForDate = async () => {
    if (!selectedClass?.id) {
      // For "All Classes", we could load attendance for all classes
      // For now, just return early
      return;
    }
    
    const dateString = selectedDate.toISOString().split('T')[0];
    await actions.loadAttendanceForDate(selectedClass.id, dateString);
    
    // Initialize attendance data
    const initialData: StudentAttendanceData[] = state.students.map(student => {
      const existingAttendance = state.attendance.get(`${student.id}_${dateString}`);
      const status = existingAttendance?.[0]?.status || null;
      
      return {
        studentId: student.id,
        studentName: student.full_name,
        studentCode: student.student_code,
        status,
        remarks: existingAttendance?.[0]?.remarks || undefined,
      };
    });
    
    setAttendanceData(initialData);
    setHasChanges(false);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => 
      prev.map(student => 
        student.studentId === studentId 
          ? { ...student, status }
          : student
      )
    );
    setHasChanges(true);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData(prev => 
      prev.map(student => 
        student.studentId === studentId 
          ? { ...student, remarks }
          : student
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedClass?.id) {
      // Cannot save attendance without a specific class
      return;
    }
    
    setSaving(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const recordsToSave = attendanceData
        .filter(student => student.status !== null)
        .map(student => ({
          studentId: student.studentId,
          status: student.status!,
          remarks: student.remarks || undefined,
        }));

      await actions.saveAttendance(selectedClass.id, dateString, recordsToSave);
      
      Alert.alert('Success', 'Attendance saved successfully');
      setShowSaveModal(false);
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={16} color={colors.success[600]} />;
      case 'absent':
        return <XCircle size={16} color={colors.error[600]} />;
      case 'late':
        return <Clock size={16} color={colors.warning[600]} />;
      case 'excused':
        return <AlertCircle size={16} color={colors.info[600]} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
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

  const getStatusCounts = () => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
    };

    attendanceData.forEach(student => {
      switch (student.status) {
        case 'present':
          counts.present++;
          break;
        case 'absent':
          counts.absent++;
          break;
        case 'late':
          counts.late++;
          break;
        case 'excused':
          counts.excused++;
          break;
        default:
          counts.unmarked++;
      }
    });

    return counts;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (!selectedClass) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Please select a class to mark attendance.
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
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading students...
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
            <Button mode="outlined" onPress={() => actions.loadStudentsForClass(selectedClass.id)} style={styles.retryButton}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <Users size={24} color={colors.primary[600]} />
            <Text variant="titleLarge" style={styles.title}>
              Mark Attendance
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Grade {selectedClass.grade}-{selectedClass.section}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.dateCard}>
        <Card.Content>
          <View style={styles.dateHeader}>
            <Calendar size={20} color={colors.primary[600]} />
            <Text variant="titleMedium" style={styles.dateTitle}>
              Date: {formatDate(selectedDate)}
            </Text>
          </View>
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            style={styles.datePicker}
          />
        </Card.Content>
      </Card>

      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.summaryTitle}>
            Summary
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="titleLarge" style={[styles.summaryValue, { color: colors.success[600] }]}>
                {statusCounts.present}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleLarge" style={[styles.summaryValue, { color: colors.error[600] }]}>
                {statusCounts.absent}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Absent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleLarge" style={[styles.summaryValue, { color: colors.warning[600] }]}>
                {statusCounts.late}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Late</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="titleLarge" style={[styles.summaryValue, { color: colors.info[600] }]}>
                {statusCounts.excused}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Excused</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {attendanceData.map((student) => (
          <Card key={student.studentId} style={styles.studentCard}>
            <Card.Content>
              <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                  <Text variant="titleMedium" style={styles.studentName}>
                    {student.studentName}
                  </Text>
                  <Text variant="bodySmall" style={styles.rollNumber}>
                    Code: {student.studentCode}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  {student.status && (
                    <Chip
                      mode="flat"
                      style={[styles.statusChip, { backgroundColor: getStatusColor(student.status) + '20' }]}
                      textStyle={[styles.statusText, { color: getStatusColor(student.status) }]}
                      icon={() => getStatusIcon(student.status)}
                    >
                      {student.status.toUpperCase()}
                    </Chip>
                  )}
                </View>
              </View>

              <View style={styles.statusButtons}>
                <SegmentedButtons
                  value={student.status || ''}
                  onValueChange={(value) => handleStatusChange(student.studentId, value as AttendanceStatus)}
                  buttons={[
                    { value: 'present', label: 'Present', icon: 'check' },
                    { value: 'absent', label: 'Absent', icon: 'close' },
                    { value: 'late', label: 'Late', icon: 'clock' },
                    { value: 'excused', label: 'Excused', icon: 'alert' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>

              {(student.status === 'absent' || student.status === 'late' || student.status === 'excused') && (
                <View style={styles.remarksContainer}>
                  <TextInput
                    label="Remarks (Optional)"
                    value={student.remarks || ''}
                    onChangeText={(text) => handleRemarksChange(student.studentId, text)}
                    style={styles.remarksInput}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {hasChanges && (
        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            onPress={() => setShowSaveModal(true)}
            icon={() => <Save size={16} color={colors.text.inverse} />}
            style={styles.saveButton}
            loading={saving}
          >
            Save Attendance
          </Button>
        </View>
      )}

      <Portal>
        <Modal
          visible={showSaveModal}
          onDismiss={() => setShowSaveModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Confirm Save
          </Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            Are you sure you want to save the attendance for {formatDate(selectedDate)}?
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowSaveModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.confirmButton}
              loading={saving}
            >
              Save
            </Button>
          </View>
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
  dateCard: {
    marginHorizontal: spacing['4'],
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  dateTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  datePicker: {
    marginTop: spacing['2'],
  },
  summaryCard: {
    marginHorizontal: spacing['4'],
    marginBottom: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  summaryTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing['3'],
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['1'],
  },
  summaryLabel: {
    color: colors.text.secondary,
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
    marginBottom: spacing['2'],
  },
  retryButton: {
    alignSelf: 'flex-start',
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
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontWeight: typography.fontWeight.medium,
  },
  statusButtons: {
    marginBottom: spacing['3'],
  },
  segmentedButtons: {
    borderRadius: borderRadius.lg,
  },
  remarksContainer: {
    marginTop: spacing['2'],
  },
  remarksInput: {
    backgroundColor: colors.background.secondary,
  },
  saveButtonContainer: {
    padding: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
  },
  modal: {
    backgroundColor: colors.surface.primary,
    margin: spacing['4'],
    borderRadius: borderRadius.xl,
    padding: spacing['4'],
  },
  modalTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['3'],
    textAlign: 'center',
  },
  modalText: {
    color: colors.text.secondary,
    marginBottom: spacing['4'],
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  cancelButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  confirmButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
});
