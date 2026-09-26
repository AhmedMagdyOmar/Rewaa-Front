import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentActivationCodesService } from "@/lib/api/student-activation-codes-service";
import type {
  RedeemActivationCodePayload,
  RedeemActivationCodeResponse,
} from "@/types/api-contracts";

export function useRedeemActivationCode() {
  const queryClient = useQueryClient();

  return useMutation<RedeemActivationCodeResponse, Error, RedeemActivationCodePayload>({
    mutationFn: (payload: RedeemActivationCodePayload) =>
      studentActivationCodesService.redeemCode(payload),
    onSuccess: (data) => {
      // Invalidate all student-related caches so courses, orders, and stats update immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.student.myCourses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.exploreCourses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orders() });
      if (data?.course_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.courseDetail(data.course_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
    },
  });
}
