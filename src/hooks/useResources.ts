import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useResources(classId?: string, schoolCode?: string) {
  return useQuery({
    queryKey: ['resources', classId, schoolCode],
    queryFn: () => api.resources.getByClass(classId, schoolCode),
    enabled: !!(classId || schoolCode),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllResources(schoolCode?: string) {
  return useQuery({
    queryKey: ['resources', 'all', schoolCode],
    queryFn: () => api.resources.getAll(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 5 * 60 * 1000,
  });
}
