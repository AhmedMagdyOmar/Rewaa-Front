import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { exploreCoursesService } from "@/lib/api/explore-courses-service";
import type { ExploreCoursesFilterParams } from "@/types/api-contracts";

/**
 * Fetch available (non-enrolled) courses for the student explore page.
 * Delegates search, sort, and pagination entirely to the backend.
 * GET /api/website/courses
 */
export function useExploreCourses(filters?: ExploreCoursesFilterParams) {
  return useQuery({
    queryKey: queryKeys.student.exploreCourses(filters as Record<string, unknown>),
    queryFn: () => exploreCoursesService.getAvailableCourses(filters),
    placeholderData: (previousData) => previousData,
  });
}
