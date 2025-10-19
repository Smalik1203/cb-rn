import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { Text, Chip, Button, SegmentedButtons, Card, Portal, Modal, ProgressBar, TextInput } from 'react-native-paper';
import { Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceService } from '@/lib/services/attendanceService';

type AttendanceStatus = 'present' | 'absent' | null;

interface StudentAttendance {
  id: string;
  full_name: string;
  status: AttendanceStatus;
}

export default function AttendanceScreen() {
  const { userMetadata, user } = useAuth();
  const role = userMetadata?.role || 'student';
  const schoolCode = userMetadata?.schoolCode || '';

  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);
  const [holiday, setHoliday] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isStudent = role === 'student';
  const canMark = role === 'admin' || role === 'superadmin';

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    loadClasses();
  }, [role, user]);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      loadStudentsAndAttendance();
      checkHoliday();
    }
  }, [selectedClassId, selectedDate]);

  const loadClasses = async () => {
    try {
      let data: any[] = [];
      if (isStudent) {
        const studentProfile = await AttendanceService.getStudentProfile('', schoolCode);
        setSelectedClassId(studentProfile.class_instance_id);
        data = [];
      } else if (role === 'admin') {
        data = await AttendanceService.getClassesForAdmin(user?.id || '');
      } else {
        data = await AttendanceService.getClassesForSchool(schoolCode);
      }
      setClasses(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load classes');
    }
  };

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const studentData = await AttendanceService.getStudentsByClass(selectedClassId);
      const existingAttendance = await AttendanceService.getExistingAttendance(
        selectedClassId,
        formatDate(selectedDate)
      );

      const attendanceMap = new Map(
        existingAttendance.map(a => [a.student_id, a.status])
      );

      const studentsWithStatus = studentData.map(student => ({
        ...student,
        status: attendanceMap.get(student.id) || null,
      }));

      setStudents(studentsWithStatus);
      setHasExistingAttendance(existingAttendance.length > 0);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const checkHoliday = async () => {
    try {
      const holidayData = await AttendanceService.checkHoliday(
        schoolCode,
        formatDate(selectedDate),
        selectedClassId
      );
      setHoliday(holidayData);
    } catch (error) {
      setHoliday(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudentsAndAttendance();
    setRefreshing(false);
  };

  const toggleStudentStatus = (studentId: string) => {
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === studentId) {
          let newStatus: AttendanceStatus;
          if (student.status === null) {
            newStatus = 'present';
          } else if (student.status === 'present') {
            newStatus = 'absent';
          } else {
            newStatus = null;
          }
          return { ...student, status: newStatus };
        }
        return student;
      })
    );
  };

  const markAll = (status: 'present' | 'absent') => {
    setStudents(prevStudents =>
      prevStudents.map(student => ({ ...student, status }))
    );
  };

  const resetAttendance = () => {
    setStudents(prevStudents =>
      prevStudents.map(student => ({ ...student, status: null }))
    );
  };

  const handleSave = () => {
    const unmarkedCount = students.filter(s => s.status === null).length;
    if (unmarkedCount > 0) {
      Alert.alert('Incomplete', `Please mark all students. ${unmarkedCount} unmarked.`);
      return;
    }

    if (holiday || selectedDate.getDay() === 0) {
      Alert.alert('Holiday', 'Cannot mark attendance on holidays or Sundays');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);

    try {
      const records = students.map(student => ({
        student_id: student.id,
        class_instance_id: selectedClassId,
        date: formatDate(selectedDate),
        status: student.status!,
        marked_by: user?.id || '',
        marked_by_role_code: userMetadata?.adminId || '',
        school_code: schoolCode,
      }));

      await AttendanceService.saveAttendance(records);
      Alert.alert('Success', 'Attendance saved successfully ✅');
      setHasExistingAttendance(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: students.length,
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    unmarked: students.filter(s => s.status === null).length,
    percentage: students.length > 0
      ? Math.round((students.filter(s => s.status !== null).length / students.length) * 100)
      : 0,
  };

  const renderClassPicker = () => (
    <View style={styles.pickerWrapper}>
      {classes.map(cls => (
        <TouchableOpacity
          key={cls.id}
          style={[
            styles.classChip,
            selectedClassId === cls.id && styles.classChipSelected
          ]}
          onPress={() => setSelectedClassId(cls.id)}
        >
          <Text style={[
            styles.classChipText,
            selectedClassId === cls.id && styles.classChipTextSelected
          ]}>
            Grade {cls.grade}-{cls.section}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMarkAttendance = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Card style={styles.filterCard}>
        <Card.Content>
          {!isStudent && (
            <View style={styles.filterGroup}>
              <Text variant="labelLarge" style={styles.label}>Select Class</Text>
              {renderClassPicker()}
            </View>
          )}

          <View style={styles.filterGroup}>
            <View style={styles.labelRow}>
              <Text variant="labelLarge" style={styles.label}>Date</Text>
              <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
                <Text style={styles.todayLink}>Today</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDateInput(formatDisplayDate(selectedDate));
                setShowDatePicker(true);
              }}
              disabled={!selectedClassId && !isStudent}
            >
              <Calendar size={20} color="#667eea" />
              <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {holiday && (
        <Card style={[styles.card, styles.holidayCard]}>
          <Card.Content>
            <View style={styles.holidayContent}>
              <Text style={styles.holidayIcon}>🎉</Text>
              <Text variant="titleMedium" style={styles.holidayTitle}>
                {holiday.title}
              </Text>
              <Text variant="bodySmall" style={styles.holidayDesc}>
                {holiday.description || 'Holiday - Attendance not applicable'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {selectedClassId && !holiday && selectedDate.getDay() !== 0 && (
        <>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.statsTitle}>
                Progress ({stats.percentage}%)
              </Text>
              <ProgressBar progress={stats.percentage / 100} color="#667eea" style={styles.progress} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <CheckCircle size={20} color="#10b981" />
                  <Text style={styles.statValue}>{stats.present}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <XCircle size={20} color="#ef4444" />
                  <Text style={styles.statValue}>{stats.absent}</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                  <Clock size={20} color="#6b7280" />
                  <Text style={styles.statValue}>{stats.unmarked}</Text>
                  <Text style={styles.statLabel}>Unmarked</Text>
                </View>
              </View>

              <View style={styles.bulkActions}>
                <Button
                  mode="contained"
                  onPress={() => markAll('present')}
                  buttonColor="#10b981"
                  style={styles.bulkButton}
                  compact
                >
                  All Present
                </Button>
                <Button
                  mode="contained"
                  onPress={() => markAll('absent')}
                  buttonColor="#ef4444"
                  style={styles.bulkButton}
                  compact
                >
                  All Absent
                </Button>
                <Button
                  mode="outlined"
                  onPress={resetAttendance}
                  style={styles.bulkButton}
                  compact
                >
                  Reset
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.studentsList}>
            {students.map(student => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => canMark && toggleStudentStatus(student.id)}
                disabled={!canMark}
              >
                <Text style={styles.studentName}>{student.full_name}</Text>
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    student.status === 'present' && styles.presentChip,
                    student.status === 'absent' && styles.absentChip,
                  ]}
                  textStyle={styles.statusText}
                >
                  {student.status === 'present' && '🟢 Present'}
                  {student.status === 'absent' && '🔴 Absent'}
                  {student.status === null && '⚪ Unmarked'}
                </Chip>
              </TouchableOpacity>
            ))}
          </View>

          {canMark && (
            <View style={styles.saveContainer}>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={stats.unmarked > 0 || saving}
                style={styles.saveButton}
                buttonColor="#667eea"
              >
                {hasExistingAttendance ? 'Update Attendance' : 'Save Attendance'}
              </Button>
            </View>
          )}
        </>
      )}

      {!selectedClassId && !isStudent && (
        <View style={styles.emptyState}>
          <Users size={64} color="#d1d5db" />
          <Text variant="titleLarge" style={styles.emptyTitle}>Select a class</Text>
          <Text variant="bodyMedium" style={styles.emptyDesc}>
            Choose a class to view students and mark attendance
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Attendance</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Mark and track student attendance</Text>
      </View>

      {!isStudent && (
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'mark' | 'history')}
          buttons={[
            { value: 'mark', label: 'Mark', icon: 'check' },
            { value: 'history', label: 'History', icon: 'history' },
          ]}
          style={styles.tabs}
        />
      )}

      {activeTab === 'mark' ? renderMarkAttendance() : <View style={styles.tabContent}><Text>History coming soon</Text></View>}

      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => setShowConfirmModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Confirm Submission</Text>
          <View style={styles.modalStats}>
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatValue, { color: '#10b981' }]}>{stats.present}</Text>
              <Text style={styles.modalStatLabel}>Present</Text>
            </View>
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatValue, { color: '#ef4444' }]}>{stats.absent}</Text>
              <Text style={styles.modalStatLabel}>Absent</Text>
            </View>
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatValue, { color: '#6b7280' }]}>{stats.total}</Text>
              <Text style={styles.modalStatLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowConfirmModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={confirmSave} style={styles.modalButton} buttonColor="#667eea">
              Confirm
            </Button>
          </View>
        </Modal>

        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Select Date</Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>Enter date in DD-MM-YYYY format</Text>
          <TextInput
            mode="outlined"
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="DD-MM-YYYY"
            style={styles.dateInput}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowDatePicker(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                const parts = dateInput.split('-');
                if (parts.length === 3) {
                  const date = new Date(
                    parseInt(parts[2]),
                    parseInt(parts[1]) - 1,
                    parseInt(parts[0])
                  );
                  if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                  } else {
                    Alert.alert('Invalid Date', 'Please enter a valid date in DD-MM-YYYY format');
                  }
                } else {
                  Alert.alert('Invalid Format', 'Please enter date in DD-MM-YYYY format');
                }
              }}
              style={styles.modalButton}
              buttonColor="#667eea"
            >
              Select
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
  },
  tabs: {
    margin: 16,
    marginBottom: 8,
  },
  tabContent: {
    flex: 1,
  },
  filterCard: {
    margin: 16,
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#374151',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  classChipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#667eea',
  },
  classChipText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  classChipTextSelected: {
    color: '#667eea',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  holidayCard: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  holidayContent: {
    alignItems: 'center',
  },
  holidayIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  holidayTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#92400e',
  },
  holidayDesc: {
    color: '#78350f',
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statsTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  progress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    flex: 1,
  },
  studentsList: {
    paddingHorizontal: 16,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  statusChip: {
    backgroundColor: '#f3f4f6',
  },
  presentChip: {
    backgroundColor: '#d1fae5',
  },
  absentChip: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 16,
  },
  saveButton: {
    paddingVertical: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#6b7280',
  },
  emptyDesc: {
    textAlign: 'center',
    color: '#9ca3af',
  },
  card: {
    marginBottom: 16,
  },
  modal: {
    backgroundColor: '#ffffff',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#6b7280',
  },
  dateInput: {
    marginBottom: 24,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
