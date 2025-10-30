import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api, AttendanceInput } from '../services/api';

type AttendanceRecord = Awaited<ReturnType<typeof api.attendance.getByClass>>[number];

export function useClassAttendance(
  classId?: string, 
  date?: string,
  options?: Omit<UseQueryOptions<AttendanceRecord[]>, 'queryKey' | 'queryFn'>
) {
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
    ...options,
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

export function useClassAttendanceSummary(classId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['attendance', 'class-summary', classId, startDate, endDate],
    queryFn: async ({ signal }) => {
      return api.attendance.getClassAttendanceSummary(classId!, startDate!, endDate!);
    },
    enabled: !!classId && !!startDate && !!endDate,
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
    mutationFn: (records: AttendanceInput[]) => api.attendance.markAttendance(records),
    onSuccess: (data, variables) => {
      // Invalidate specific queries for better performance
      if (variables.length > 0) {
        const classId = variables[0]?.class_instance_id;
        const date = variables[0]?.date;
        
        queryClient.invalidateQueries({ 
          queryKey: ['attendance', 'class', classId, date] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['attendance', 'school'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['attendance', 'student'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['attendance', 'stats'] 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to mark attendance:', error);
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useMarkBulkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      date,
      status,
      markedBy,
      markedByRoleCode,
      schoolCode
    }: {
      classId: string;
      date: string;
        status: 'present' | 'absent';
      markedBy: string;
      markedByRoleCode: string;
      schoolCode: string;
    }) => api.attendance.markBulkAttendance(
      classId,
      date,
      status,
      markedBy,
      markedByRoleCode,
      schoolCode
    ),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'class', variables.classId, variables.date] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'school'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'student'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'stats'] 
      });
    },
    onError: (error) => {
      console.error('Failed to mark bulk attendance:', error);
    },
    retry: 2,
    retryDelay: 1000,
  });
}
