import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useSubjects(schoolCode?: string) {
  return useQuery({
    queryKey: ['subjects', schoolCode],
    queryFn: async ({ signal }) => {
      // TODO: Implement subjects API with signal support
      // For now, return empty array since api.subjects doesn't exist
      return [];
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
      // TODO: Implement admin API with signal support
      // For now, return empty array since api.admin doesn't exist
      return [];
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
