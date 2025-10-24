import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useUserTasks(userId?: string) {
  return useQuery({
    queryKey: ['tasks', 'user', userId],
    queryFn: () => api.tasks.getByUser(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSchoolTasks(schoolCode?: string) {
  return useQuery({
    queryKey: ['tasks', 'school', schoolCode],
    queryFn: () => api.tasks.getBySchool(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 2 * 60 * 1000,
  });
}
