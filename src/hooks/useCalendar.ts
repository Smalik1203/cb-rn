import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useClassCalendar(classId?: string) {
  return useQuery({
    queryKey: ['calendar', 'class', classId],
    queryFn: () => api.calendar.getByClass(classId!),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolCalendar(schoolCode?: string) {
  return useQuery({
    queryKey: ['calendar', 'school', schoolCode],
    queryFn: () => api.calendar.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 5 * 60 * 1000,
  });
}
