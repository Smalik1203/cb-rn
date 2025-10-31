import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

type Subject = {
  id: string;
  subject_name: string;
  school_code: string;
  created_by: string;
  created_at: string;
};

type CreateSubjectInput = {
  subject_name: string;
  school_code: string;
  created_by: string;
};

type UpdateSubjectInput = {
  id: string;
  subject_name: string;
};

/**
 * Fetch all subjects for a school and provide mutation functions
 */
export function useSubjects(
  schoolCode: string | null | undefined,
  options?: { page?: number; pageSize?: number }
) {
  const queryClient = useQueryClient();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const query = useQuery({
    queryKey: ['subjects', schoolCode, page, pageSize],
    queryFn: async () => {
      if (!schoolCode) {
        throw new Error('School code is required');
      }

      log.info('Fetching subjects', { schoolCode });

      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name, school_code, created_by, created_at')
        .eq('school_code', schoolCode)
        .order('subject_name')
        .range(from, to);

      if (error) {
        log.error('Failed to fetch subjects', error);
        throw error;
      }

      return (data as Subject[]) || [];
    },
    enabled: !!schoolCode,
    staleTime: 60_000, // 1 minute
  });

  const createSubject = useMutation({
    mutationFn: async (input: CreateSubjectInput) => {
      log.info('Creating subject', { subject_name: input.subject_name });

      const { data, error } = await supabase
        .from('subjects')
        .insert({
          subject_name: input.subject_name,
          school_code: input.school_code,
          created_by: input.created_by,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate error (unique constraint violation)
        if (error.code === '23505') {
          throw new Error('This subject already exists for your school');
        }
        log.error('Failed to create subject', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', schoolCode] });
    },
  });

  const updateSubject = useMutation({
    mutationFn: async (input: UpdateSubjectInput) => {
      log.info('Updating subject', { id: input.id });

      const { error } = await supabase
        .from('subjects')
        .update({
          subject_name: input.subject_name,
        })
        .eq('id', input.id);

      if (error) {
        // Handle duplicate error
        if (error.code === '23505') {
          throw new Error('A subject with this name already exists');
        }
        log.error('Failed to update subject', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', schoolCode] });
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (subjectId: string) => {
      log.info('Deleting subject', { subjectId });

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) {
        log.error('Failed to delete subject', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', schoolCode] });
    },
  });

  return {
    ...query,
    createSubject,
    updateSubject,
    deleteSubject,
  };
}
