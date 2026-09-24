import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { myCoursesService } from "@/lib/api/my-courses-service";

/**
 * Fetch curriculum tree, accessible sections, lock statuses, and progress for an enrolled course.
 * GET /api/website/my-courses/{courseId}/content
 */
export function useStudentCourseContent(courseId: string | number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.student.courseContent(courseId),
    queryFn: async () => {
      const res = await myCoursesService.getCourseContent(courseId);
      return res.content;
    },
    enabled: Boolean(courseId) && enabled,
  });
}
