import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Card, Chip, Button, Portal, Modal, IconButton } from 'react-native-paper';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bell,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, typography, spacing, borderRadius } from '../../lib/design-system';
import { useCalendarEvents } from '../../src/hooks/useCalendarEvents';

const { width } = Dimensions.get('window');
const cellWidth = (width - spacing.lg * 2) / 7;

const EVENT_TYPES = {
  test: {
    label: 'Exam',
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    emoji: '📝',
  },
  event: {
    label: 'Activity',
    color: '#52c41a',
    bgColor: '#f6ffed',
    emoji: '🎯',
  },
  holiday: {
    label: 'Holiday',
    color: '#faad14',
    bgColor: '#fffbe6',
    emoji: '🌟',
  },
  assembly: {
    label: 'Assembly',
    color: '#1890ff',
    bgColor: '#e6f7ff',
    emoji: '📚',
  },
};

export default function StudentCalendarScreen() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);

  const schoolCode = profile?.school_code || '';
  const classInstanceId = profile?.class_instance_id;

  // Calculate date range for current month
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [currentDate]);

  // Fetch calendar events
  const { data: events = [], isLoading } = useCalendarEvents(
    schoolCode,
    startDate,
    endDate,
    classInstanceId
  );

  // Map events to display format
  const mappedEvents = useMemo(() => {
    return events.map((event) => {
      const eventType =
        EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES] || EVENT_TYPES.event;
      const eventDate = new Date(event.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil(
        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...event,
        type: event.event_type,
        date: eventDate,
        time: event.is_all_day
          ? 'All Day'
          : event.start_time
          ? `${formatTime(event.start_time)}${
              event.end_time ? ` - ${formatTime(event.end_time)}` : ''
            }`
          : 'Time TBD',
        color: event.color || eventType.color,
        bgColor: eventType.bgColor,
        emoji: eventType.emoji,
        daysUntil,
      };
    });
  }, [events]);

  // Get next event
  const nextEvent = useMemo(() => {
    const upcoming = mappedEvents
      .filter((e) => e.daysUntil >= 0)
      .filter((e) => filterType === 'all' || e.type === filterType)
      .sort((a, b) => a.daysUntil - b.daysUntil);
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [mappedEvents, filterType]);

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    return mappedEvents
      .filter((e) => e.daysUntil >= 0)
      .filter((e) => filterType === 'all' || e.type === filterType)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10);
  }, [mappedEvents, filterType]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mappedEvents
      .filter((event) => {
        const eventStart = new Date(event.start_date);
        const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
        const checkDate = new Date(dateStr);
        return checkDate >= eventStart && checkDate <= eventEnd;
      })
      .filter((e) => filterType === 'all' || e.type === filterType);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDay.setDate(firstDay.getDate() - diff);

    const endDay = new Date(lastDay);
    const endDayOfWeek = lastDay.getDay();
    const endDiff = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDay.setDate(lastDay.getDate() + endDiff);

    const days: Date[] = [];
    const current = new Date(startDay);

    while (current <= endDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const eventsForDate = getEventsForDate(date);
    if (eventsForDate.length > 0) {
      setSelectedEvent(eventsForDate[0]);
      setModalVisible(true);
    }
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <CalendarDays size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                📅 School Calendar
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Your personalized schedule
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Next Event Banner */}
      {nextEvent && (
        <View
          style={[
            styles.nextEventBanner,
            { backgroundColor: nextEvent.bgColor, borderColor: nextEvent.color + '40' },
          ]}
        >
          <View style={[styles.nextEventIcon, { backgroundColor: nextEvent.color }]}>
            <Text style={styles.nextEventEmoji}>{nextEvent.emoji}</Text>
          </View>
          <View style={styles.nextEventContent}>
            <Text variant="titleMedium" style={[styles.nextEventTitle, { color: nextEvent.color }]}>
              Next Event: {nextEvent.title}
            </Text>
            <Text variant="bodySmall" style={styles.nextEventSubtitle}>
              {nextEvent.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {nextEvent.daysUntil !== null && nextEvent.daysUntil >= 0 && (
                <Text style={styles.nextEventDays}>
                  {' '}
                  •{' '}
                  {nextEvent.daysUntil === 0
                    ? '⏰ Today'
                    : nextEvent.daysUntil === 1
                    ? '⏰ Tomorrow'
                    : `⏰ ${nextEvent.daysUntil} days left`}
                </Text>
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Stats and Filter */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <CalendarDays size={20} color={colors.primary[600]} />
          <Text variant="titleMedium" style={styles.statValue}>
            {events.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Total Events
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <Bell size={20} color={colors.success[600]} />
          <Text variant="titleMedium" style={styles.statValue}>
            {upcomingEvents.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Upcoming
          </Text>
        </Card>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <Filter size={16} color={colors.text.secondary} />
        <Text variant="labelMedium" style={styles.filterLabel}>
          Filter:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Chip
            selected={filterType === 'all'}
            onPress={() => setFilterType('all')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            All
          </Chip>
          <Chip
            selected={filterType === 'event'}
            onPress={() => setFilterType('event')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            📝 Events
          </Chip>
          <Chip
            selected={filterType === 'holiday'}
            onPress={() => setFilterType('holiday')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            🌟 Holidays
          </Chip>
        </ScrollView>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <IconButton
          icon={() => <ChevronLeft size={20} color={colors.primary[600]} />}
          onPress={handlePreviousMonth}
        />
        <Text variant="titleMedium" style={styles.monthText}>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <IconButton
          icon={() => <ChevronRight size={20} color={colors.primary[600]} />}
          onPress={handleNextMonth}
        />
        <Button mode="outlined" onPress={handleToday} style={styles.todayButton}>
          Today
        </Button>
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Week Headers */}
        <View style={styles.weekHeader}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <View key={day} style={styles.weekHeaderCell}>
              <Text variant="labelSmall" style={styles.weekHeaderText}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.grid}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const isSelected = selectedDate?.toDateString() === day.toDateString();
            const dayEvents = getEventsForDate(day);
            const isWeekend = day.getDay() === 0;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                  isWeekend && styles.weekendCell,
                ]}
                onPress={() => handleDateSelect(day)}
                activeOpacity={0.7}
              >
                <Text
                  variant="bodySmall"
                  style={[
                    styles.dateText,
                    !isCurrentMonth && styles.dateTextMuted,
                    isToday && styles.dateTextToday,
                  ]}
                >
                  {day.getDate()}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>{dayEvents.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Upcoming Events List */}
        <View style={styles.upcomingSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Upcoming Events
          </Text>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedEvent(event);
                  setModalVisible(true);
                }}
              >
                <Card style={[styles.upcomingCard, { backgroundColor: event.bgColor }]}>
                  <View style={styles.upcomingCardContent}>
                    <View style={[styles.upcomingEventIcon, { backgroundColor: event.color }]}>
                      <Text style={styles.upcomingEventEmoji}>{event.emoji}</Text>
                    </View>
                    <View style={styles.upcomingEventDetails}>
                      <Text variant="titleSmall" style={styles.upcomingEventTitle}>
                        {event.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.upcomingEventDate}>
                        {event.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {event.time}
                      </Text>
                      {event.daysUntil !== null && event.daysUntil >= 0 && (
                        <Chip
                          mode="flat"
                          style={[
                            styles.daysChip,
                            {
                              backgroundColor:
                                event.daysUntil <= 1
                                  ? '#fff1f0'
                                  : event.daysUntil <= 3
                                  ? '#fffbe6'
                                  : '#f6ffed',
                            },
                          ]}
                          textStyle={{
                            color:
                              event.daysUntil <= 1
                                ? '#ff4d4f'
                                : event.daysUntil <= 3
                                ? '#faad14'
                                : '#52c41a',
                            fontSize: 10,
                          }}
                        >
                          {event.daysUntil === 0
                            ? 'Today'
                            : event.daysUntil === 1
                            ? 'Tomorrow'
                            : `In ${event.daysUntil} days`}
                        </Chip>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No upcoming events
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Event Details Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setSelectedEvent(null);
          }}
          contentContainerStyle={styles.modal}
        >
          {selectedEvent && (
            <View>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: selectedEvent.color }]}>
                  <Text style={styles.modalEmoji}>{selectedEvent.emoji}</Text>
                </View>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  {selectedEvent.title}
                </Text>
                <IconButton
                  icon={() => <X size={24} color={colors.text.primary} />}
                  onPress={() => setModalVisible(false)}
                  style={styles.modalClose}
                />
              </View>

              <View style={styles.modalContent}>
                <View style={styles.modalSection}>
                  <Text variant="labelSmall" style={styles.modalLabel}>
                    Event Type
                  </Text>
                  <Chip
                    mode="outlined"
                    style={[styles.modalChip, { borderColor: selectedEvent.color }]}
                    textStyle={{ color: selectedEvent.color }}
                  >
                    {EVENT_TYPES[selectedEvent.type as keyof typeof EVENT_TYPES]?.label ||
                      selectedEvent.type}
                  </Chip>
                </View>

                <View style={styles.modalSection}>
                  <Text variant="labelSmall" style={styles.modalLabel}>
                    Date & Time
                  </Text>
                  <View style={styles.modalRow}>
                    <CalendarIcon size={16} color={colors.text.secondary} />
                    <Text variant="bodyMedium">
                      {selectedEvent.date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Clock size={16} color={colors.text.secondary} />
                    <Text variant="bodyMedium">{selectedEvent.time}</Text>
                  </View>
                </View>

                {selectedEvent.description && (
                  <View style={styles.modalSection}>
                    <Text variant="labelSmall" style={styles.modalLabel}>
                      Details
                    </Text>
                    <Text variant="bodyMedium" style={styles.modalDescription}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                )}

                {selectedEvent.daysUntil !== null && selectedEvent.daysUntil >= 0 && (
                  <Card
                    style={[
                      styles.countdownCard,
                      {
                        backgroundColor: selectedEvent.daysUntil <= 1 ? '#fff1f0' : '#fffbe6',
                        borderColor: selectedEvent.daysUntil <= 1 ? '#ffccc7' : '#ffe58f',
                      },
                    ]}
                  >
                    <Text variant="titleMedium" style={styles.countdownText}>
                      {selectedEvent.daysUntil === 0
                        ? '🔥 Happening Today!'
                        : selectedEvent.daysUntil === 1
                        ? '⏰ Tomorrow!'
                        : `⏰ ${selectedEvent.daysUntil} Days Left`}
                    </Text>
                    <Text variant="bodySmall" style={styles.countdownSubtext}>
                      {selectedEvent.daysUntil <= 2
                        ? "Don&apos;t forget to prepare!"
                        : 'Mark your calendar'}
                    </Text>
                  </Card>
                )}
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  header: {
    backgroundColor: colors.primary[600],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
  nextEventBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  nextEventIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextEventEmoji: {
    fontSize: 24,
  },
  nextEventContent: {
    flex: 1,
    justifyContent: 'center',
  },
  nextEventTitle: {
    fontWeight: typography.fontWeight.bold,
  },
  nextEventSubtitle: {
    color: colors.text.secondary,
  },
  nextEventDays: {
    fontWeight: typography.fontWeight.bold,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    color: colors.text.secondary,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
  },
  filterLabel: {
    color: colors.text.secondary,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: spacing.sm,
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
  },
  todayButton: {
    marginRight: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    backgroundColor: colors.background.card,
  },
  weekHeaderCell: {
    width: cellWidth,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: cellWidth,
    height: 60,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.xs,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: '#fff7e6',
    borderColor: colors.primary[600],
    borderWidth: 2,
  },
  selectedCell: {
    backgroundColor: '#e6f7ff',
  },
  weekendCell: {
    backgroundColor: '#f0f9ff',
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  dateTextMuted: {
    color: colors.text.tertiary,
  },
  dateTextToday: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  eventBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBadgeText: {
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  upcomingSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  upcomingCard: {
    marginBottom: spacing.sm,
  },
  upcomingCardContent: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  upcomingEventIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingEventEmoji: {
    fontSize: 20,
  },
  upcomingEventDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  upcomingEventTitle: {
    fontWeight: typography.fontWeight.bold,
  },
  upcomingEventDate: {
    color: colors.text.secondary,
  },
  daysChip: {
    alignSelf: 'flex-start',
    height: 20,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  modal: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalEmoji: {
    fontSize: 24,
  },
  modalTitle: {
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  modalClose: {
    position: 'absolute',
    right: -spacing.md,
    top: -spacing.md,
  },
  modalContent: {
    gap: spacing.lg,
  },
  modalSection: {
    gap: spacing.sm,
  },
  modalLabel: {
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  modalChip: {
    alignSelf: 'flex-start',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalDescription: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  countdownCard: {
    padding: spacing.md,
    borderWidth: 1,
  },
  countdownText: {
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  countdownSubtext: {
    color: colors.text.secondary,
  },
});
