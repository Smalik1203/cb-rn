import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export function useStudentFeePayments(studentId?: string) {
  return useQuery({
    queryKey: ['fees', 'student', studentId],
    queryFn: () => api.fees.getStudentPayments(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassFeePayments(classId?: string) {
  return useQuery({
    queryKey: ['fees', 'class', classId],
    queryFn: () => api.fees.getClassPayments(classId!),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolFeePayments(schoolCode?: string) {
  return useQuery({
    queryKey: ['fees', 'school', schoolCode],
    queryFn: () => api.fees.getSchoolPayments(schoolCode!),
    enabled: !!schoolCode,
    staleTime: 5 * 60 * 1000,
  });
}
