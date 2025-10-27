import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useStudentPayments(studentId?: string) {
  return useQuery({
    queryKey: ['fees', 'student', studentId],
    queryFn: () => api.fees.getStudentPayments(studentId!),
    enabled: !!studentId,
  });
}

export function useClassPayments(classId?: string) {
  return useQuery({
    queryKey: ['fees', 'class', classId],
    queryFn: () => api.fees.getClassPayments(classId!),
    enabled: !!classId,
  });
}

export function useSchoolPayments(schoolCode?: string) {
  return useQuery({
    queryKey: ['fees', 'school', schoolCode],
    queryFn: () => api.fees.getSchoolPayments(schoolCode!),
    enabled: !!schoolCode,
  });
}
