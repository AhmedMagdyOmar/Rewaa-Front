import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { myCoursesService } from "@/lib/api/my-courses-service";
import type { MyCoursesFilterParams } from "@/types/api-contracts";

/**
 * Fetch student enrolled courses with filters and pagination
 */
export function useMyCourses(filters?: MyCoursesFilterParams) {
  return useQuery({
    queryKey: queryKeys.student.myCourses(filters as Record<string, unknown>),
    queryFn: () => myCoursesService.getMyCourses(filters),
    placeholderData: (previousData) => previousData,
  });
}
