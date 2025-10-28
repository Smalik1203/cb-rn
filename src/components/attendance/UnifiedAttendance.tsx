import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, ActivityIndicator, TextInput } from 'react-native-paper';
import { Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Save } from 'lucide-react-native';
import { useClassSelection } from '../../contexts/ClassSelectionContext';
import { useStudents } from '../../hooks/useStudents';
import { useClassAttendance, useMarkAttendance } from '../../hooks/useAttendance';
import { DatePicker } from '../DatePicker';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import { useAuth } from '../../contexts/AuthContext';

type AttendanceStatus = 'present' | 'absent' | 'late' | null;

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  remarks?: string;
}

export const UnifiedAttendance: React.FC = () => {
  const { profile } = useAuth();
  const { selectedClass, scope } = useClassSelection();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const dateString = selectedDate.toISOString().split('T')[0];
  
  // Fetch students for selected class
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    selectedClass?.id,
    scope.school_code
  );

  // Fetch attendance for selected date
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useClassAttendance(
    selectedClass?.id,
    dateString
  );

  // Mutation for saving attendance
  const markAttendanceMutation = useMarkAttendance();

  // Initialize attendance data when students or attendance records change
  useEffect(() => {
    if (students.length > 0) {
      const initialData: StudentAttendanceData[] = students.map(student => {
        const existingRecord = attendanceRecords.find(r => r.student_id === student.id);
        return {
          studentId: student.id,
          studentName: student.full_name,
          studentCode: student.student_code,
          status: (existingRecord?.status as AttendanceStatus) || null,
          remarks: undefined, // Notes/remarks field not available in database schema
        };
      });
      setAttendanceData(initialData);
      setHasChanges(false);
    }
  }, [students, attendanceRecords]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev =>
      prev.map(student =>
        student.studentId === studentId ? { ...student, status } : student
      )
    );
    setHasChanges(true);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData(prev =>
      prev.map(student =>
        student.studentId === studentId ? { ...student, remarks } : student
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedClass?.id || !scope.school_code) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    const recordsToSave = attendanceData
      .filter(student => student.status !== null)
      .map(student => ({
        student_id: student.studentId,
        class_instance_id: selectedClass.id,
        date: dateString,
        status: student.status!,
        remarks: student.remarks || null,
        school_code: scope.school_code!,
        marked_by: profile?.auth_id || '',
        marked_by_role_code: profile?.role || 'admin',
      }));

    try {
      await markAttendanceMutation.mutateAsync(recordsToSave as any);
      Alert.alert('Success', 'Attendance saved successfully');
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance');
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={20} color={colors.success[600]} />;
      case 'absent':
        return <XCircle size={20} color={colors.error[600]} />;
      case 'late':
        return <Clock size={20} color={colors.warning[600]} />;
      default:
        return <AlertCircle size={20} color={colors.text.tertiary} />;
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
      default:
        return colors.text.secondary;
    }
  };

  const getStatusCounts = () => {
    return {
      present: attendanceData.filter(s => s.status === 'present').length,
      absent: attendanceData.filter(s => s.status === 'absent').length,
      late: attendanceData.filter(s => s.status === 'late').length,
      unmarked: attendanceData.filter(s => s.status === null).length,
    };
  };

  const counts = getStatusCounts();
  const isLoading = studentsLoading || attendanceLoading;

  if (!selectedClass) {
    return (
      <View style={styles.emptyContainer}>
        <Users size={64} color={colors.text.tertiary} />
        <Text variant="titleLarge" style={styles.emptyTitle}>No Class Selected</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Please select a class to mark attendance
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.dateSelector}>
            <Calendar size={20} color={colors.primary[600]} />
            <Text variant="titleMedium" style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <DatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: colors.success[50] }]}>
              <CheckCircle size={16} color={colors.success[600]} />
              <Text style={[styles.statText, { color: colors.success[700] }]}>
                {counts.present} Present
              </Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.error[50] }]}>
              <XCircle size={16} color={colors.error[600]} />
              <Text style={[styles.statText, { color: colors.error[700] }]}>
                {counts.absent} Absent
              </Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.warning[50] }]}>
              <Clock size={16} color={colors.warning[600]} />
              <Text style={[styles.statText, { color: colors.warning[700] }]}>
                {counts.late} Late
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {attendanceData.map((student, index) => (
            <Card key={student.studentId} style={styles.studentCard}>
              <Card.Content>
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <Text variant="titleMedium" style={styles.studentName}>
                      {student.studentName}
                    </Text>
                    <Text variant="bodySmall" style={styles.studentCode}>
                      {student.studentCode}
                    </Text>
                  </View>
                  {getStatusIcon(student.status)}
                </View>

                <SegmentedButtons
                  value={student.status || ''}
                  onValueChange={(value) =>
                    handleStatusChange(student.studentId, value as AttendanceStatus)
                  }
                  buttons={[
                    {
                      value: 'present',
                      label: 'Present',
                      icon: 'check-circle',
                      style: {
                        backgroundColor:
                          student.status === 'present'
                            ? colors.success[100]
                            : undefined,
                      },
                    },
                    {
                      value: 'absent',
                      label: 'Absent',
                      icon: 'close-circle',
                      style: {
                        backgroundColor:
                          student.status === 'absent'
                            ? colors.error[100]
                            : undefined,
                      },
                    },
                    {
                      value: 'late',
                      label: 'Late',
                      icon: 'clock-outline',
                      style: {
                        backgroundColor:
                          student.status === 'late'
                            ? colors.warning[100]
                            : undefined,
                      },
                    },
                  ]}
                  style={styles.segmentedButtons}
                />

                {student.status && (
                  <TextInput
                    label="Remarks (Optional)"
                    value={student.remarks || ''}
                    onChangeText={(text) =>
                      handleRemarksChange(student.studentId, text)
                    }
                    mode="outlined"
                    style={styles.remarksInput}
                    multiline
                    numberOfLines={2}
                  />
                )}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}

      {hasChanges && !isLoading && (
        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={markAttendanceMutation.isPending}
            disabled={markAttendanceMutation.isPending}
            icon={() => <Save size={20} color={colors.text.inverse} />}
            style={styles.saveButton}
          >
            Save Attendance
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerCard: {
    margin: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateText: {
    flex: 1,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  studentCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  studentCode: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  segmentedButtons: {
    marginTop: spacing.sm,
  },
  remarksInput: {
    marginTop: spacing.sm,
  },
  saveButtonContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.md,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
