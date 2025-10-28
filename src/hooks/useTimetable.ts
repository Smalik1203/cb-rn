import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useTimetable(classId?: string) {
  return useQuery({
    queryKey: ['timetable', classId],
    queryFn: async ({ signal }) => {
      return api.timetable.getByClass(classId!);
    },
    enabled: !!classId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useSchoolTimetable(schoolCode?: string) {
  return useQuery({
    queryKey: ['timetable', 'school', schoolCode],
    queryFn: async ({ signal }) => api.timetable.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useTimetableRange(classId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['timetable', classId, startDate, endDate],
    queryFn: async ({ signal }) => {
      // TODO: Implement range-based timetable fetching
      // return api.timetable.getByClassInRange(classId!, startDate!, endDate!, { signal });
      return [];
    },
    enabled: !!classId && !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
