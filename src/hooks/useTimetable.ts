import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useTimetable(classId?: string) {
  return useQuery({
    queryKey: ['timetable', classId],
    queryFn: () => api.timetable.getByClass(classId!),
    enabled: !!classId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSchoolTimetable(schoolCode?: string) {
  return useQuery({
    queryKey: ['timetable', 'school', schoolCode],
    queryFn: () => api.timetable.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000,
  });
}
