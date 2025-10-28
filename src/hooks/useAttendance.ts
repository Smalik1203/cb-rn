import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useClassAttendance(classId?: string, date?: string) {
  return useQuery({
    queryKey: ['attendance', 'class', classId, date],
    queryFn: async ({ signal }) => {
      return api.attendance.getByClass(classId!, date);
    },
    enabled: !!classId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useSchoolAttendance(schoolCode?: string, date?: string) {
  return useQuery({
    queryKey: ['attendance', 'school', schoolCode, date],
    queryFn: async ({ signal }) => {
      return api.attendance.getBySchool(schoolCode!, date);
    },
    enabled: !!schoolCode,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useStudentAttendance(studentId?: string) {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: async ({ signal }) => {
      return api.attendance.getByStudent(studentId!);
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.attendance.markAttendance,
    onSuccess: (data, variables) => {
      // Invalidate specific queries for better performance
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'class', variables[0]?.class_instance_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'school'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'student'] 
      });
    },
    onError: (error) => {
    },
    retry: 2,
    retryDelay: 1000,
  });
}
