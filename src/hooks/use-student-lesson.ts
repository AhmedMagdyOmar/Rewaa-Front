import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentLessonsService } from "@/lib/api/student-lessons-service";

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
