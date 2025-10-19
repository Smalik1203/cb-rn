import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, Chip, Button, SegmentedButtons, Card, Portal, Modal, ProgressBar, Searchbar, FAB } from 'react-native-paper';
import { Calendar, Users, CheckCircle, XCircle, Clock, TrendingUp, Filter, Download, Bell } from 'lucide-react-native';

type AttendanceStatus = 'present' | 'absent' | null;

interface StudentAttendance {
  id: string;
  full_name: string;
  roll_number: string;
  status: AttendanceStatus;
}

interface HistoryRecord {
  id: string;
  date: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

const MOCK_CLASSES = [
  { id: '1', grade: 10, section: 'A' },
  { id: '2', grade: 10, section: 'B' },
  { id: '3', grade: 11, section: 'A' },
  { id: '4', grade: 11, section: 'B' },
  { id: '5', grade: 12, section: 'A' },
];

const MOCK_STUDENTS: StudentAttendance[] = [
  { id: '1', full_name: 'Aarav Sharma', roll_number: '101', status: null },
  { id: '2', full_name: 'Ananya Patel', roll_number: '102', status: null },
  { id: '3', full_name: 'Arjun Kumar', roll_number: '103', status: null },
  { id: '4', full_name: 'Diya Singh', roll_number: '104', status: null },
  { id: '5', full_name: 'Ishaan Reddy', roll_number: '105', status: null },
  { id: '6', full_name: 'Kavya Iyer', roll_number: '106', status: null },
  { id: '7', full_name: 'Krishna Menon', roll_number: '107', status: null },
  { id: '8', full_name: 'Lakshmi Nair', roll_number: '108', status: null },
  { id: '9', full_name: 'Manav Gupta', roll_number: '109', status: null },
  { id: '10', full_name: 'Neha Joshi', roll_number: '110', status: null },
  { id: '11', full_name: 'Priya Agarwal', roll_number: '111', status: null },
  { id: '12', full_name: 'Rohan Verma', roll_number: '112', status: null },
  { id: '13', full_name: 'Saanvi Desai', roll_number: '113', status: null },
  { id: '14', full_name: 'Vivaan Kapoor', roll_number: '114', status: null },
  { id: '15', full_name: 'Zara Khan', roll_number: '115', status: null },
];

const MOCK_HISTORY: HistoryRecord[] = [
  { id: '1', date: '2025-10-18', present: 13, absent: 2, total: 15, percentage: 87 },
  { id: '2', date: '2025-10-17', present: 14, absent: 1, total: 15, percentage: 93 },
  { id: '3', date: '2025-10-16', present: 12, absent: 3, total: 15, percentage: 80 },
  { id: '4', date: '2025-10-15', present: 15, absent: 0, total: 15, percentage: 100 },
  { id: '5', date: '2025-10-14', present: 13, absent: 2, total: 15, percentage: 87 },
  { id: '6', date: '2025-10-11', present: 14, absent: 1, total: 15, percentage: 93 },
  { id: '7', date: '2025-10-10', present: 12, absent: 3, total: 15, percentage: 80 },
];

export default function AttendanceDemoScreen() {
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'analytics'>('mark');
  const [selectedClassId, setSelectedClassId] = useState('1');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<StudentAttendance[]>(MOCK_STUDENTS);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
    setShowConfirmModal(true);
  };

  const confirmSave = () => {
    setShowConfirmModal(false);
    Alert.alert('Success', 'Attendance saved successfully! ✅');
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.includes(searchQuery);

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'present' && student.status === 'present') ||
      (filterStatus === 'absent' && student.status === 'absent') ||
      (filterStatus === 'unmarked' && student.status === null);

    return matchesSearch && matchesFilter;
  });

  const renderClassPicker = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
      {MOCK_CLASSES.map(cls => (
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
            {cls.grade}-{cls.section}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMarkAttendance = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.dateCard}>
        <Card.Content>
          <View style={styles.dateHeader}>
            <View style={styles.dateLeft}>
              <Calendar size={24} color="#667eea" />
              <View style={styles.dateInfo}>
                <Text variant="labelSmall" style={styles.dateLabel}>Today's Date</Text>
                <Text variant="titleMedium" style={styles.dateValue}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
            <Chip icon="calendar" mode="outlined" style={styles.todayChip}>Today</Chip>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.classSection}>
        <Text variant="titleSmall" style={styles.sectionTitle}>Select Class</Text>
        {renderClassPicker()}
      </View>

      <Card style={styles.statsCard} elevation={2}>
        <Card.Content>
          <View style={styles.statsHeader}>
            <Text variant="titleMedium" style={styles.statsTitle}>Attendance Progress</Text>
            <Text variant="headlineSmall" style={styles.statsPercentage}>{stats.percentage}%</Text>
          </View>
          <ProgressBar progress={stats.percentage / 100} color="#667eea" style={styles.progress} />

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
                <CheckCircle size={20} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#fee2e2' }]}>
                <XCircle size={20} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#f3f4f6' }]}>
                <Clock size={20} color="#6b7280" />
              </View>
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
              icon="check-all"
            >
              All Present
            </Button>
            <Button
              mode="contained"
              onPress={() => markAll('absent')}
              buttonColor="#ef4444"
              style={styles.bulkButton}
              compact
              icon="close-circle"
            >
              All Absent
            </Button>
            <Button
              mode="outlined"
              onPress={resetAttendance}
              style={styles.bulkButton}
              compact
              icon="refresh"
            >
              Reset
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.studentsSection}>
        <View style={styles.studentsSectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Students ({filteredStudents.length})
          </Text>
        </View>

        <Searchbar
          placeholder="Search by name or roll number..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#667eea"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Chip
            selected={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
            style={styles.filterChip}
            selectedColor="#667eea"
          >
            All
          </Chip>
          <Chip
            selected={filterStatus === 'present'}
            onPress={() => setFilterStatus('present')}
            style={styles.filterChip}
            selectedColor="#10b981"
          >
            Present
          </Chip>
          <Chip
            selected={filterStatus === 'absent'}
            onPress={() => setFilterStatus('absent')}
            style={styles.filterChip}
            selectedColor="#ef4444"
          >
            Absent
          </Chip>
          <Chip
            selected={filterStatus === 'unmarked'}
            onPress={() => setFilterStatus('unmarked')}
            style={styles.filterChip}
            selectedColor="#6b7280"
          >
            Unmarked
          </Chip>
        </ScrollView>

        <View style={styles.studentsList}>
          {filteredStudents.map((student, index) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentCard,
                index === filteredStudents.length - 1 && styles.studentCardLast
              ]}
              onPress={() => toggleStudentStatus(student.id)}
              activeOpacity={0.7}
            >
              <View style={styles.studentLeft}>
                <View style={[
                  styles.studentAvatar,
                  student.status === 'present' && styles.studentAvatarPresent,
                  student.status === 'absent' && styles.studentAvatarAbsent,
                ]}>
                  <Text style={styles.studentAvatarText}>
                    {student.full_name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.full_name}</Text>
                  <Text style={styles.studentRoll}>Roll No: {student.roll_number}</Text>
                </View>
              </View>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  student.status === 'present' && styles.presentChip,
                  student.status === 'absent' && styles.absentChip,
                ]}
                textStyle={styles.statusText}
              >
                {student.status === 'present' && '✓ Present'}
                {student.status === 'absent' && '✕ Absent'}
                {student.status === null && '○ Mark'}
              </Chip>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.saveContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={stats.unmarked > 0}
          style={styles.saveButton}
          buttonColor="#667eea"
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonLabel}
          icon="content-save"
        >
          Save Attendance
        </Button>
        {stats.unmarked > 0 && (
          <Text style={styles.saveHint}>
            Mark all students to save ({stats.unmarked} remaining)
          </Text>
        )}
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.historyCard}>
        <Card.Content>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium">Attendance History</Text>
            <Button mode="outlined" compact icon="calendar-month" onPress={() => Alert.alert('Filter', 'Date range picker')}>
              This Week
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.historyList}>
        {MOCK_HISTORY.map(record => (
          <Card key={record.id} style={styles.historyItem} elevation={1}>
            <Card.Content>
              <View style={styles.historyItemHeader}>
                <View style={styles.historyDateSection}>
                  <Text style={styles.historyDate}>
                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </Text>
                  <Text style={styles.historyYear}>
                    {new Date(record.date).getFullYear()}
                  </Text>
                </View>
                <View style={styles.historyStats}>
                  <View style={styles.historyStatItem}>
                    <Text style={[styles.historyStatValue, { color: '#10b981' }]}>
                      {record.present}
                    </Text>
                    <Text style={styles.historyStatLabel}>Present</Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <Text style={[styles.historyStatValue, { color: '#ef4444' }]}>
                      {record.absent}
                    </Text>
                    <Text style={styles.historyStatLabel}>Absent</Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <View style={[
                      styles.percentageBadge,
                      { backgroundColor: record.percentage >= 90 ? '#d1fae5' : record.percentage >= 75 ? '#fef3c7' : '#fee2e2' }
                    ]}>
                      <Text style={[
                        styles.percentageText,
                        { color: record.percentage >= 90 ? '#10b981' : record.percentage >= 75 ? '#f59e0b' : '#ef4444' }
                      ]}>
                        {record.percentage}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => {
    const weeklyAverage = Math.round(
      MOCK_HISTORY.slice(0, 7).reduce((sum, r) => sum + r.percentage, 0) / 7
    );
    const trend = weeklyAverage >= 85 ? 'excellent' : weeklyAverage >= 75 ? 'good' : 'needs improvement';

    return (
      <ScrollView style={styles.tabContent}>
        <Card style={styles.analyticsCard} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.analyticsTitle}>Weekly Overview</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <TrendingUp size={32} color="#667eea" />
                <Text style={styles.analyticsValue}>{weeklyAverage}%</Text>
                <Text style={styles.analyticsLabel}>Average</Text>
                <Chip mode="flat" style={styles.trendChip} textStyle={{ fontSize: 11 }}>
                  {trend}
                </Chip>
              </View>
              <View style={styles.analyticsItem}>
                <Users size={32} color="#10b981" />
                <Text style={styles.analyticsValue}>{students.length}</Text>
                <Text style={styles.analyticsLabel}>Total Students</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.insightsTitle}>Insights</Text>
            <View style={styles.insightItem}>
              <View style={styles.insightIcon}>
                <CheckCircle size={20} color="#10b981" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightText}>Best day: October 15 (100% attendance)</Text>
                <Text style={styles.insightSubtext}>Keep up the great work!</Text>
              </View>
            </View>
            <View style={styles.insightItem}>
              <View style={styles.insightIcon}>
                <Bell size={20} color="#f59e0b" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightText}>3 students with low attendance</Text>
                <Text style={styles.insightSubtext}>Consider follow-up</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.headerTitle}>Attendance</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Grade 10-A • Demo Mode</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Download size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        buttons={[
          { value: 'mark', label: 'Mark', icon: 'check' },
          { value: 'history', label: 'History', icon: 'history' },
          { value: 'analytics', label: 'Insights', icon: 'chart-line' },
        ]}
        style={styles.tabs}
      />

      {activeTab === 'mark' && renderMarkAttendance()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'analytics' && renderAnalytics()}

      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => setShowConfirmModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <CheckCircle size={48} color="#667eea" />
            </View>
            <Text variant="headlineSmall" style={styles.modalTitle}>Confirm Attendance</Text>
            <Text variant="bodyMedium" style={styles.modalSubtitle}>
              Review the summary before submitting
            </Text>
          </View>

          <View style={styles.modalStats}>
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatValue, { color: '#10b981' }]}>{stats.present}</Text>
              <Text style={styles.modalStatLabel}>Present</Text>
            </View>
            <View style={styles.modalDivider} />
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatValue, { color: '#ef4444' }]}>{stats.absent}</Text>
              <Text style={styles.modalStatLabel}>Absent</Text>
            </View>
            <View style={styles.modalDivider} />
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatValue, { color: '#6b7280' }]}>{stats.total}</Text>
              <Text style={styles.modalStatLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.modalInfo}>
            <Text style={styles.modalInfoText}>
              📅 {formatDate(selectedDate)} • Grade 10-A
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowConfirmModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmSave}
              style={styles.modalButton}
              buttonColor="#667eea"
            >
              Submit
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    margin: 16,
    marginBottom: 8,
  },
  tabContent: {
    flex: 1,
  },
  dateCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInfo: {
    gap: 2,
  },
  dateLabel: {
    color: '#6b7280',
  },
  dateValue: {
    fontWeight: '600',
    color: '#111827',
  },
  todayChip: {
    backgroundColor: '#ede9fe',
  },
  classSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#111827',
  },
  classScroll: {
    flexGrow: 0,
  },
  classChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  classChipSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  classChipText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 15,
  },
  classChipTextSelected: {
    color: '#ffffff',
  },
  statsCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  statsPercentage: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  progress: {
    height: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
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
  studentsSection: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  studentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#ffffff',
  },
  filterRow: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  studentsList: {
    gap: 0,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  studentCardLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  studentAvatarPresent: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  studentAvatarAbsent: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 13,
    color: '#6b7280',
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
    fontSize: 13,
    fontWeight: '600',
  },
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 8,
  },
  saveButton: {
    paddingVertical: 4,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveHint: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  modal: {
    backgroundColor: '#ffffff',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    elevation: 8,
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
    marginBottom: 8,
    color: '#111827',
  },
  modalSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  modalStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalInfo: {
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginBottom: 20,
  },
  modalInfoText: {
    textAlign: 'center',
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  historyCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  historyItem: {
    backgroundColor: '#ffffff',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyDateSection: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 2,
    borderRightColor: '#e5e7eb',
  },
  historyDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  historyYear: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyStats: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  historyStatItem: {
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyStatLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyticsCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  analyticsTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 8,
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  analyticsLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  trendChip: {
    marginTop: 4,
    backgroundColor: '#ede9fe',
  },
  insightsCard: {
    margin: 16,
    backgroundColor: '#ffffff',
  },
  insightsTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  insightItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  insightSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
});
