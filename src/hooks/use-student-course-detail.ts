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
      // For student portal, try enrolled course first so full enrollment and curriculum status are loaded
      try {
        const enrolledRes = await myCoursesService.getEnrolledCourse(courseId);
        return enrolledRes.course;
      } catch {
        // If not enrolled or returns 404/403, fallback to available course preview endpoint
        const res = await exploreCoursesService.getAvailableCourse(courseId);
        return res.course;
      }
    },
    enabled: Boolean(courseId),
  });
}
