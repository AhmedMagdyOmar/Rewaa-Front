import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { exploreCoursesService } from "@/lib/api/explore-courses-service";
import { myCoursesService } from "@/lib/api/my-courses-service";

/**
 * Fetch course details for a student.
 * Tries available course endpoint first (GET /api/website/courses/{courseId}),
 * and if that fails or returns not found/forbidden, falls back to enrolled course endpoint (GET /api/website/my-courses/{courseId}).
 */
export function useStudentCourseDetail(courseId: string | number) {
  return useQuery({
    queryKey: queryKeys.student.courseDetail(courseId),
    queryFn: async () => {
      try {
        const res = await exploreCoursesService.getAvailableCourse(courseId);
        return res.course;
      } catch (err: unknown) {
        // If not found in available courses (e.g. student is enrolled so available query returns 404 or backend redirects),
        // try enrolled course details endpoint:
        try {
          const enrolledRes = await myCoursesService.getEnrolledCourse(courseId);
          return enrolledRes.course;
        } catch {
          throw err;
        }
      }
    },
    enabled: Boolean(courseId),
  });
}
