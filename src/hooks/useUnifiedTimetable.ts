import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRef, useEffect } from 'react';
import { TimetableSlot } from '../services/api';

export interface UnifiedTimetableResult {
  slots: TimetableSlot[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createSlot: (payload: CreateSlotPayload) => Promise<void>;
  updateSlot: (id: string, updates: UpdateSlotPayload) => Promise<void>;
  deleteSlot: (slotId: string) => Promise<void>;
  quickGenerate: (payload: QuickGeneratePayload) => Promise<void>;
  markSlotTaught: (slotId: string) => Promise<void>;
  unmarkSlotTaught: (slotId: string) => Promise<void>;
  updateSlotStatus: (slotId: string, status: 'planned' | 'done' | 'cancelled') => Promise<void>;
  displayPeriodNumber: number;
  taughtSlotIds: Set<string>;
}

export interface CreateSlotPayload {
  school_code: string;
  class_instance_id: string;
  class_date: string;
  period_number: number;
  slot_type: 'period' | 'break';
  name: string | null;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  teacher_id: string | null;
  syllabus_chapter_id?: string | null;
  syllabus_topic_id?: string | null;
  plan_text?: string | null;
}

export interface UpdateSlotPayload {
  slot_type?: 'period' | 'break';
  name?: string | null;
  start_time?: string;
  end_time?: string;
  subject_id?: string | null;
  teacher_id?: string | null;
  syllabus_chapter_id?: string | null;
  syllabus_topic_id?: string | null;
  plan_text?: string | null;
}

export interface QuickGeneratePayload {
  class_instance_id: string;
  school_code: string;
  class_date: string;
  startTime: string;
  numPeriods: number;
  periodDurationMin: number;
  breaks: Array<{
    afterPeriod: number;
    durationMin: number;
    name: string;
  }>;
}

export function useUnifiedTimetable(classId?: string, dateStr?: string): UnifiedTimetableResult {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const { data: slots, isLoading, error, refetch } = useQuery({
    queryKey: ['unifiedTimetable', classId, dateStr],
    queryFn: async () => {
      if (!classId || !dateStr) return [];
      
      abortControllerRef.current = new AbortController();
      
      // Fetch timetable slots for the selected date - scoped by school_code
      const { data: slotsData, error: slotsError } = await supabase
        .from('timetable_slots')
        .select(`
          id,
          class_instance_id,
          class_date,
          period_number,
          slot_type,
          name,
          start_time,
          end_time,
          subject_id,
          teacher_id,
          syllabus_chapter_id,
          syllabus_topic_id,
          plan_text,
          status,
          created_by,
          created_at,
          updated_at
        `)
        .eq('class_instance_id', classId)
        .eq('class_date', dateStr)
        .order('start_time', { ascending: true })
        .abortSignal(abortControllerRef.current.signal);

      if (slotsError) {
        throw slotsError;
      }

      if (!slotsData || slotsData.length === 0) {
        return [];
      }

      // Get unique subject and teacher IDs
      const subjectIds = [...new Set(slotsData.map(slot => slot.subject_id).filter(Boolean))];
      const teacherIds = [...new Set(slotsData.map(slot => slot.teacher_id).filter(Boolean))];

      // Batch fetch subjects and teachers
      const [subjectsResult, teachersResult] = await Promise.all([
        subjectIds.length > 0 ? supabase
          .from('subjects')
          .select('id, subject_name')
          .in('id', subjectIds)
          .abortSignal(abortControllerRef.current.signal) : Promise.resolve({ data: [], error: null }),
        teacherIds.length > 0 ? supabase
          .from('admin')
          .select('id, full_name')
          .in('id', teacherIds)
          .abortSignal(abortControllerRef.current.signal) : Promise.resolve({ data: [], error: null })
      ]);

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      if (teachersResult.error) {
        throw teachersResult.error;
      }

      const subjectsMap = new Map((subjectsResult.data || []).map(s => [s.id, s]));
      const teachersMap = new Map((teachersResult.data || []).map(t => [t.id, t]));

      // Combine slots with subject and teacher data
      const enrichedSlots = slotsData.map(slot => ({
        ...slot,
        subject_name: slot.subject_id ? subjectsMap.get(slot.subject_id)?.subject_name : null,
        teacher_name: slot.teacher_id ? teachersMap.get(slot.teacher_id)?.full_name : null,
        day_of_week: new Date(slot.class_date).getDay(), // Add day_of_week for compatibility
      }));

      return enrichedSlots as TimetableSlot[];
    },
    enabled: !!classId && !!dateStr,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Helper function to renumber slots sequentially
  const renumberSlotsSequentially = async (classId: string, dateStr: string, schoolCode: string) => {
    const { data: allSlots, error: fetchError } = await supabase
      .from('timetable_slots')
      .select('id, period_number')
      .eq('class_instance_id', classId)
      .eq('class_date', dateStr)
      .eq('school_code', schoolCode)
      .order('start_time', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!allSlots || allSlots.length === 0) return;

    // Update each slot with sequential period numbers
    for (let i = 0; i < allSlots.length; i++) {
      const slot = allSlots[i];
      const newPeriodNumber = i + 1; // Start from 1, no 0s
      
      if (slot.period_number !== newPeriodNumber) {
        const { error } = await supabase
          .from('timetable_slots')
          .update({ period_number: newPeriodNumber })
          .eq('id', slot.id);
        
        if (error) {
          throw error;
        }
      }
    }
  };

  // Helper function to handle time adjustments for neighboring slots
  const handleTimeAdjustment = async (slotId: string, updates: UpdateSlotPayload) => {
    if (!updates.start_time && !updates.end_time) return;

    const { data: daySlots, error } = await supabase
      .from('timetable_slots')
      .select('id, start_time, end_time')
      .eq('class_instance_id', (await supabase.from('timetable_slots').select('class_instance_id').eq('id', slotId).maybeSingle()).data?.class_instance_id)
      .eq('class_date', (await supabase.from('timetable_slots').select('class_date').eq('id', slotId).maybeSingle()).data?.class_date)
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    const currentSlotIndex = daySlots?.findIndex(slot => slot.id === slotId);
    if (currentSlotIndex === undefined || currentSlotIndex === -1) return;

    // If end_time changed, adjust next slot's start_time
    if (updates.end_time) {
      const nextSlot = daySlots?.[currentSlotIndex + 1];
      if (nextSlot) {
        const { error: nextError } = await supabase
          .from('timetable_slots')
          .update({ start_time: updates.end_time })
          .eq('id', nextSlot.id);
        
        if (nextError) {
          // Log warning but don't fail the operation
        }
      }
    }

    // If start_time changed, adjust previous slot's end_time
    if (updates.start_time) {
      const prevSlot = daySlots?.[currentSlotIndex - 1];
      if (prevSlot) {
        const { error: prevError } = await supabase
          .from('timetable_slots')
          .update({ end_time: updates.start_time })
          .eq('id', prevSlot.id);
        
        if (prevError) {
          // Log warning but don't fail the operation
        }
      }
    }
  };

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async (payload: CreateSlotPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('timetable_slots')
        .insert({
          ...payload,
          period_number: 999, // Temporary high number to avoid constraint conflicts
          created_by: userId,
        });

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('uq_day_slot')) {
            throw new Error('A slot with this period number already exists for this class and date. Please try again.');
          } else if (error.message.includes('uq_tt_time_per_day')) {
            throw new Error('A slot with overlapping time already exists for this class and date. Please choose different times.');
          }
        }
        throw error;
      }

      await renumberSlotsSequentially(payload.class_instance_id, payload.class_date, payload.school_code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  // Update slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSlotPayload }) => {
      const { error } = await supabase
        .from('timetable_slots')
        .update(updates)
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('uq_day_slot')) {
            throw new Error('A slot with this period number already exists for this class and date. Please try again.');
          } else if (error.message.includes('uq_tt_time_per_day')) {
            throw new Error('A slot with overlapping time already exists for this class and date. Please choose different times.');
          }
        }
        throw error;
      }

      // Handle time adjustments for neighboring slots
      if (updates.start_time || updates.end_time) {
        await handleTimeAdjustment(id, updates);
      }

      await renumberSlotsSequentially(
        (await supabase.from('timetable_slots').select('class_instance_id').eq('id', id).maybeSingle()).data?.class_instance_id,
        (await supabase.from('timetable_slots').select('class_date').eq('id', id).maybeSingle()).data?.class_date,
        (await supabase.from('timetable_slots').select('school_code').eq('id', id).maybeSingle()).data?.school_code
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('timetable_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      const slotData = await supabase.from('timetable_slots').select('class_instance_id, class_date, school_code').eq('id', slotId).maybeSingle();
      if (slotData.data) {
        await renumberSlotsSequentially(slotData.data.class_instance_id, slotData.data.class_date, slotData.data.school_code);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  // Quick generate mutation
  const quickGenerateMutation = useMutation({
    mutationFn: async (payload: QuickGeneratePayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Delete existing slots for this class and date
      const { error: deleteError } = await supabase
        .from('timetable_slots')
        .delete()
        .eq('class_instance_id', payload.class_instance_id)
        .eq('class_date', payload.class_date)
        .eq('school_code', payload.school_code);

      if (deleteError) {
        throw deleteError;
      }

      // Generate new slots
      const newSlots = generateSlots(payload, userId);

      // Insert all new slots
      const { error: insertError } = await supabase
        .from('timetable_slots')
        .insert(newSlots);

      if (insertError) {
        throw insertError;
      }

      await renumberSlotsSequentially(payload.class_instance_id, payload.class_date, payload.school_code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  // Mark slot as taught mutation
  const markSlotTaughtMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: slot, error: slotError } = await supabase
        .from('timetable_slots')
        .select('school_code, subject_id, teacher_id, syllabus_chapter_id, syllabus_topic_id, class_instance_id, class_date')
        .eq('id', slotId)
        .maybeSingle();

      if (slotError) {
        throw slotError;
      }

      const { error } = await supabase
        .from('syllabus_progress')
        .insert({
          class_instance_id: slot.class_instance_id,
          created_by: userId,
          date: slot.class_date,
          school_code: slot.school_code,
          subject_id: slot.subject_id,
          syllabus_chapter_id: slot.syllabus_chapter_id,
          syllabus_topic_id: slot.syllabus_topic_id,
          teacher_id: slot.teacher_id,
          timetable_slot_id: slotId,
        });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  // Unmark slot as taught mutation
  const unmarkSlotTaughtMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { data: slot, error: slotError } = await supabase
        .from('timetable_slots')
        .select('school_code, subject_id, teacher_id, syllabus_chapter_id, syllabus_topic_id')
        .eq('id', slotId)
        .maybeSingle();

      if (slotError) {
        throw slotError;
      }

      const { error } = await supabase
        .from('syllabus_progress')
        .delete()
        .eq('school_code', slot.school_code)
        .eq('subject_id', slot.subject_id)
        .eq('teacher_id', slot.teacher_id)
        .eq('syllabus_chapter_id', slot.syllabus_chapter_id)
        .eq('syllabus_topic_id', slot.syllabus_topic_id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  // Update slot status mutation
  const updateSlotStatusMutation = useMutation({
    mutationFn: async ({ slotId, status }: { slotId: string; status: 'planned' | 'done' | 'cancelled' }) => {
      const { error } = await supabase
        .from('timetable_slots')
        .update({ status })
        .eq('id', slotId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unifiedTimetable', classId, dateStr] });
    },
  });

  return {
    slots: slots || [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
    createSlot: (payload: CreateSlotPayload) => createSlotMutation.mutateAsync(payload),
    updateSlot: (id: string, updates: UpdateSlotPayload) => updateSlotMutation.mutateAsync({ id, updates }),
    deleteSlot: (slotId: string) => deleteSlotMutation.mutateAsync(slotId),
    quickGenerate: (payload: QuickGeneratePayload) => quickGenerateMutation.mutateAsync(payload),
    markSlotTaught: (slotId: string) => markSlotTaughtMutation.mutateAsync(slotId),
    unmarkSlotTaught: (slotId: string) => unmarkSlotTaughtMutation.mutateAsync(slotId),
    updateSlotStatus: (slotId: string, status: 'planned' | 'done' | 'cancelled') => updateSlotStatusMutation.mutateAsync({ slotId, status }),
    displayPeriodNumber: (slots || []).filter(slot => slot.slot_type === 'period').length,
    taughtSlotIds: new Set<string>(), // TODO: Implement taught slot tracking
  };
}

// Helper function to generate slots for quick generate
function generateSlots(payload: QuickGeneratePayload, userId: string) {
  const slots = [];
  let currentTime = payload.startTime;
  let order = 1;

  for (let i = 1; i <= payload.numPeriods; i++) {
    // Add period
    const periodStart = currentTime;
    const periodEnd = addMinutes(periodStart, payload.periodDurationMin);
    
    slots.push({
      school_code: payload.school_code,
      class_instance_id: payload.class_instance_id,
      class_date: payload.class_date,
      period_number: order++,
      slot_type: 'period' as const,
      name: null,
      start_time: periodStart,
      end_time: periodEnd,
      subject_id: null,
      teacher_id: null,
      syllabus_chapter_id: null,
      syllabus_topic_id: null,
      plan_text: null,
      status: 'planned' as const,
      created_by: userId,
    });

    currentTime = periodEnd;

    // Check if we need to add a break after this period
    const breakConfig = payload.breaks.find(b => b.afterPeriod === i);
    if (breakConfig) {
      const breakStart = currentTime;
      const breakEnd = addMinutes(breakStart, breakConfig.durationMin);
      
      slots.push({
        school_code: payload.school_code,
        class_instance_id: payload.class_instance_id,
        class_date: payload.class_date,
        period_number: order++,
        slot_type: 'break' as const,
        name: breakConfig.name,
        start_time: breakStart,
        end_time: breakEnd,
        subject_id: null,
        teacher_id: null,
        syllabus_chapter_id: null,
        syllabus_topic_id: null,
        plan_text: null,
        status: 'planned' as const,
        created_by: userId,
      });

      currentTime = breakEnd;
    }
  }

  return slots;
}

// Helper function to add minutes to time string
function addMinutes(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
}
