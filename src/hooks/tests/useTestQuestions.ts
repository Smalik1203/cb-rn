import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TestQuestionInput } from '../../types/test.types';

export function useTestQuestions(testId: string) {
  return useQuery({
    queryKey: ['testQuestions', testId],
    queryFn: () => api.testQuestions.getByTest(testId),
    enabled: !!testId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionData: TestQuestionInput) => api.testQuestions.create(questionData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testQuestions', variables.test_id] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, questionData }: { questionId: string; questionData: Partial<TestQuestionInput> }) =>
      api.testQuestions.update(questionId, questionData),
    onSuccess: (data) => {
      if (data?.test_id) {
        queryClient.invalidateQueries({ queryKey: ['testQuestions', data.test_id] });
      }
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, testId }: { questionId: string; testId: string }) =>
      api.testQuestions.delete(questionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testQuestions', variables.testId] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useReorderQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, questionIds }: { testId: string; questionIds: string[] }) =>
      api.testQuestions.reorder(testId, questionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testQuestions', variables.testId] });
    },
  });
}
