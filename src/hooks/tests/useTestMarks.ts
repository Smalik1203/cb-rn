import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TestMarkInput } from '../../types/test.types';

export function useTestMarks(testId: string) {
  return useQuery({
    queryKey: ['testMarks', testId],
    queryFn: () => api.testMarks.getByTest(testId),
    enabled: !!testId,
  });
}

export function useStudentMarks(studentId: string) {
  return useQuery({
    queryKey: ['studentMarks', studentId],
    queryFn: () => api.testMarks.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useCreateMark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (markData: TestMarkInput) => api.testMarks.create(markData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testMarks', variables.test_id] });
      queryClient.invalidateQueries({ queryKey: ['studentMarks', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useCreateBulkMarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (marksData: TestMarkInput[]) => api.testMarks.createBulk(marksData),
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['testMarks', variables[0].test_id] });
        queryClient.invalidateQueries({ queryKey: ['tests'] });
      }
    },
  });
}

export function useUpdateMark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ markId, markData }: { markId: string; markData: Partial<TestMarkInput> }) =>
      api.testMarks.update(markId, markData),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['testMarks', data.test_id] });
        queryClient.invalidateQueries({ queryKey: ['studentMarks', data.student_id] });
      }
    },
  });
}

export function useDeleteMark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ markId, testId, studentId }: { markId: string; testId: string; studentId: string }) =>
      api.testMarks.delete(markId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testMarks', variables.testId] });
      queryClient.invalidateQueries({ queryKey: ['studentMarks', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}
