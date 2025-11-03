import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, RefreshControlProps } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { colors, spacing, borderRadius, typography } from '../../../lib/design-system';
import { CalendarEvent } from '../../hooks/useCalendarEvents';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

const { width, height } = Dimensions.get('window');
const cellWidth = width / 7;
// Calculate cell height to fill the screen (subtract header space ~200px, divide by exactly 6 rows)
const cellHeight = Math.max((height - 200) / 6, 100);

export default function CalendarMonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  refreshControl,
}: CalendarMonthViewProps) {
  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
      const checkDate = new Date(dateStr);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  // Check if a date is a holiday
  const isHolidayDate = (date: Date): boolean => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.some((event) => event.event_type === 'holiday');
  };

  // Check if a date is a weekend (Sunday)
  const isWeekendDate = (date: Date): boolean => {
    return date.getDay() === 0; // Sunday
  };

  // Generate calendar days starting from Monday
  const generateCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Create dates at noon to avoid timezone issues
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    
    // Get the Monday before or on the first day
    // JavaScript getDay(): 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
    const dayOfWeek = firstDay.getDay();
    // Calculate days to go back to Monday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const days: Date[] = [];
    
    // Always generate exactly 42 days (6 rows × 7 days) for consistent layout
    // Start from the Monday before (or on) the 1st of the month
    for (let i = 0; i < 42; i++) {
      days.push(new Date(year, month, 1 - diff + i, 12, 0, 0));
    }
    
    return days;
  };

  const getEventTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      holiday: '#0369a1',
      assembly: '#1890ff',
      exam: '#faad14',
      ptm: '#52c41a',
      'sports day': '#722ed1',
      'cultural event': '#eb2f96',
    };
    return colors[type.toLowerCase()] || '#8c8c8c';
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to match calendar dates

  return (
    <View style={styles.container}>
      {/* Week Headers */}
      <View style={styles.weekHeader}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <View key={day} style={[styles.weekHeaderCell, day === 'Sun' && styles.sundayHeader]}>
            <Text
              variant="labelSmall"
              style={[
                styles.weekHeaderText,
                day === 'Sun' && styles.sundayHeaderText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid - Full viewport */}
      <View style={styles.gridContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}
        >
          <View style={styles.grid}>
            {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const isWeekend = isWeekendDate(day);
            const isHoliday = isHolidayDate(day);
            const dayEvents = getEventsForDate(day);
            const holidayEvents = dayEvents.filter((e) => e.event_type === 'holiday');
            const regularEvents = dayEvents.filter((e) => e.event_type !== 'holiday');

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cell,
                  isToday && styles.todayCell,
                  isWeekend && styles.weekendCell,
                  isHoliday && styles.holidayCell,
                ]}
                onPress={() => onDateClick(day)}
                activeOpacity={0.7}
              >
                {/* Date Number */}
                <View style={styles.dateHeader}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.dateText,
                      !isCurrentMonth && styles.dateTextMuted,
                      isToday && styles.dateTextToday,
                      (isWeekend || isHoliday) && styles.dateTextSpecial,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {isHoliday && <Text style={styles.holidayEmoji}>🎉</Text>}
                  {isWeekend && !isHoliday && <Text style={styles.weekendEmoji}>☀️</Text>}
                </View>

                {/* Events */}
                <View style={styles.eventsContainer}>
                  {/* Holidays first */}
                  {holidayEvents.slice(0, 1).map((event, eventIndex) => (
                    <TouchableOpacity
                      key={`holiday-${eventIndex}`}
                      style={[
                        styles.eventBadge,
                        { backgroundColor: getEventTypeColor(event.event_type) },
                      ]}
                      onPress={() => onEventClick(event)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eventBadgeText} numberOfLines={1}>
                        🎉 {event.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Regular events */}
                  {regularEvents.slice(0, 2).map((event, eventIndex) => (
                    <TouchableOpacity
                      key={`event-${eventIndex}`}
                      style={[
                        styles.eventBadge,
                        { backgroundColor: event.color || getEventTypeColor(event.event_type) },
                      ]}
                      onPress={() => onEventClick(event)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eventBadgeText} numberOfLines={1}>
                        {event.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <Text style={styles.moreEventsText}>
                      +{dayEvents.length - 3} more
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  weekHeaderCell: {
    width: cellWidth,
    alignItems: 'center',
    paddingVertical: 4,
  },
  sundayHeader: {
    // no special background
  },
  weekHeaderText: {
    fontWeight: typography.fontWeight.semibold,
    color: '#586069',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sundayHeaderText: {
    color: '#6366F1',
  },
  gridContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    minHeight: '100%',
  },
  cell: {
    width: cellWidth,
    height: cellHeight,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E1E4E8',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  todayCell: {
    backgroundColor: '#F0F7FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  weekendCell: {
    backgroundColor: '#FAFBFC',
  },
  holidayCell: {
    backgroundColor: '#FEF3C7',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#24292E',
    fontWeight: typography.fontWeight.semibold,
  },
  dateTextMuted: {
    color: '#959DA5',
  },
  dateTextToday: {
    color: '#4F46E5',
    fontWeight: typography.fontWeight.bold,
    fontSize: 15,
  },
  dateTextSpecial: {
    color: '#6366F1',
  },
  holidayEmoji: {
    fontSize: 10,
  },
  weekendEmoji: {
    fontSize: 8,
  },
  eventsContainer: {
    flex: 1,
    gap: 3,
  },
  eventBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.2)',
  },
  eventBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
  moreEventsText: {
    fontSize: 9,
    color: '#6366F1',
    textAlign: 'left',
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
});

