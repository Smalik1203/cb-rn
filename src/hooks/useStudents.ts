import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useClassStudents(classId?: string) {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: () => api.students.getByClass(classId!),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}
