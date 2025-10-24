import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useClassStudents(classId?: string) {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: () => api.students.getByClass(classId!),
    enabled: !!classId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSchoolStudents(schoolCode?: string) {
  return useQuery({
    queryKey: ['students', 'school', schoolCode],
    queryFn: () => api.students.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000,
  });
}
