import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { Text, Card, Button, SegmentedButtons, ActivityIndicator, FAB, Menu, Portal, Modal } from 'react-native-paper';
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Save, 
  ChevronDown,
  Filter,
  Clock,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClassSelection } from '../../contexts/ClassSelectionContext';
import { ClassSelector } from '../ClassSelector';
import { DatePickerModal } from '../common/DatePickerModal';
import { useStudents } from '../../hooks/useStudents';
import { useClasses } from '../../hooks/useClasses';
import { useClassAttendance, useMarkAttendance, useMarkBulkAttendance, useClassAttendanceSummary } from '../../hooks/useAttendance';
import { colors, typography, spacing, borderRadius, shadows } from '../../../lib/design-system';
import { AttendanceInput } from '../../services/api';

type AttendanceStatus = 'present' | 'absent' | null;

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
}

export const AttendanceScreen: React.FC = () => {
  const { profile } = useAuth();
  const { selectedClass, scope, setSelectedClass } = useClassSelection();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [classMenuVisible, setClassMenuVisible] = useState(false);
  const [dateMenuVisible, setDateMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateString = selectedDate.toISOString().split('T')[0];
  const canMark = profile?.role === 'admin' || profile?.role === 'superadmin';

  // Fetch data
  const { data: classes = [] } = useClasses(scope.school_code);
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    selectedClass?.id,
    scope.school_code
  );

  const { data: existingAttendance = [], isLoading: attendanceLoading } = useClassAttendance(
    selectedClass?.id,
    dateString,
    { enabled: !!selectedClass?.id && !!dateString }
  );

  const markAttendanceMutation = useMarkAttendance();
  const markBulkAttendanceMutation = useMarkBulkAttendance();

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setHasChanges(true);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  // Initialize attendance data
  useEffect(() => {
    if (students.length > 0) {
      const studentAttendanceData: StudentAttendanceData[] = students.map(student => {
        const existing = existingAttendance.find(a => a.student_id === student.id);
        return {
          studentId: student.id,
          studentName: student.full_name,
          studentCode: student.student_code,
          status: existing?.status || null,
        };
      });
      setAttendanceData(studentAttendanceData);
    } else {
      setAttendanceData([]);
    }
  }, [students.length, existingAttendance.length, dateString]);

  // Calculate stats
  const stats = {
    total: students.length,
  };

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    // Immediate UI update - no confirmation needed for individual changes
    setAttendanceData(prev => 
      prev.map(s => 
        s.studentId === studentId 
          ? { ...s, status }
          : s
      )
    );
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!selectedClass?.id || !scope.school_code || !profile?.auth_id) {
      Alert.alert('Error', 'Please select a class and ensure you are logged in');
      return;
    }

    const records: AttendanceInput[] = attendanceData
      .filter(student => student.status !== null)
      .map(student => ({
        student_id: student.studentId,
        class_instance_id: selectedClass.id,
        date: dateString,
        status: student.status!,
        marked_by: profile.auth_id,
        marked_by_role_code: profile.role || 'unknown',
        school_code: scope.school_code,
      }));

    if (records.length === 0) {
      Alert.alert('No Changes', 'Please mark attendance for at least one student');
      return;
    }

    Alert.alert(
      'Confirm Save',
      `Save attendance for ${records.length} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              await markAttendanceMutation.mutateAsync(records);
              setHasChanges(false);
              Alert.alert('Success', 'Attendance saved successfully');
            } catch (error) {
              console.error('Attendance save error:', error);
              Alert.alert('Error', 'Failed to save attendance. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBulkMark = async (status: 'present' | 'absent') => {
    if (!selectedClass?.id || !scope.school_code || !profile?.auth_id) {
      Alert.alert('Error', 'Please select a class and ensure you are logged in');
      return;
    }

    const statusText = status === 'present' ? 'Present' : 'Absent';
    const studentCount = students.length;

    // Immediate UI update for better responsiveness
    setAttendanceData(prev => 
      prev.map(student => ({ ...student, status }))
    );
    setHasChanges(true);

    Alert.alert(
      `Mark All ${statusText}`,
      `Mark all ${studentCount} students as ${statusText.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {
          // Revert UI changes if cancelled
          setAttendanceData(prev => 
            prev.map(student => ({ ...student, status: null }))
          );
          setHasChanges(false);
        }},
        {
          text: `Mark All ${statusText}`,
          style: status === 'present' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await markBulkAttendanceMutation.mutateAsync({
                classId: selectedClass.id,
                date: dateString,
                status,
                markedBy: profile.auth_id,
                markedByRoleCode: profile.role || 'unknown',
                schoolCode: scope.school_code,
              });
              Alert.alert('Success', `All students marked as ${statusText.toLowerCase()}`);
            } catch (error) {
              console.error('Bulk attendance error:', error);
              Alert.alert('Error', 'Failed to mark bulk attendance');
              // Revert UI changes on error
              setAttendanceData(prev => 
                prev.map(student => ({ ...student, status: null }))
              );
              setHasChanges(false);
            }
          }
        }
      ]
    );
  };

  if (!selectedClass) {
    return (
      <View style={styles.emptyContainer}>
        <Users size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>Please select a class to view attendance</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Filters Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            {/* Class Filter */}
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => setShowClassDropdown(true)}
            >
              <View style={styles.filterIcon}>
                <Users size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.filterContent}>
                <Text style={styles.filterLabel}>Class</Text>
                <Text style={styles.filterValue}>
                  {selectedClass ? `${selectedClass.grade} ${selectedClass.section}` : 'Select'}
                </Text>
              </View>
              <ChevronDown size={14} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.filterDivider} />

            {/* Date Filter */}
            <TouchableOpacity 
              style={styles.filterItem}
              onPress={() => {
                setShowDatePicker(true);
              }}
            >
              <View style={styles.filterIcon}>
                <Calendar size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.filterContent}>
                <Text style={styles.filterLabel}>Date</Text>
                <Text style={styles.filterValue}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Students Section */}
        <View style={styles.studentsSection}>
          <View style={styles.studentsHeader}>
            <Text style={styles.sectionTitle}>Students</Text>
            <Text style={styles.studentsCount}>
              {attendanceData.filter(s => s.status === null).length} unmarked
            </Text>
          </View>

          <View style={styles.studentsList}>
            {studentsLoading || attendanceLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.loadingText}>Loading students...</Text>
              </View>
            ) : (
              attendanceData.map((student) => (
                <View key={student.studentId} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.studentName}</Text>
                    <Text style={styles.studentCode}>{student.studentCode}</Text>
                  </View>
                  
                  {canMark && (
                    <View style={styles.statusButtons}>
                      <TouchableOpacity
                        style={[
                          styles.statusButton,
                          student.status === 'present' && styles.statusButtonActive
                        ]}
                        onPress={() => handleStatusChange(student.studentId, 'present')}
                      >
                        <CheckCircle 
                          size={16} 
                          color={student.status === 'present' ? colors.text.inverse : colors.success[600]} 
                        />
                        <Text style={[
                          styles.statusButtonText,
                          student.status === 'present' && styles.statusButtonTextActive
                        ]}>
                          Present
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.statusButton,
                          student.status === 'absent' && styles.statusButtonActive
                        ]}
                        onPress={() => handleStatusChange(student.studentId, 'absent')}
                      >
                        <XCircle 
                          size={16} 
                          color={student.status === 'absent' ? colors.text.inverse : colors.error[600]} 
                        />
                        <Text style={[
                          styles.statusButtonText,
                          student.status === 'absent' && styles.statusButtonTextActive
                        ]}>
                          Absent
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Bulk Actions */}
        {canMark && attendanceData.length > 0 && (
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => handleBulkMark('present')}
            >
              <CheckCircle size={16} color={colors.text.inverse} />
              <Text style={styles.bulkButtonText}>Mark All Present</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkButtonSecondary]}
              onPress={() => handleBulkMark('absent')}
            >
              <XCircle size={16} color={colors.error[600]} />
              <Text style={styles.bulkButtonTextSecondary}>Mark All Absent</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Class Dropdown Modal */}
      <Portal>
        <Modal
          visible={showClassDropdown}
          onDismiss={() => setShowClassDropdown(false)}
          contentContainerStyle={styles.dropdownModalContainer}
        >
          <Text style={styles.dropdownModalTitle}>Select Class ({classes?.length || 0} available)</Text>
          <ScrollView 
            style={styles.dropdownList}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {classes && classes.length > 0 ? classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => {
                  setSelectedClass(cls);
                  setHasChanges(true);
                  setShowClassDropdown(false);
                }}
                style={[
                  styles.dropdownItem,
                  selectedClass?.id === cls.id && styles.dropdownItemSelected
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedClass?.id === cls.id && styles.dropdownItemTextSelected
                ]}>
                  Grade {cls.grade} - Section {cls.section}
                </Text>
                {selectedClass?.id === cls.id && (
                  <Text style={styles.dropdownItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No classes available</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.dropdownActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowClassDropdown(false)} 
              style={styles.dropdownCloseButton}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onDismiss={handleDateCancel}
        onConfirm={handleDateConfirm}
        initialDate={selectedDate}
        minimumDate={new Date(2020, 0, 1)}
        maximumDate={new Date(2030, 11, 31)}
      />

      {/* Save Button */}
      {hasChanges && canMark && (
        <FAB
          icon={() => <Save size={20} color={colors.surface.primary} />}
          style={styles.fab}
          onPress={handleSave}
          loading={markAttendanceMutation.isPending}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  filterRow: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  filterContent: {
    flex: 1,
  },
  filterLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  filterValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  inlineDatePicker: {
    height: 40,
    width: 120,
  },
  filterDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing.md,
  },
  studentsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  studentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  studentsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  studentsList: {
    gap: spacing.md,
  },
  studentCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  studentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  studentCode: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: spacing.xs,
    minWidth: 80,
  },
  statusButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  statusButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  statusButtonTextActive: {
    color: colors.text.inverse,
  },
  bulkActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
    gap: spacing.sm,
  },
  bulkButtonSecondary: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.error[600],
  },
  bulkButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  bulkButtonTextSecondary: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[600],
  },
  dropdownModalContainer: {
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignSelf: 'center',
    width: '90%',
  },
  dropdownModalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dropdownList: {
    marginBottom: spacing.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  dropdownItemCheck: {
    fontSize: typography.fontSize.base,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  dropdownActions: {
    marginTop: spacing.xs,
  },
  dropdownCloseButton: {
    borderColor: colors.border.DEFAULT,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  studentsHeaderContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  studentsHeaderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  studentsHeaderSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  bulkButtonPresent: {
    flex: 1,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  bulkButtonAbsent: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.error[600],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  bulkButtonReset: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  historyContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  historyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  historySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  historyStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryList: {
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  summaryStudentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  summaryStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  summaryStatusPresent: {
    backgroundColor: colors.success[100],
  },
  summaryStatusAbsent: {
    backgroundColor: colors.error[100],
  },
  summaryStatusUnmarked: {
    backgroundColor: colors.background.secondary,
  },
  summaryStatusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  summaryStatusTextPresent: {
    color: colors.success[700],
  },
  summaryStatusTextAbsent: {
    color: colors.error[700],
  },
  summaryStatusTextUnmarked: {
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});