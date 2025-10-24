import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppScope } from '@/src/contexts/AppScopeContext';
import { supabase } from '@/src/data/supabaseClient';
import { getTimetable, getTimetableWeek } from '@/src/data/queries';
import type { TimetableSlot } from '@/src/types/database.types';

export interface TimetableSlotWithDetails {
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

export function useTimetable(date: string, classId?: string) {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const classInstanceId = classId || profile?.class_instance_id;

  return useQuery({
    queryKey: ['timetable', classInstanceId, date, schoolCode],
    queryFn: async (): Promise<TimetableSlotWithDetails[]> => {
      if (!user || !schoolCode || !classInstanceId) {
        throw new Error('Missing authentication or class context');
      }

      // Use data layer to get timetable
      const result = await getTimetable(classInstanceId, date, schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return (result.data as unknown as TimetableSlotWithDetails[]) || [];
    },
    enabled: !!user && !!schoolCode && !!classInstanceId && !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTimetableWeek(startDate: string) {
  const { profile, user } = useAuth();
  const { scope } = useAppScope();
  const schoolCode = scope.school_code || profile?.school_code;
  const classInstanceId = profile?.class_instance_id;

  return useQuery({
    queryKey: ['timetable-week', classInstanceId, startDate, schoolCode],
    queryFn: async (): Promise<TimetableSlotWithDetails[]> => {
      if (!user || !schoolCode || !classInstanceId) {
        throw new Error('Missing authentication or class context');
      }

      // Use data layer to get timetable week
      const result = await getTimetableWeek(classInstanceId, startDate, schoolCode);
      
      if (result.error) {
        throw new Error(result.error.userMessage);
      }

      return (result.data as unknown as TimetableSlotWithDetails[]) || [];
    },
    enabled: !!user && !!schoolCode && !!classInstanceId && !!startDate,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTimetableMonth(yearMonth: string) {
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;
  const classInstanceId = profile?.class_instance_id;

  return useQuery({
    queryKey: ['timetable-month', classInstanceId, yearMonth, schoolCode],
    queryFn: async (): Promise<TimetableSlotWithDetails[]> => {
      if (!user || !schoolCode || !classInstanceId) {
        throw new Error('Missing authentication or class context');
      }

      const [year, month] = yearMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('timetable_slots')
        .select(`
          *,
          subject:subjects(id, subject_name),
          teacher:admin!teacher_id(id, full_name)
        `)
        .eq('class_instance_id', classInstanceId)
        .eq('school_code', schoolCode)
        .gte('class_date', startDate)
        .lte('class_date', endDate)
        .order('class_date', { ascending: true })
        .order('period_number', { ascending: true });

      if (error) {
        throw new Error(`Failed to load timetable: ${error.message}`);
      }

      return (data as unknown as TimetableSlotWithDetails[]) || [];
    },
    enabled: !!user && !!schoolCode && !!classInstanceId && !!yearMonth,
    staleTime: 1000 * 60 * 10,
  });
}

// For teachers/admins to create timetable slots
export function useCreateTimetableSlot() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (slot: Omit<TimetableSlotWithDetails, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('timetable_slots')
        .insert([slot] as any)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create timetable slot: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all timetable queries for this class
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

