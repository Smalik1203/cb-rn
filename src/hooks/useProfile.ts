import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.users.getCurrentProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
