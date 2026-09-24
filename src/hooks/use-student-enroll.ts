import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { exploreCoursesService } from "@/lib/api/explore-courses-service";
import type { StoreStudentOrderPayload, StoreStudentOrderResponse } from "@/types/api-contracts";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * Mutation hook to create an order / enroll in a course.
 * Free courses are automatically fulfilled and enrolled immediately by backend.
 */
export function useStudentEnroll() {
  const queryClient = useQueryClient();
  const tCommon = useTranslations("common");

  return useMutation<StoreStudentOrderResponse, Error, StoreStudentOrderPayload>({
    mutationFn: (payload: StoreStudentOrderPayload) => exploreCoursesService.createOrder(payload),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.myCourses() });
      if (variables.course_ids.length === 1) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.courseDetail(variables.course_ids[0]),
        });
      }
    },
    onError: (error: unknown) => {
      const err = error as { apiMessage?: string; message?: string };
      toast.error(err.apiMessage || err.message || tCommon("genericError"));
    },
  });
}
