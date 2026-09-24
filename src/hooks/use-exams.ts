import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { examsService } from "@/lib/api/exams-service";
import type {
  ExamFilterParams,
  StoreExamData,
  StoreExamSectionData,
  UpdateExamData,
  UpdateExamSectionData,
} from "@/types/api-contracts";

/**
 * Hook to fetch paginated exams with filtering & status counts
 */
export function useProviderExams(filters?: ExamFilterParams) {
  return useQuery({
    queryKey: queryKeys.provider.exams.list(filters as Record<string, unknown>),
    queryFn: () => examsService.getExams(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch exam lookup options (stages, subjects, instructors, courses)
 */
export function useProviderExamOptions(educationalStageId?: number | string) {
  return useQuery({
    queryKey: [...queryKeys.provider.exams.options(), { educationalStageId }],
    queryFn: () => examsService.getExamOptions(educationalStageId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single exam details
 */
export function useProviderExam(examId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.exams.detail(examId || ""),
    queryFn: () => examsService.getExam(examId!),
    enabled: Boolean(examId),
  });
}

/**
 * Hook to create an exam
 */
export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreExamData) => examsService.createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.all() });
    },
  });
}

/**
 * Hook to update an existing exam
 */
export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateExamData }) =>
      examsService.updateExam(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.exams.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to delete an exam
 */
export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => examsService.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.all() });
    },
  });
}

/**
 * Hook to publish an exam immediately
 */
export function usePublishExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => examsService.publishExam(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.detail(id) });
    },
  });
}

/**
 * Hook to schedule exam publication
 */
export function useScheduleExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: number | string; scheduledAt: string }) =>
      examsService.scheduleExam(id, scheduledAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.detail(variables.id) });
    },
  });
}

/**
 * Hook for Exam Sections management (create, update, delete, reorder)
 */
export function useExamSectionMutations(examId: number | string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.detail(examId) });
  };

  const createSection = useMutation({
    mutationFn: (data: StoreExamSectionData) => examsService.createSection(examId, data),
    onSuccess: invalidate,
  });

  const updateSection = useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: number | string;
      data: UpdateExamSectionData;
    }) => examsService.updateSection(examId, sectionId, data),
    onSuccess: invalidate,
  });

  const deleteSection = useMutation({
    mutationFn: (sectionId: number | string) => examsService.deleteSection(examId, sectionId),
    onSuccess: invalidate,
  });

  const reorderSections = useMutation({
    mutationFn: (sectionIds: number[]) => examsService.reorderSections(examId, sectionIds),
    onSuccess: invalidate,
  });

  return {
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  };
}

/**
 * Hook to fetch exam attempts for stats / review / submissions queue
 */
export function useProviderExamAttempts(filters?: {
  exam_id?: number | string;
  student_id?: number | string;
  status?: string;
  per_page?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: queryKeys.provider.exams.attempts(filters),
    queryFn: () => examsService.getExamAttempts(filters),
    staleTime: 15 * 1000,
  });
}

/**
 * Hook to fetch single attempt details for grading
 */
export function useProviderExamAttempt(attemptId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.exams.attemptDetail(attemptId || ""),
    queryFn: () => examsService.getExamAttempt(attemptId!),
    enabled: Boolean(attemptId),
  });
}

/**
 * Hook to grade an exam attempt
 */
export function useGradeExamAttempt(attemptId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: import("@/types/api-contracts").GradeExamAttemptPayload) =>
      examsService.gradeExamAttempt(attemptId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.exams.all(),
      });
      queryClient.setQueryData(queryKeys.provider.exams.attemptDetail(attemptId), data);
    },
  });
}

/**
 * Hook to fetch complaints for an exam
 */
export function useProviderExamComplaints(
  examId?: number | string,
  filters?: import("@/types/api-contracts").ExamComplaintFilterParams,
) {
  return useQuery({
    queryKey: queryKeys.provider.exams.complaints(examId, filters as Record<string, unknown>),
    queryFn: () => examsService.getComplaints(examId!, filters),
    enabled: Boolean(examId),
    staleTime: 15 * 1000,
  });
}

/**
 * Hook to fetch single complaint details
 */
export function useProviderExamComplaint(examId?: number | string, complaintId?: number | string) {
  return useQuery({
    queryKey: [...queryKeys.provider.exams.complaints(examId), "detail", complaintId],
    queryFn: () => examsService.getComplaint(examId!, complaintId!),
    enabled: Boolean(examId && complaintId),
  });
}

/**
 * Hook to delete/dismiss an exam complaint
 */
export function useDeleteExamComplaint(examId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (complaintId: number | string) => examsService.deleteComplaint(examId, complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.exams.detail(examId),
      });
    },
  });
}
