import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useClasses(schoolCode?: string) {
  return useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolCode ? api.classes.getBySchool(schoolCode) : Promise.resolve([]),
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useClass(classId?: string) {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => api.classes.getById(classId!),
    enabled: !!classId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
