import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useClasses(schoolCode?: string) {
  return useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => api.classes.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000,
  });
}

export function useClass(classId?: string) {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => api.classes.getById(classId!),
    enabled: !!classId,
    staleTime: 10 * 60 * 1000,
  });
}
