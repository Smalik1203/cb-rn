import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useSubjects(schoolCode?: string) {
  return useQuery({
    queryKey: ['subjects', schoolCode],
    queryFn: async ({ signal }) => {
      if (!schoolCode) return [];
      return api.subjects.getBySchool(schoolCode);
    },
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

export function useAdmin(schoolCode?: string) {
  return useQuery({
    queryKey: ['admin', schoolCode],
    queryFn: async ({ signal }) => {
      if (!schoolCode) return [];
      return api.admin.getBySchool(schoolCode);
    },
    enabled: !!schoolCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
