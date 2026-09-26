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
    staleTime: 30 * 1000,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.wallet() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.walletTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.myCourses() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.orders() });
    },
  });
}
