import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentLessonsService } from "@/lib/api/student-lessons-service";
import type { StudentStandaloneLessonsFilterParams } from "@/types/api-contracts";

/**
 * Fetch paginated standalone / independent lessons for current student.
 * GET /api/website/lessons
 */
export function useStudentStandaloneLessons(
  params?: StudentStandaloneLessonsFilterParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.student.standaloneLessons(params as Record<string, unknown>),
    queryFn: () => studentLessonsService.getStandaloneLessons(params),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch detailed content of a standalone / independent lesson.
 * GET /api/website/lessons/{lessonId}
 */
export function useStudentStandaloneLessonDetail(
  lessonId: string | number | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.student.standaloneLesson(lessonId || 0),
    queryFn: async () => {
      if (!lessonId) return null;
      return studentLessonsService.getStandaloneLesson(lessonId);
    },
    enabled: Boolean(lessonId) && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Mutation to toggle standalone lesson completion state on the backend.
 * Automatically invalidates standalone lessons list and detail queries.
 */
export function useToggleStandaloneLessonCompletion(lessonId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string | number; isCompleted: boolean }) => {
      if (isCompleted) {
        return studentLessonsService.markStandaloneComplete(id);
      } else {
        return studentLessonsService.markStandaloneIncomplete(id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.standaloneLessons(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.standaloneLesson(variables.id),
      });
      if (lessonId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.standaloneLesson(lessonId),
        });
      }
    },
  });
}

/**
 * Fetch detailed content of an accessible enrolled course lesson.
 * GET /api/website/my-courses/{courseId}/lessons/{lessonId}
 */
export function useStudentLessonDetail(
  courseId: string | number,
  lessonId: string | number | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.student.lesson(courseId, lessonId || 0),
    queryFn: async () => {
      if (!lessonId) return null;
      return studentLessonsService.getCourseLesson(courseId, lessonId);
    },
    enabled: Boolean(courseId && lessonId) && enabled,
  });
}

/**
 * Mutation to toggle course-nested lesson completion state on the backend.
 */
export function useToggleLessonCompletion(courseId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      isCompleted,
    }: {
      lessonId: string | number;
      isCompleted: boolean;
    }) => {
      if (isCompleted) {
        return studentLessonsService.markCourseLessonComplete(courseId, lessonId);
      } else {
        return studentLessonsService.markCourseLessonIncomplete(courseId, lessonId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.courseContent(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.courseDetail(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.myCourses(),
      });
    },
  });
}
