import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useMemo } from 'react';
import { TimetableSlot } from '../services/api';

export interface StudentTimetableResult {
  slots: TimetableSlot[];
  displayPeriodNumber: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentTimetable(classInstanceId?: string, dateStr?: string): StudentTimetableResult {
  const { data: slots, isLoading, error, refetch } = useQuery({
    queryKey: ['studentTimetable', classInstanceId, dateStr],
    queryFn: async ({ signal }) => {
      if (!classInstanceId || !dateStr) return [];
      
      // Fetch timetable slots for the selected date
      const { data: slotsData, error: slotsError } = await supabase
        .from('timetable_slots')
        .select(`
          id,
          class_date,
          period_number,
          slot_type,
          name,
          start_time,
          end_time,
          subject_id,
          teacher_id,
          plan_text
        `)
        .eq('class_instance_id', classInstanceId)
        .eq('class_date', dateStr)
        .order('start_time', { ascending: true })
        .abortSignal(signal);

      if (slotsError) throw slotsError;
      if (!slotsData || slotsData.length === 0) return [];

      // Get unique subject and teacher IDs
      const subjectIds = [...new Set(slotsData.map(slot => slot.subject_id).filter(Boolean))];
      const teacherIds = [...new Set(slotsData.map(slot => slot.teacher_id).filter(Boolean))];

      // Batch fetch subjects and teachers
      const [subjectsResult, teachersResult] = await Promise.all([
        subjectIds.length > 0 ? supabase
          .from('subjects')
          .select('id, subject_name')
          .in('id', subjectIds)
          .abortSignal(signal) : Promise.resolve({ data: [] }),
        teacherIds.length > 0 ? supabase
          .from('admin')
          .select('id, full_name')
          .in('id', teacherIds)
          .abortSignal(signal) : Promise.resolve({ data: [] })
      ]);

      const subjectsMap = new Map((subjectsResult.data || []).map(s => [s.id, s]));
      const teachersMap = new Map((teachersResult.data || []).map(t => [t.id, t]));

      // Combine slots with subject and teacher data
      const enrichedSlots = slotsData.map(slot => ({
        ...slot,
        subject: slot.subject_id ? subjectsMap.get(slot.subject_id) : null,
        teacher: slot.teacher_id ? teachersMap.get(slot.teacher_id) : null,
      }));

      return enrichedSlots as TimetableSlot[];
    },
    enabled: !!classInstanceId && !!dateStr,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Compute displayPeriodNumber counting only period slots
  const displayPeriodNumber = useMemo(() => {
    if (!slots) return 0;
    return slots.filter(slot => slot.slot_type === 'period').length;
  }, [slots]);

  return {
    slots: slots || [],
    displayPeriodNumber,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
