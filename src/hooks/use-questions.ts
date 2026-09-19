import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { questionsService } from "@/lib/api/questions-service";
import type {
  QuestionFilterParams,
  StoreQuestionData,
  UpdateQuestionData,
} from "@/types/api-contracts";

/**
 * Hook to fetch paginated questions with filtering
 */
export function useProviderQuestions(filters?: QuestionFilterParams) {
  return useQuery({
    queryKey: queryKeys.provider.questions.list(filters as Record<string, unknown>),
    queryFn: () => questionsService.getQuestions(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch question options (types, difficulties, classifications, stages, subjects, exams)
 */
export function useProviderQuestionOptions(
  educationalStageId?: number | string,
  examId?: number | string,
) {
  return useQuery({
    queryKey: [...queryKeys.provider.questions.options(), { educationalStageId, examId }],
    queryFn: () => questionsService.getQuestionOptions(educationalStageId, examId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch single question details
 */
export function useProviderQuestion(questionId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.questions.detail(questionId || ""),
    queryFn: () => questionsService.getQuestion(questionId!),
    enabled: Boolean(questionId),
  });
}

/**
 * Hook to create a question
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreQuestionData) => questionsService.createQuestion(data),
    onSuccess: (question) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.questions.all() });
      if (question.exam_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.exams.detail(question.exam_id),
        });
      }
    },
  });
}

/**
 * Hook to update a question
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateQuestionData }) =>
      questionsService.updateQuestion(id, data),
    onSuccess: (question, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.questions.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.questions.detail(variables.id),
      });
      if (question.exam_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.exams.detail(question.exam_id),
        });
      }
    },
  });
}

/**
 * Hook to delete a question
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => questionsService.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.questions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.all() });
    },
  });
}

/**
 * Hook to reorder questions
 */
export function useReorderQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionIds,
      examId,
      examSectionId,
    }: {
      questionIds: number[];
      examId?: number | string;
      examSectionId?: number | string;
    }) => questionsService.reorderQuestions(questionIds, examId, examSectionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.questions.all() });
      if (variables.examId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.exams.detail(variables.examId),
        });
      }
    },
  });
}
