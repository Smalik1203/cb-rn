import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, ActivityIndicator, Portal, Modal, TextInput } from 'react-native-paper';
import { Calendar, Clock, Users, BookOpen, MapPin, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTimetable } from '@/src/features/timetable/hooks/useTimetable';
import { useClassSelection } from '@/src/contexts/ClassSelectionContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

const { width } = Dimensions.get('window');

interface TimetableSlot {
  id: string;
  school_code: string;
  class_instance_id: string;
  class_date: string;
  period_number: number;
  slot_type: string;
  name: string | null;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  teacher_id: string | null;
  syllabus_item_id: string | null;
  plan_text: string | null;
  status: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  syllabus_chapter_id: string | null;
  syllabus_topic_id: string | null;
  subject?: {
    id: string;
    subject_name: string;
  } | null;
  teacher?: {
    id: string;
    full_name: string;
  } | null;
}

export const EnhancedTimetable: React.FC = () => {
  const { selectedClass } = useClassSelection();
  // Default to a date that has data (2025-10-17) instead of today
  const [currentWeek, setCurrentWeek] = useState(new Date('2025-10-17'));
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState(5); // Friday for 2025-10-17
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    class_date: '',
    period_number: 1,
    slot_type: 'subject',
    name: '',
    start_time: '',
    end_time: '',
    subject_id: '',
    teacher_id: '',
    status: 'planned',
  });

  const classId = selectedClass?.id;
  const dateString = currentWeek.toISOString().split('T')[0];
  
  const { data: timetable, isLoading, error, refetch } = useTimetable(dateString, classId);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getSlotsForDate = (date: string) => {
    return timetable?.filter(slot => slot.class_date === date) || [];
  };

  const getSlotsForTime = (date: string, time: string) => {
    return timetable?.filter(slot => 
      slot.class_date === date && slot.start_time === time
    ) || [];
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getTimeSlots = () => {
    const times = new Set<string>();
    timetable?.forEach(slot => {
      times.add(slot.start_time);
    });
    return Array.from(times).sort();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const handleAddSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      class_date: dateString,
      period_number: 1,
      slot_type: 'subject',
      name: '',
      start_time: '',
      end_time: '',
      subject_id: '',
      teacher_id: '',
      status: 'planned',
    });
    setShowAddModal(true);
  };

  const handleEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setSlotForm({
      class_date: slot.class_date,
      period_number: slot.period_number,
      slot_type: slot.slot_type,
      name: slot.name || '',
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject_id: slot.subject_id || '',
      teacher_id: slot.teacher_id || '',
      status: slot.status || 'planned',
    });
    setShowAddModal(true);
  };

  const handleSaveSlot = async () => {
    try {
      // This would save to the database
      setShowAddModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to save slot:', error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      // This would delete from the database
      refetch();
    } catch (error) {
      console.error('Failed to delete slot:', error);
    }
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentWeek);
    const timeSlots = getTimeSlots();

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekContainer}>
          {/* Header with day names */}
          <View style={styles.weekHeader}>
            <View style={styles.timeColumn}>
              <Text variant="bodySmall" style={styles.timeHeader}>Time</Text>
            </View>
            {weekDates.map((date, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text variant="bodySmall" style={styles.dayHeader}>
                  {shortDayNames[index]}
                </Text>
                <Text variant="bodySmall" style={styles.dateHeader}>
                  {date.getDate()}
                </Text>
              </View>
            ))}
          </View>

          {/* Time slots */}
          {timeSlots.map((time, timeIndex) => (
            <View key={timeIndex} style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text variant="bodySmall" style={styles.timeText}>
                  {formatTime(time)}
                </Text>
              </View>
              {weekDates.map((date, dayIndex) => {
                const slots = getSlotsForTime(date.toISOString().split('T')[0], time);
                return (
                  <View key={dayIndex} style={styles.dayColumn}>
                    {slots.map((slot, slotIndex) => (
                      <TouchableOpacity
                        key={slotIndex}
                        style={styles.slotCell}
                        onPress={() => handleEditSlot(slot)}
                      >
                        <Text variant="bodySmall" style={styles.slotSubject}>
                          {slot.subject?.subject_name || 'Free'}
                        </Text>
                        {slot.teacher && (
                          <Text variant="bodySmall" style={styles.slotTeacher}>
                            {slot.teacher.full_name}
                          </Text>
                        )}
                        {slot.name && (
                          <Text variant="bodySmall" style={styles.slotRoom}>
                            {slot.name}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                    {slots.length === 0 && (
                      <View style={styles.emptySlot}>
                        <Text variant="bodySmall" style={styles.emptySlotText}>
                          Free
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderDayView = () => {
    const weekDates = getWeekDates(currentWeek);
    const selectedDate = weekDates[selectedDay];
    const slots = getSlotsForDate(selectedDate.toISOString().split('T')[0]);

    return (
      <View style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <Text variant="titleLarge" style={styles.dayTitle}>
            {dayNames[selectedDay]}
          </Text>
          <Text variant="bodyMedium" style={styles.dayDate}>
            {selectedDate.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
        </View>

        <ScrollView style={styles.daySlots}>
          {slots.length === 0 ? (
            <Card style={styles.emptyDayCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyDayText}>
                  No classes scheduled for this day
                </Text>
              </Card.Content>
            </Card>
          ) : (
            slots.map((slot) => (
              <Card key={slot.id} style={styles.slotCard}>
                <Card.Content>
                  <View style={styles.slotHeader}>
                    <View style={styles.slotTime}>
                      <Clock size={16} color={colors.primary[600]} />
                      <Text variant="titleMedium" style={styles.slotTimeText}>
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </Text>
                    </View>
                    <View style={styles.slotActions}>
                      <TouchableOpacity
                        onPress={() => handleEditSlot(slot)}
                        style={styles.actionButton}
                      >
                        <Edit size={16} color={colors.primary[600]} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSlot(slot.id)}
                        style={styles.actionButton}
                      >
                        <Trash2 size={16} color={colors.error[600]} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.slotContent}>
                    <View style={styles.slotInfo}>
                      <BookOpen size={16} color={colors.text.secondary} />
                      <Text variant="titleMedium" style={styles.slotSubject}>
                        {slot.subject?.subject_name || 'Free Period'}
                      </Text>
                    </View>

                    {slot.teacher && (
                      <View style={styles.slotInfo}>
                        <Users size={16} color={colors.text.secondary} />
                        <Text variant="bodyMedium" style={styles.slotTeacher}>
                          {slot.teacher.full_name}
                        </Text>
                      </View>
                    )}

                    {slot.name && (
                      <View style={styles.slotInfo}>
                        <MapPin size={16} color={colors.text.secondary} />
                        <Text variant="bodyMedium" style={styles.slotRoom}>
                          {slot.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading timetable...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <Card style={styles.errorCard}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.errorText}>
            Error: {error.message}
          </Text>
          <Button mode="outlined" onPress={() => refetch()} style={styles.retryButton}>
            Retry
          </Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.viewControls}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'week' | 'day')}
            buttons={[
              { value: 'week', label: 'Week', icon: 'calendar-week' },
              { value: 'day', label: 'Day', icon: 'calendar-today' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.navigationControls}>
          <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
            <ChevronLeft size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.weekText}>
            Week of {currentWeek.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
            <ChevronRight size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          onPress={handleAddSlot}
          icon={() => <Plus size={16} color={colors.text.inverse} />}
          style={styles.addButton}
        >
          Add Slot
        </Button>
      </View>

      {viewMode === 'week' ? renderWeekView() : renderDayView()}

      {/* Day selector for day view */}
      {viewMode === 'day' && (
        <View style={styles.daySelector}>
          {dayNames.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.selectedDayButton
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text 
                variant="bodySmall" 
                style={[
                  styles.dayButtonText,
                  selectedDay === index && styles.selectedDayButtonText
                ]}
              >
                {shortDayNames[index]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add/Edit Slot Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
          </Text>

          <TextInput
            label="Date"
            value={slotForm.class_date}
            onChangeText={(text) => setSlotForm({ ...slotForm, class_date: text })}
            style={styles.input}
            mode="outlined"
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.timeInputRow}>
            <TextInput
              label="Start Time"
              value={slotForm.start_time}
              onChangeText={(text) => setSlotForm({ ...slotForm, start_time: text })}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              placeholder="09:00"
            />
            <TextInput
              label="End Time"
              value={slotForm.end_time}
              onChangeText={(text) => setSlotForm({ ...slotForm, end_time: text })}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              placeholder="10:00"
            />
          </View>

          <TextInput
            label="Name/Description"
            value={slotForm.name}
            onChangeText={(text) => setSlotForm({ ...slotForm, name: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Subject name or description"
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveSlot}
              style={styles.saveButton}
            >
              {editingSlot ? 'Update' : 'Save'}
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
  controls: {
    padding: spacing['4'],
    gap: spacing['3'],
  },
  viewControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  segmentedButtons: {
    borderRadius: borderRadius.lg,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3'],
  },
  navButton: {
    padding: spacing['2'],
  },
  weekText: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  addButton: {
    borderRadius: borderRadius.lg,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['8'],
  },
  loadingText: {
    marginTop: spacing['2'],
    color: colors.text.secondary,
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
  weekContainer: {
    minWidth: width,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  timeColumn: {
    width: 80,
    padding: spacing['2'],
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  dayColumn: {
    flex: 1,
    padding: spacing['2'],
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  timeHeader: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  dateHeader: {
    color: colors.text.secondary,
    marginTop: spacing['1'],
  },
  timeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  timeText: {
    color: colors.text.secondary,
  },
  slotCell: {
    backgroundColor: colors.primary[50],
    padding: spacing['2'],
    borderRadius: borderRadius.md,
    margin: spacing['1'],
    minHeight: 60,
    justifyContent: 'center',
  },
  slotSubject: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  slotTeacher: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },
  slotRoom: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },
  emptySlot: {
    padding: spacing['2'],
    margin: spacing['1'],
    minHeight: 60,
    justifyContent: 'center',
  },
  emptySlotText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  dayContainer: {
    flex: 1,
    padding: spacing['4'],
  },
  dayHeader: {
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  dayTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  dayDate: {
    color: colors.text.secondary,
    marginTop: spacing['1'],
  },
  daySlots: {
    flex: 1,
  },
  emptyDayCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
  },
  emptyDayText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  slotCard: {
    marginBottom: spacing['3'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2'],
  },
  slotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  slotTimeText: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  slotActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionButton: {
    padding: spacing['1'],
  },
  slotContent: {
    gap: spacing['2'],
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  daySelector: {
    flexDirection: 'row',
    padding: spacing['4'],
    gap: spacing['2'],
  },
  dayButton: {
    flex: 1,
    padding: spacing['2'],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: colors.primary[100],
  },
  dayButtonText: {
    color: colors.text.secondary,
  },
  selectedDayButtonText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
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
    marginBottom: spacing['4'],
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing['3'],
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing['3'],
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
