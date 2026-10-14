import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentOrdersService } from "@/lib/api/student-orders-service";
import type {
  BackendOrder,
  BackendPaymentAccount,
  OrdersListResponse,
  PayWithWalletPayload,
  StudentOrderFilterParams,
  SubmitManualPaymentPayload,
  SubmitManualPaymentResponse,
} from "@/types/api-contracts";

/**
 * Fetch student orders with optional pagination & filtering
 */
export function useStudentOrders(filters?: StudentOrderFilterParams) {
  return useQuery<OrdersListResponse>({
    queryKey: queryKeys.student.orders(filters as Record<string, unknown>),
    queryFn: () => studentOrdersService.getOrders(filters),
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch single order details
 */
export function useStudentOrder(orderId: number | string | undefined) {
  return useQuery<BackendOrder>({
    queryKey: queryKeys.student.orderDetail(orderId!),
    queryFn: () => studentOrdersService.getOrder(orderId!),
    enabled: !!orderId,
    staleTime: 10 * 1000,
    refetchOnMount: "always",
  });
}

/**
 * Fetch available payment accounts for manual bank transfer
 */
export function useStudentPaymentAccounts() {
  return useQuery<BackendPaymentAccount[]>({
    queryKey: queryKeys.student.paymentAccounts(),
    queryFn: () => studentOrdersService.getPaymentAccounts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Pay order with student wallet
 */
export function usePayWithWallet(orderId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<BackendOrder, Error, PayWithWalletPayload>({
    mutationFn: (payload) => studentOrdersService.payWithWallet(orderId, payload),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.wallet() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.walletTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.myCourses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.exploreCourses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
      order?.items?.forEach((item) => {
        if (item.course_id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.student.courseDetail(item.course_id),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.student.courseContent(item.course_id),
          });
        }
      });
    },
  });
}

/**
 * Submit manual payment receipt
 */
export function useSubmitManualPayment(orderId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<SubmitManualPaymentResponse, Error, SubmitManualPaymentPayload>({
    mutationFn: (payload) => studentOrdersService.submitManualPayment(orderId, payload),
    onSuccess: (response) => {
      // Immediately update orderDetail cache so navigating to it shows "under_review" without needing a refresh
      queryClient.setQueryData<BackendOrder | undefined>(
        queryKeys.student.orderDetail(orderId),
        (oldOrder) => {
          if (!oldOrder) return oldOrder;
          const updatedPayments = oldOrder.payments ? [...oldOrder.payments] : [];
          if (response?.payment) {
            updatedPayments.unshift(response.payment);
          }
          return {
            ...oldOrder,
            status: "under_review",
            payments: updatedPayments,
          };
        },
      );

      // Invalidate to trigger background re-sync
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.exploreCourses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.website.courses() });
    },
  });
}
