import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { CalendarDays, Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useClassSelection } from '../../src/contexts/ClassSelectionContext';
import { ClassSelector } from '../../src/components/ClassSelector';
import { colors, typography, spacing, borderRadius } from '../../lib/design-system';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { DB } from '../../src/types/db.constants';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_type: 'class' | 'exam' | 'holiday' | 'meeting' | 'other';
  color: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  recurrence_end_date?: string;
  is_active: boolean;
  academic_year_id: string;
  class_instance_id: string;
  school_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function CalendarScreen() {
  const { profile } = useAuth();
  const { selectedClass } = useClassSelection();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const role = profile?.role || 'student';
  const canManageEvents = role === 'admin' || role === 'superadmin' || role === 'cb_admin';

  // Fetch calendar events
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', selectedClass?.id, selectedDate],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!selectedClass?.id) return [];
      
      const { data, error } = await supabase
        .from(DB.tables.schoolCalendarEvents)
        .select('*')
        .eq('class_instance_id', selectedClass.id)
        .gte('date', selectedDate)
        .lt('date', new Date(new Date(selectedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date')
        .order('start_time');
      
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    },
    enabled: !!selectedClass?.id,
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from(DB.tables.schoolCalendarEvents)
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const handleAddEvent = () => {
    if (!canManageEvents) {
      Alert.alert('Access Denied', 'Only administrators can add events.');
      return;
    }
    Alert.alert('Add Event', 'Event creation will be implemented in the next update.');
  };

  const handleEditEvent = (event: CalendarEvent) => {
    if (!canManageEvents) {
      Alert.alert('Access Denied', 'Only administrators can edit events.');
      return;
    }
    Alert.alert('Edit Event', `Edit "${event.title}" - Feature coming soon.`);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (!canManageEvents) {
      Alert.alert('Access Denied', 'Only administrators can delete events.');
      return;
    }
    
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEventMutation.mutate(event.id),
        },
      ]
    );
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'class': return colors.primary[600];
      case 'exam': return colors.error[600];
      case 'holiday': return colors.success[600];
      case 'meeting': return colors.warning[600];
      default: return colors.neutral[600];
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'class': return 'Class';
      case 'exam': return 'Exam';
      case 'holiday': return 'Holiday';
      case 'meeting': return 'Meeting';
      default: return 'Event';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!selectedClass) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <CalendarDays size={32} color={colors.text.inverse} />
              </View>
              <View>
                <Text variant="headlineSmall" style={styles.headerTitle}>
                  Calendar
                </Text>
                <Text variant="bodyLarge" style={styles.headerSubtitle}>
                  Select a class to view events
                </Text>
              </View>
            </View>
          </View>
        </View>
        <ClassSelector />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <CalendarDays size={32} color={colors.text.inverse} />
            </View>
            <View>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Calendar
              </Text>
              <Text variant="bodyLarge" style={styles.headerSubtitle}>
                {canManageEvents ? 'Manage events and view calendar' : 'View school calendar and events'}
              </Text>
            </View>
          </View>
          {canManageEvents && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
              <Plus size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ClassSelector />

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load events</Text>
            <Button onPress={() => refetch()}>Retry</Button>
          </View>
        ) : events && events.length > 0 ? (
          <View style={styles.eventsList}>
            {events.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleRow}>
                    <Text variant="titleMedium" style={styles.eventTitle}>
                      {event.title}
                    </Text>
                    <Chip 
                      style={[styles.eventTypeChip, { backgroundColor: getEventTypeColor(event.event_type) + '20' }]}
                      textStyle={{ color: getEventTypeColor(event.event_type) }}
                    >
                      {getEventTypeLabel(event.event_type)}
                    </Chip>
                  </View>
                  {canManageEvents && (
                    <View style={styles.eventActions}>
                      <TouchableOpacity onPress={() => handleEditEvent(event)}>
                        <Edit size={16} color={colors.neutral[600]} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEvent(event)}>
                        <Trash2 size={16} color={colors.error[600]} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetailRow}>
                    <CalendarDays size={16} color={colors.neutral[600]} />
                    <Text style={styles.eventDetailText}>{formatDate(event.start_date)}</Text>
                  </View>
                  
                  <View style={styles.eventDetailRow}>
                    <Clock size={16} color={colors.neutral[600]} />
                    <Text style={styles.eventDetailText}>
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </Text>
                  </View>
                  
                  {/* Location field not available in database schema */}
                  
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <CalendarDays size={64} color={colors.text.tertiary} />
            <Text variant="titleLarge" style={styles.emptyTitle}>No Events</Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              No events scheduled for this week.
            </Text>
            {canManageEvents && (
              <Button mode="contained" onPress={handleAddEvent} style={styles.addEventButton}>
                Add First Event
              </Button>
            )}
          </View>
        )}
      </ScrollView>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    color: colors.error[600],
    marginBottom: spacing.md,
  },
  eventsList: {
    gap: spacing.md,
  },
  eventCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  eventTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  eventTypeChip: {
    alignSelf: 'flex-start',
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  eventDetails: {
    gap: spacing.sm,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventDetailText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  eventDescription: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  addEventButton: {
    marginTop: spacing.md,
  },
});