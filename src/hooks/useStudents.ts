import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStudents } from '../data/queries';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

export function useStudents(
  classInstanceId?: string,
  schoolCode?: string,
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return useQuery({
    queryKey: ['students', classInstanceId, schoolCode, page, pageSize],
    queryFn: async () => {
      if (!classInstanceId || !schoolCode) {
        return [];
      }
      const result = await listStudents(classInstanceId, schoolCode, { from, to });
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!classInstanceId && !!schoolCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create Student Input Type
export interface CreateStudentInput {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  student_code: string;
  class_instance_id: string;
}

// Create Student Mutation
export function useCreateStudent(schoolCode: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      console.log('Creating student:', { ...input, password: '[REDACTED]' });
      
      if (!schoolCode) {
        throw new Error('School code is required');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Failed to get session: ' + sessionError.message);
      }
      
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      log.info('Creating student', { email: input.email });

      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-student`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: input.full_name,
          email: input.email,
          password: input.password,
          phone: input.phone,
          student_code: input.student_code,
          class_instance_id: input.class_instance_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || result.details || 'Failed to create student';
        throw new Error(errorMessage);
      }

      return result;
    },
    onSuccess: (data, variables) => {
      log.info('Student created successfully', { email: variables.email });
      // Invalidate students query for the class
      queryClient.invalidateQueries({ queryKey: ['students', variables.class_instance_id, schoolCode] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      log.error('Failed to create student', { error: error.message });
    },
  });
}
