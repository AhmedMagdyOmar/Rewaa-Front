import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { lessonsService } from "@/lib/api/lessons-service";
import type {
  LessonFilterParams,
  ReorderLessonsData,
  StoreLessonData,
  UpdateLessonData,
} from "@/types/api-contracts";

/**
 * Hook to fetch paginated lessons with filtering & status counts
 */
export function useProviderLessons(filters?: LessonFilterParams) {
  return useQuery({
    queryKey: queryKeys.provider.lessons.list(filters as Record<string, unknown>),
    queryFn: () => lessonsService.getLessons(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch lesson lookup options (stages, subjects, instructors, courses, exams)
 */
export function useProviderLessonOptions(educationalStageId?: number | string) {
  return useQuery({
    queryKey: [...queryKeys.provider.lessons.options(), { educationalStageId }],
    queryFn: () => lessonsService.getLessonOptions(educationalStageId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single lesson details
 */
export function useProviderLesson(lessonId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.lessons.detail(lessonId || ""),
    queryFn: () => lessonsService.getLesson(lessonId!),
    enabled: Boolean(lessonId),
  });
}

/**
 * Hook to create a lesson
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreLessonData | FormData) => lessonsService.createLesson(data),
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.lessons.all() });
      if (lesson.course_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.courses.sections(lesson.course_id),
        });
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.provider.courses.detail(lesson.course_id), "content"],
        });
      }
    },
  });
}

/**
 * Hook to update an existing lesson
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateLessonData | FormData }) =>
      lessonsService.updateLesson(id, data),
    onSuccess: (lesson, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.lessons.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.lessons.detail(variables.id),
      });
      if (lesson.course_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.courses.sections(lesson.course_id),
        });
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.provider.courses.detail(lesson.course_id), "content"],
        });
      }
    },
  });
}

/**
 * Hook to delete a lesson
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => lessonsService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.lessons.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.all() });
    },
  });
}

/**
 * Hook to reorder lessons
 */
export function useReorderLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderLessonsData) => lessonsService.reorderLessons(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.lessons.all() });
      if (variables.course_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.courses.sections(variables.course_id),
        });
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.provider.courses.detail(variables.course_id), "content"],
        });
      }
    },
  });
}
