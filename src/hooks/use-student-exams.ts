import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentExamsService } from "@/lib/api/student-exams-service";
import type {
  SaveExamAnswerPayload,
  StudentExamsFilterParams,
  SubmitExamAttemptPayload,
} from "@/types/api-contracts";

/**
 * Hook to fetch paginated course-linked exams for student
 */
export function useStudentExams(filters?: StudentExamsFilterParams) {
  return useQuery({
    queryKey: queryKeys.student.exams(filters as Record<string, unknown>),
    queryFn: () => studentExamsService.getExams(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch paginated general platform-wide exams for student
 */
export function useStudentGeneralExams(filters?: StudentExamsFilterParams) {
  return useQuery({
    queryKey: queryKeys.student.generalExams(filters as Record<string, unknown>),
    queryFn: () => studentExamsService.getGeneralExams(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch single exam details & accessibility for student
 */
export function useStudentExam(examId?: number | string) {
  return useQuery({
    queryKey: queryKeys.student.examDetail(examId || ""),
    queryFn: () => studentExamsService.getExam(examId!),
    enabled: Boolean(examId),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch latest student exam result for an exam
 */
export function useStudentExamResult(examId?: number | string) {
  return useQuery({
    queryKey: queryKeys.student.examResult(examId || ""),
    queryFn: () => studentExamsService.getExamResult(examId!),
    enabled: Boolean(examId),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch full attempt details (in_progress or graded)
 */
export function useStudentAttempt(attemptId?: number | string) {
  return useQuery({
    queryKey: queryKeys.student.attemptDetail(attemptId || ""),
    queryFn: () => studentExamsService.getAttempt(attemptId!),
    enabled: Boolean(attemptId),
    staleTime: 10 * 1000,
  });
}

/**
 * Hook to start or resume an exam attempt
 */
export function useStartExamAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, courseId }: { examId: number | string; courseId?: number | string }) =>
      studentExamsService.startAttempt(examId, courseId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.student.attemptDetail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.examDetail(variables.examId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.exams(),
      });
    },
  });
}

/**
 * Hook to autosave / update a student's answer for a question in an active attempt
 */
export function useSaveExamAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      questionId,
      payload,
    }: {
      attemptId: number | string;
      questionId: number | string;
      payload: SaveExamAnswerPayload;
    }) => studentExamsService.saveAnswer(attemptId, questionId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.student.attemptDetail(data.id), data);
    },
  });
}

/**
 * Hook to submit an exam attempt for grading
 */
export function useSubmitExamAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      payload,
      courseId,
      examId,
    }: {
      attemptId: number | string;
      payload: SubmitExamAttemptPayload;
      courseId?: number | string;
      examId?: number | string;
    }) => studentExamsService.submitAttempt(attemptId, payload, courseId, examId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.student.attemptDetail(data.id), data);
      if (variables.examId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.examDetail(variables.examId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.examResult(variables.examId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.exams(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.generalExams(),
      });
      if (variables.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.courseContent(variables.courseId),
        });
      }
    },
  });
}

/**
 * Hook to submit a student complaint regarding an exam
 */
export function useSubmitExamComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, body }: { examId: number | string; body: string }) =>
      studentExamsService.submitComplaint(examId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.examDetail(variables.examId),
      });
    },
  });
}
