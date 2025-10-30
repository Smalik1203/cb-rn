import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { DB } from '../types/db.constants';
import { getCalendarEventsForDateRange, getDayData, getHolidayInfo } from '../services/calendarIntegration';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  color?: string;
  is_active: boolean;
  class_instance_id?: string;
  school_code: string;
  academic_year_id?: string;
  created_by?: string;
}

// Hook to fetch calendar events for a date range
export function useCalendarEvents(
  schoolCode: string,
  startDate: string,
  endDate: string,
  classInstanceId?: string
) {
  return useQuery({
    queryKey: ['calendar-events', schoolCode, startDate, endDate, classInstanceId],
    queryFn: () => getCalendarEventsForDateRange(startDate, endDate, schoolCode, classInstanceId),
    enabled: !!schoolCode && !!startDate && !!endDate,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch day data (timetable + tests + events)
export function useDayData(date: string, schoolCode: string, classInstanceId?: string) {
  return useQuery({
    queryKey: ['day-data', date, schoolCode, classInstanceId],
    queryFn: () => getDayData(date, schoolCode, classInstanceId),
    enabled: !!date && !!schoolCode,
    staleTime: 30 * 1000,
  });
}

// Hook to check if a date is a holiday
export function useHolidayCheck(schoolCode: string, date: string, classInstanceId?: string) {
  return useQuery({
    queryKey: ['holiday-check', schoolCode, date, classInstanceId],
    queryFn: () => getHolidayInfo(schoolCode, date, classInstanceId),
    enabled: !!schoolCode && !!date,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook to create calendar event
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Omit<CalendarEvent, 'id'> & { created_by: string }) => {
      const { data, error } = await supabase
        .from(DB.tables.schoolCalendarEvents)
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['day-data'] });
      queryClient.invalidateQueries({ queryKey: ['holiday-check'] });
    },
  });
}

// Hook to update calendar event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...eventData }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from(DB.tables.schoolCalendarEvents)
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['day-data'] });
      queryClient.invalidateQueries({ queryKey: ['holiday-check'] });
    },
  });
}

// Hook to delete calendar event
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from(DB.tables.schoolCalendarEvents)
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['day-data'] });
      queryClient.invalidateQueries({ queryKey: ['holiday-check'] });
    },
  });
}

