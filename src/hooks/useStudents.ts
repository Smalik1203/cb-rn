import { useQuery } from '@tanstack/react-query';
import { listStudents } from '../data/queries';

export function useStudents(classInstanceId?: string, schoolCode?: string) {
  return useQuery({
    queryKey: ['students', classInstanceId, schoolCode],
    queryFn: async () => {
      if (!classInstanceId || !schoolCode) {
        return [];
      }
      const result = await listStudents(classInstanceId, schoolCode);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!classInstanceId && !!schoolCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
