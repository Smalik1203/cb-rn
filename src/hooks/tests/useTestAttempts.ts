import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TestAttemptInput } from '../../types/test.types';

export function useTestAttempts(testId: string) {
  return useQuery({
    queryKey: ['testAttempts', testId],
    queryFn: () => api.testAttempts.getByTest(testId),
    enabled: !!testId,
  });
}

export function useStudentAttempts(studentId: string, testId?: string) {
  return useQuery({
    queryKey: ['studentAttempts', studentId, testId],
    queryFn: () => api.testAttempts.getByStudent(studentId, testId),
    enabled: !!studentId,
  });
}

export function useCreateAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptData: TestAttemptInput) => api.testAttempts.create(attemptData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testAttempts', variables.test_id] });
      queryClient.invalidateQueries({ queryKey: ['studentAttempts', variables.student_id] });
    },
  });
}

export function useUpdateAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, attemptData }: { attemptId: string; attemptData: Partial<TestAttemptInput> }) =>
      api.testAttempts.update(attemptId, attemptData),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['testAttempts', data.test_id] });
        queryClient.invalidateQueries({ queryKey: ['studentAttempts', data.student_id] });
      }
    },
  });
}

export function useSubmitTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      finalAnswers,
      earnedPoints,
      totalPoints,
    }: {
      attemptId: string;
      finalAnswers: any;
      earnedPoints: number;
      totalPoints: number;
    }) => api.testAttempts.submit(attemptId, finalAnswers, earnedPoints, totalPoints),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['testAttempts', data.test_id] });
        queryClient.invalidateQueries({ queryKey: ['studentAttempts', data.student_id] });
        queryClient.invalidateQueries({ queryKey: ['tests'] });
      }
    },
  });
}
