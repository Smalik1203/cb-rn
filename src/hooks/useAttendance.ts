import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useClassAttendance(classId?: string, date?: string) {
  return useQuery({
    queryKey: ['attendance', 'class', classId, date],
    queryFn: () => api.attendance.getByClass(classId!, date),
    enabled: !!classId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useStudentAttendance(studentId?: string) {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => api.attendance.getByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.attendance.markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
