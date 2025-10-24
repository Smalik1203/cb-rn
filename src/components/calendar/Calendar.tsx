import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react-native';
import { useCalendar } from '@/src/contexts/CalendarContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-system';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
  const { state, actions } = useCalendar();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    event_type: 'academic' as 'academic' | 'holiday' | 'exam' | 'meeting' | 'other',
    is_all_day: true,
  });

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return state.events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return date >= startDate && date <= endDate;
    });
  };

  const getHolidaysForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return state.holidays.filter(holiday => holiday.date === dateString);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
    
    // Load events for the new month
    const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
    actions.loadEvents(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  };

  const handleDatePress = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      start_date: selectedDate?.toISOString().split('T')[0] || '',
      end_date: selectedDate?.toISOString().split('T')[0] || '',
      start_time: '',
      end_time: '',
      event_type: 'academic',
      is_all_day: true,
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      event_type: event.event_type,
      is_all_day: event.is_all_day,
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        await actions.updateEvent({
          ...editingEvent,
          ...eventForm,
        });
      } else {
        await actions.addEvent({
          ...eventForm,
          school_code: '', // Will be set by the context
          created_by: '', // Will be set by the context
        });
      }
      setShowEventModal(false);
      setEventForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        event_type: 'academic',
        is_all_day: true,
      });
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await actions.deleteEvent(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'academic':
        return colors.primary[600];
      case 'holiday':
        return colors.error[600];
      case 'exam':
        return colors.warning[600];
      case 'meeting':
        return colors.info[600];
      default:
        return colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.calendarCard}>
        <Card.Content>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
              <Text variant="titleMedium" style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text variant="titleLarge" style={styles.monthYear}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
              <Text variant="titleMedium" style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {dayNames.map(day => (
              <Text key={day} variant="bodySmall" style={styles.dayName}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={index} style={styles.dayCell} />;
              }

              const events = getEventsForDate(date);
              const holidays = getHolidaysForDate(date);
              const isCurrentDay = isToday(date);
              const isSelectedDay = isSelected(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isCurrentDay && styles.todayCell,
                    isSelectedDay && styles.selectedCell,
                  ]}
                  onPress={() => handleDatePress(date)}
                >
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.dayText,
                      isCurrentDay && styles.todayText,
                      isSelectedDay && styles.selectedText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  
                  {/* Event indicators */}
                  <View style={styles.eventIndicators}>
                    {holidays.length > 0 && (
                      <View style={[styles.eventDot, { backgroundColor: colors.error[600] }]} />
                    )}
                    {events.length > 0 && (
                      <View style={[styles.eventDot, { backgroundColor: colors.primary[600] }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      {/* Events List */}
      {selectedDate && (
        <Card style={styles.eventsCard}>
          <Card.Content>
            <View style={styles.eventsHeader}>
              <Text variant="titleMedium" style={styles.eventsTitle}>
                Events for {selectedDate.toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
              <Button
                mode="contained"
                onPress={handleAddEvent}
                icon={() => <Plus size={16} color={colors.text.inverse} />}
                style={styles.addButton}
                compact
              >
                Add Event
              </Button>
            </View>

            <ScrollView style={styles.eventsList}>
              {getEventsForDate(selectedDate).map(event => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text variant="titleSmall" style={styles.eventTitle}>
                        {event.title}
                      </Text>
                      <Chip
                        mode="outlined"
                        style={[styles.eventTypeChip, { borderColor: getEventTypeColor(event.event_type) }]}
                        textStyle={{ color: getEventTypeColor(event.event_type) }}
                      >
                        {event.event_type}
                      </Chip>
                    </View>
                    
                    {event.description && (
                      <Text variant="bodySmall" style={styles.eventDescription}>
                        {event.description}
                      </Text>
                    )}
                    
                    <View style={styles.eventDetails}>
                      {event.start_time && (
                        <View style={styles.eventDetail}>
                          <Clock size={14} color={colors.text.secondary} />
                          <Text variant="bodySmall" style={styles.eventDetailText}>
                            {event.start_time} - {event.end_time}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.eventActions}>
                    <TouchableOpacity
                      onPress={() => handleEditEvent(event)}
                      style={styles.actionButton}
                    >
                      <Edit size={16} color={colors.primary[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteEvent(event.id)}
                      style={styles.actionButton}
                    >
                      <Trash2 size={16} color={colors.error[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {getHolidaysForDate(selectedDate).map(holiday => (
                <View key={holiday.id} style={styles.holidayItem}>
                  <View style={styles.holidayContent}>
                    <Text variant="titleSmall" style={styles.holidayTitle}>
                      {holiday.name}
                    </Text>
                    <Chip
                      mode="outlined"
                      style={[styles.holidayChip, { borderColor: colors.error[600] }]}
                      textStyle={{ color: colors.error[600] }}
                    >
                      Holiday
                    </Chip>
                  </View>
                </View>
              ))}

              {getEventsForDate(selectedDate).length === 0 && getHolidaysForDate(selectedDate).length === 0 && (
                <Text variant="bodyMedium" style={styles.noEventsText}>
                  No events for this date
                </Text>
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* Event Modal */}
      <Portal>
        <Modal
          visible={showEventModal}
          onDismiss={() => setShowEventModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </Text>

          <TextInput
            label="Event Title"
            value={eventForm.title}
            onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Description"
            value={eventForm.description}
            onChangeText={(text) => setEventForm({ ...eventForm, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.dateTimeRow}>
            <TextInput
              label="Start Date"
              value={eventForm.start_date}
              onChangeText={(text) => setEventForm({ ...eventForm, start_date: text })}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              label="End Date"
              value={eventForm.end_date}
              onChangeText={(text) => setEventForm({ ...eventForm, end_date: text })}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
          </View>

          <SegmentedButtons
            value={eventForm.event_type}
            onValueChange={(value) => setEventForm({ ...eventForm, event_type: value as any })}
            buttons={[
              { value: 'academic', label: 'Academic' },
              { value: 'exam', label: 'Exam' },
              { value: 'meeting', label: 'Meeting' },
              { value: 'other', label: 'Other' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowEventModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveEvent}
              style={styles.saveButton}
            >
              {editingEvent ? 'Update' : 'Save'}
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
  calendarCard: {
    margin: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  navButton: {
    padding: spacing['2'],
  },
  navText: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  monthYear: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: spacing['2'],
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: colors.primary[50],
  },
  selectedCell: {
    backgroundColor: colors.primary[100],
  },
  dayText: {
    color: colors.text.primary,
  },
  todayText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  selectedText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  eventIndicators: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    gap: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventsCard: {
    margin: spacing['4'],
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  eventsTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  addButton: {
    borderRadius: borderRadius.lg,
  },
  eventsList: {
    maxHeight: 300,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['1'],
  },
  eventTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  eventTypeChip: {
    borderRadius: borderRadius.md,
  },
  eventDescription: {
    color: colors.text.secondary,
    marginBottom: spacing['2'],
  },
  eventDetails: {
    gap: spacing['1'],
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  eventDetailText: {
    color: colors.text.secondary,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  actionButton: {
    padding: spacing['1'],
  },
  holidayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  holidayContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holidayTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  holidayChip: {
    borderRadius: borderRadius.md,
  },
  noEventsText: {
    textAlign: 'center',
    color: colors.text.secondary,
    paddingVertical: spacing['4'],
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  halfInput: {
    flex: 1,
  },
  segmentedButtons: {
    marginBottom: spacing['4'],
    borderRadius: borderRadius.lg,
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
