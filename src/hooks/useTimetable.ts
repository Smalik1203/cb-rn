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
