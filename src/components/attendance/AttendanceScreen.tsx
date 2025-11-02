import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Text, Card, Button, SegmentedButtons, ActivityIndicator, FAB, Menu, Portal, Modal } from 'react-native-paper';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [historyStartDate, setHistoryStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date;
  });
  const [historyEndDate, setHistoryEndDate] = useState<Date>(new Date());
  const [showHistoryStartDatePicker, setShowHistoryStartDatePicker] = useState(false);
  const [showHistoryEndDatePicker, setShowHistoryEndDatePicker] = useState(false);
  
  // Bottom sheet ref for class selector
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  
  // Snapshot index for bottom sheet
  const snapPoints = useMemo(() => ['75%'], []);

  const dateString = selectedDate.toISOString().split('T')[0];
  const historyStartDateString = historyStartDate.toISOString().split('T')[0];
  const historyEndDateString = historyEndDate.toISOString().split('T')[0];
  const canMark = profile?.role === 'admin' || profile?.role === 'superadmin';

  // Fetch data
  const { data: classes = [] } = useClasses(scope.school_code);
  // Fetch all students without pagination for attendance
  const { data: studentsResponse, isLoading: studentsLoading } = useStudents(
    selectedClass?.id,
    scope.school_code
    // No pagination options = fetch all students
  );
  const students = studentsResponse?.data || [];

  const { data: existingAttendance = [], isLoading: attendanceLoading } = useClassAttendance(
    selectedClass?.id,
    dateString
  );

  const { data: attendanceSummary = [], isLoading: summaryLoading } = useClassAttendanceSummary(
    activeTab === 'history' && selectedClass?.id ? selectedClass.id : undefined,
    activeTab === 'history' ? historyStartDateString : undefined,
    activeTab === 'history' ? historyEndDateString : undefined
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

  // Calculate history stats
  const totalPresentDays = attendanceSummary.reduce((sum, s) => sum + s.presentDays, 0);
  const totalAbsentDays = attendanceSummary.reduce((sum, s) => sum + s.absentDays, 0);
  const totalDays = attendanceSummary.reduce((sum, s) => sum + s.totalDays, 0);
  
  const historyStats = {
    total: attendanceSummary.length,
    averageAttendance: totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0,
    averageAbsent: totalDays > 0 ? Math.round((totalAbsentDays / totalDays) * 100) : 0,
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'mark' | 'history')}
          buttons={[
            {
              value: 'mark',
              label: 'Mark Attendance',
            },
            {
              value: 'history',
              label: 'View History',
            },
          ]}
          style={styles.tabSwitcher}
        />
      </View>

      {/* Quick Filters Section - Shared between both tabs */}
      <View style={styles.filterSection}>
        {activeTab === 'mark' ? (
          <>
          {/* Mark Attendance Filters */}
          <View style={styles.filterRow}>
            {/* Class Filter */}
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => bottomSheetRef.current?.present()}
            >
              <View style={styles.filterIcon}>
                <Users size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.filterContent}>
                <Text style={styles.filterLabel}>Class</Text>
                <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                  {selectedClass ? `${selectedClass.grade} ${selectedClass.section}` : 'Select'}
                </Text>
              </View>
              <ChevronDown size={14} color={colors.text.secondary} style={{ marginLeft: spacing.xs, flexShrink: 0 }} />
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
                <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          </>
        ) : (
          <>
          {/* History Filters */}
          <View style={styles.filterRow}>
            {/* Class Filter */}
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => bottomSheetRef.current?.present()}
            >
              <View style={styles.filterIcon}>
                <Users size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.filterContent}>
                <Text style={styles.filterLabel}>Class</Text>
                <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                  {selectedClass ? `${selectedClass.grade} ${selectedClass.section}` : 'Select'}
                </Text>
              </View>
              <ChevronDown size={14} color={colors.text.secondary} style={{ marginLeft: spacing.xs, flexShrink: 0 }} />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.filterDivider} />

            {/* Start Date Filter */}
            <TouchableOpacity 
              style={styles.filterItem}
              onPress={() => setShowHistoryStartDatePicker(true)}
            >
              <View style={styles.filterIcon}>
                <Calendar size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.filterContent}>
                <Text style={styles.filterLabel}>Start</Text>
                <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                  {historyStartDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.filterDivider} />

            {/* End Date Filter */}
            <TouchableOpacity 
              style={styles.filterItem}
              onPress={() => setShowHistoryEndDatePicker(true)}
            >
              <View style={styles.filterIcon}>
                <Calendar size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.filterContent}>
                <Text style={styles.filterLabel}>End</Text>
                <Text style={styles.filterValue} numberOfLines={1} ellipsizeMode="tail">
                  {historyEndDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          </>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'mark' ? (
          <>
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
          </>
        ) : (
          /* History Tab */
          <View style={styles.historyContainer}>
            {!selectedClass ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>Please select a class to view attendance history</Text>
              </View>
            ) : (
              <>

                {/* Summary Stats */}
                <View style={styles.historyStats}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{historyStats.total}</Text>
                    <Text style={styles.statLabel}>Total Students</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.success[600] }]}>{historyStats.averageAttendance}%</Text>
                    <Text style={styles.statLabel}>Avg Attendance</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.error[600] }]}>{historyStats.averageAbsent}%</Text>
                    <Text style={styles.statLabel}>Avg Absent</Text>
                  </View>
                </View>

                {/* Date Range Display */}
                <View style={styles.dateRangeContainer}>
                  <Text style={styles.dateRangeText}>
                    {historyStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {historyEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                {/* Attendance Summary List */}
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Student Summary</Text>
                  {summaryLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary[600]} />
                      <Text style={styles.loadingText}>Loading history...</Text>
                    </View>
                  ) : attendanceSummary.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No attendance records found for this period</Text>
                    </View>
                  ) : (
                    <View style={styles.summaryList}>
                      {attendanceSummary.map((student) => (
                        <View key={student.studentId} style={styles.summaryItem}>
                          <View style={styles.summaryStudentInfo}>
                            <Text style={styles.summaryStudentName}>{student.studentName}</Text>
                            <Text style={styles.studentCode}>{student.studentCode}</Text>
                          </View>
                          <View style={styles.summaryStats}>
                            <Text style={styles.summaryStatText}>
                              {student.presentDays} / {student.totalDays} ({student.percentage.toFixed(0)}%)
                            </Text>
                            <View style={[
                              styles.summaryStatus,
                              student.percentage >= 75 ? styles.summaryStatusPresent :
                              student.percentage >= 50 ? styles.summaryStatusUnmarked :
                              styles.summaryStatusAbsent
                            ]}>
                              <Text style={[
                                styles.summaryStatusText,
                                student.percentage >= 75 ? styles.summaryStatusTextPresent :
                                student.percentage >= 50 ? styles.summaryStatusTextUnmarked :
                                styles.summaryStatusTextAbsent
                              ]}>
                                {student.percentage >= 75 ? 'Good' : student.percentage >= 50 ? 'Fair' : 'Low'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Class Dropdown Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetScrollView 
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.bottomSheetTitle}>Select Class ({classes?.length || 0} available)</Text>
          {classes && classes.length > 0 ? classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              onPress={() => {
                setSelectedClass(cls);
                setHasChanges(true);
                bottomSheetRef.current?.dismiss();
              }}
              style={[
                styles.bottomSheetItem,
                selectedClass?.id === cls.id && styles.bottomSheetItemSelected
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.bottomSheetItemText,
                selectedClass?.id === cls.id && styles.bottomSheetItemTextSelected
              ]}>
                Grade {cls.grade} - Section {cls.section}
              </Text>
              {selectedClass?.id === cls.id && (
                <Text style={styles.bottomSheetItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No classes available</Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onDismiss={handleDateCancel}
        onConfirm={handleDateConfirm}
        initialDate={selectedDate}
        minimumDate={new Date(2020, 0, 1)}
        maximumDate={new Date(2030, 11, 31)}
      />

      {/* History Start Date Picker */}
      <DatePickerModal
        visible={showHistoryStartDatePicker}
        onDismiss={() => setShowHistoryStartDatePicker(false)}
        onConfirm={(date) => {
          setHistoryStartDate(date);
          setShowHistoryStartDatePicker(false);
        }}
        initialDate={historyStartDate}
        minimumDate={new Date(2020, 0, 1)}
        maximumDate={new Date(2030, 11, 31)}
        title="Select Start Date"
      />

      {/* History End Date Picker */}
      <DatePickerModal
        visible={showHistoryEndDatePicker}
        onDismiss={() => setShowHistoryEndDatePicker(false)}
        onConfirm={(date) => {
          setHistoryEndDate(date);
          setShowHistoryEndDatePicker(false);
        }}
        initialDate={historyEndDate}
        minimumDate={new Date(2020, 0, 1)}
        maximumDate={new Date(2030, 11, 31)}
        title="Select End Date"
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
  tabContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface.primary,
  },
  tabSwitcher: {
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
    paddingHorizontal: spacing.sm,
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
    minWidth: 0, // Allow flex items to shrink below content size
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  filterContent: {
    flex: 1,
    minWidth: 0, // Allow text to truncate properly
    alignItems: 'flex-start',
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
  datePickerModal: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    margin: spacing.xl,
    borderRadius: borderRadius.lg,
    maxHeight: '60%',
    minHeight: 300,
  },
  datePickerContainer: {
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  datePickerButton: {
    flex: 1,
  },
  filterDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: spacing.sm,
    flexShrink: 0,
  },
  customDatePickerModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  customDatePickerContainer: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.DEFAULT,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  customDatePicker: {
    height: 200,
    marginVertical: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  continueButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  continueButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  datePicker: {
    alignSelf: 'center',
    marginVertical: spacing.lg,
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
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.border.DEFAULT,
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  bottomSheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  bottomSheetItemSelected: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  bottomSheetItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  bottomSheetItemTextSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  bottomSheetItemCheck: {
    fontSize: typography.fontSize.lg,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  dateRangeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dateRangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  dateRangeButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
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
  summaryStudentInfo: {
    flex: 1,
  },
  summaryStudentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  summaryStats: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  summaryStatText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
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
  dateRangeContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
});