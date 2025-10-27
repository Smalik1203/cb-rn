import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useClassResources(classId?: string, schoolCode?: string) {
  return useQuery({
    queryKey: ['resources', 'class', classId, schoolCode],
    queryFn: () => api.resources.getByClass(classId!, schoolCode),
    enabled: !!classId,
  });
}

export function useAllResources(schoolCode?: string) {
  return useQuery({
    queryKey: ['resources', 'school', schoolCode],
    queryFn: () => api.resources.getAll(schoolCode!),
    enabled: !!schoolCode,
  });
}
