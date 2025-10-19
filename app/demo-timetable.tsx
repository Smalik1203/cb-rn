import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { Clock, MapPin, User, BookOpen, Calendar as CalendarIcon } from 'lucide-react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MOCK_TIMETABLE = {
  Monday: [
    { id: '1', subject: 'Mathematics', time: '9:00 - 10:00', teacher: 'Mr. Kumar', room: 'Room 201', color: '#667eea' },
    { id: '2', subject: 'Physics', time: '10:15 - 11:15', teacher: 'Dr. Singh', room: 'Lab 1', color: '#10b981' },
    { id: '3', subject: 'English', time: '11:30 - 12:30', teacher: 'Ms. Sharma', room: 'Room 105', color: '#f59e0b' },
    { id: '4', subject: 'Lunch Break', time: '12:30 - 1:15', teacher: '', room: 'Cafeteria', color: '#6b7280' },
    { id: '5', subject: 'Chemistry', time: '1:15 - 2:15', teacher: 'Dr. Patel', room: 'Lab 2', color: '#ec4899' },
    { id: '6', subject: 'Computer Science', time: '2:30 - 3:30', teacher: 'Mr. Reddy', room: 'Computer Lab', color: '#8b5cf6' },
  ],
  Tuesday: [
    { id: '1', subject: 'Chemistry', time: '9:00 - 10:00', teacher: 'Dr. Patel', room: 'Lab 2', color: '#ec4899' },
    { id: '2', subject: 'Mathematics', time: '10:15 - 11:15', teacher: 'Mr. Kumar', room: 'Room 201', color: '#667eea' },
    { id: '3', subject: 'Physical Education', time: '11:30 - 12:30', teacher: 'Coach Verma', room: 'Sports Ground', color: '#14b8a6' },
    { id: '4', subject: 'Lunch Break', time: '12:30 - 1:15', teacher: '', room: 'Cafeteria', color: '#6b7280' },
    { id: '5', subject: 'Biology', time: '1:15 - 2:15', teacher: 'Ms. Menon', room: 'Lab 3', color: '#84cc16' },
    { id: '6', subject: 'English', time: '2:30 - 3:30', teacher: 'Ms. Sharma', room: 'Room 105', color: '#f59e0b' },
  ],
  Wednesday: [
    { id: '1', subject: 'Physics', time: '9:00 - 10:00', teacher: 'Dr. Singh', room: 'Lab 1', color: '#10b981' },
    { id: '2', subject: 'English', time: '10:15 - 11:15', teacher: 'Ms. Sharma', room: 'Room 105', color: '#f59e0b' },
    { id: '3', subject: 'Mathematics', time: '11:30 - 12:30', teacher: 'Mr. Kumar', room: 'Room 201', color: '#667eea' },
    { id: '4', subject: 'Lunch Break', time: '12:30 - 1:15', teacher: '', room: 'Cafeteria', color: '#6b7280' },
    { id: '5', subject: 'Computer Science', time: '1:15 - 2:15', teacher: 'Mr. Reddy', room: 'Computer Lab', color: '#8b5cf6' },
    { id: '6', subject: 'Hindi', time: '2:30 - 3:30', teacher: 'Mrs. Gupta', room: 'Room 103', color: '#f97316' },
  ],
  Thursday: [
    { id: '1', subject: 'Biology', time: '9:00 - 10:00', teacher: 'Ms. Menon', room: 'Lab 3', color: '#84cc16' },
    { id: '2', subject: 'Chemistry', time: '10:15 - 11:15', teacher: 'Dr. Patel', room: 'Lab 2', color: '#ec4899' },
    { id: '3', subject: 'Physical Education', time: '11:30 - 12:30', teacher: 'Coach Verma', room: 'Sports Ground', color: '#14b8a6' },
    { id: '4', subject: 'Lunch Break', time: '12:30 - 1:15', teacher: '', room: 'Cafeteria', color: '#6b7280' },
    { id: '5', subject: 'Mathematics', time: '1:15 - 2:15', teacher: 'Mr. Kumar', room: 'Room 201', color: '#667eea' },
    { id: '6', subject: 'English', time: '2:30 - 3:30', teacher: 'Ms. Sharma', room: 'Room 105', color: '#f59e0b' },
  ],
  Friday: [
    { id: '1', subject: 'Computer Science', time: '9:00 - 10:00', teacher: 'Mr. Reddy', room: 'Computer Lab', color: '#8b5cf6' },
    { id: '2', subject: 'Physics', time: '10:15 - 11:15', teacher: 'Dr. Singh', room: 'Lab 1', color: '#10b981' },
    { id: '3', subject: 'Hindi', time: '11:30 - 12:30', teacher: 'Mrs. Gupta', room: 'Room 103', color: '#f97316' },
    { id: '4', subject: 'Lunch Break', time: '12:30 - 1:15', teacher: '', room: 'Cafeteria', color: '#6b7280' },
    { id: '5', subject: 'Chemistry', time: '1:15 - 2:15', teacher: 'Dr. Patel', room: 'Lab 2', color: '#ec4899' },
    { id: '6', subject: 'Mathematics', time: '2:30 - 3:30', teacher: 'Mr. Kumar', room: 'Room 201', color: '#667eea' },
  ],
  Saturday: [
    { id: '1', subject: 'Biology', time: '9:00 - 10:00', teacher: 'Ms. Menon', room: 'Lab 3', color: '#84cc16' },
    { id: '2', subject: 'English', time: '10:15 - 11:15', teacher: 'Ms. Sharma', room: 'Room 105', color: '#f59e0b' },
    { id: '3', subject: 'Co-curricular Activities', time: '11:30 - 12:30', teacher: 'Various', room: 'Multiple', color: '#14b8a6' },
  ],
};

export default function DemoTimetableScreen() {
  const getCurrentDay = () => {
    const dayIndex = new Date().getDay();
    return dayIndex === 0 ? 'Monday' : DAYS[dayIndex - 1];
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const schedule = MOCK_TIMETABLE[selectedDay as keyof typeof MOCK_TIMETABLE];

  const renderDayView = () => (
    <ScrollView style={styles.content}>
      <Card style={styles.infoCard} elevation={2}>
        <Card.Content>
          <View style={styles.infoHeader}>
            <CalendarIcon size={24} color="#667eea" />
            <View style={styles.infoText}>
              <Text variant="titleMedium" style={styles.infoTitle}>
                {selectedDay}'s Schedule
              </Text>
              <Text variant="bodySmall" style={styles.infoSubtitle}>
                {schedule.length} periods • Grade 10-A
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                selectedDay === day && styles.dayChipSelected
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[
                styles.dayChipText,
                selectedDay === day && styles.dayChipTextSelected
              ]}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.scheduleList}>
        {schedule.map((period, index) => (
          <Card key={period.id} style={styles.periodCard} elevation={1}>
            <View style={[styles.periodBorder, { backgroundColor: period.color }]} />
            <Card.Content style={styles.periodContent}>
              <View style={styles.periodHeader}>
                <View style={styles.periodLeft}>
                  <View style={[styles.periodIcon, { backgroundColor: `${period.color}20` }]}>
                    <BookOpen size={20} color={period.color} />
                  </View>
                  <View style={styles.periodInfo}>
                    <Text style={styles.periodSubject}>{period.subject}</Text>
                    {period.teacher && (
                      <View style={styles.periodDetail}>
                        <User size={14} color="#6b7280" />
                        <Text style={styles.periodDetailText}>{period.teacher}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {index === 0 && selectedDay === getCurrentDay() && (
                  <Chip mode="flat" style={styles.currentChip} textStyle={styles.currentText}>
                    Current
                  </Chip>
                )}
              </View>

              <View style={styles.periodMeta}>
                <View style={styles.periodMetaItem}>
                  <Clock size={14} color="#667eea" />
                  <Text style={styles.periodMetaText}>{period.time}</Text>
                </View>
                <View style={styles.periodMetaItem}>
                  <MapPin size={14} color="#667eea" />
                  <Text style={styles.periodMetaText}>{period.room}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderWeekView = () => (
    <ScrollView style={styles.content}>
      {DAYS.map((day) => {
        const daySchedule = MOCK_TIMETABLE[day as keyof typeof MOCK_TIMETABLE];
        return (
          <View key={day} style={styles.weekDay}>
            <View style={styles.weekDayHeader}>
              <Text style={styles.weekDayTitle}>{day}</Text>
              <Text style={styles.weekDayCount}>{daySchedule.length} periods</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.weekPeriods}>
                {daySchedule.map((period) => (
                  <View key={period.id} style={[styles.weekPeriodCard, { borderLeftColor: period.color }]}>
                    <Text style={styles.weekPeriodSubject} numberOfLines={1}>
                      {period.subject}
                    </Text>
                    <Text style={styles.weekPeriodTime}>{period.time.split(' - ')[0]}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Timetable
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Academic Year 2024-25
        </Text>
      </View>

      <SegmentedButtons
        value={viewMode}
        onValueChange={(value) => setViewMode(value as 'day' | 'week')}
        buttons={[
          { value: 'day', label: 'Day View', icon: 'calendar-today' },
          { value: 'week', label: 'Week View', icon: 'calendar-week' },
        ]}
        style={styles.tabs}
      />

      {viewMode === 'day' ? renderDayView() : renderWeekView()}
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
  infoCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  infoSubtitle: {
    color: '#6b7280',
    marginTop: 2,
  },
  daySelector: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dayScroll: {
    flexGrow: 0,
  },
  dayChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  dayChipSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  dayChipText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  dayChipTextSelected: {
    color: '#ffffff',
  },
  scheduleList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  periodCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  periodBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  periodContent: {
    paddingLeft: 8,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  periodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  periodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodInfo: {
    flex: 1,
  },
  periodSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  periodDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  periodDetailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  currentChip: {
    backgroundColor: '#d1fae5',
  },
  currentText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 11,
  },
  periodMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  periodMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  periodMetaText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '500',
  },
  weekDay: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekDayCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  weekPeriods: {
    flexDirection: 'row',
    gap: 8,
  },
  weekPeriodCard: {
    width: 120,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
  },
  weekPeriodSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  weekPeriodTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});
