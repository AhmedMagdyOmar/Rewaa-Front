import {
  billingService,
  OrderFilterParams,
  PaymentFilterParams,
  RejectPaymentData,
  StorePaymentAccountData,
  UpdatePaymentAccountData,
} from "@/lib/api/billing-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const billingKeys = {
  all: ["billing"] as const,
  orders: () => [...billingKeys.all, "orders"] as const,
  ordersList: (params?: OrderFilterParams) => [...billingKeys.orders(), params] as const,
  orderDetail: (id: number | string) => [...billingKeys.orders(), "detail", id] as const,
  payments: () => [...billingKeys.all, "payments"] as const,
  paymentsList: (params?: PaymentFilterParams) => [...billingKeys.payments(), params] as const,
  paymentDetail: (id: number | string) => [...billingKeys.payments(), "detail", id] as const,
  accounts: () => [...billingKeys.all, "accounts"] as const,
  financeSummary: (year?: number) => [...billingKeys.all, "finance-summary", year] as const,
};

// Orders Hooks
export function useOrdersList(params?: OrderFilterParams) {
  return useQuery({
    queryKey: billingKeys.ordersList(params),
    queryFn: () => billingService.getOrders(params),
  });
}

export function useOrderDetail(orderId: number | string) {
  return useQuery({
    queryKey: billingKeys.orderDetail(orderId),
    queryFn: () => billingService.getOrder(orderId),
    enabled: Boolean(orderId),
  });
}

// Payments / Billing Requests Hooks
export function usePaymentsList(params?: PaymentFilterParams) {
  return useQuery({
    queryKey: billingKeys.paymentsList(params),
    queryFn: () => billingService.getPayments(params),
  });
}

export function usePaymentDetail(paymentId: number | string) {
  return useQuery({
    queryKey: billingKeys.paymentDetail(paymentId),
    queryFn: () => billingService.getPayment(paymentId),
    enabled: Boolean(paymentId),
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number | string) => billingService.approvePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.payments() });
      queryClient.invalidateQueries({ queryKey: billingKeys.orders() });
      queryClient.invalidateQueries({ queryKey: billingKeys.financeSummary() });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number | string; data: RejectPaymentData }) =>
      billingService.rejectPayment(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.payments() });
      queryClient.invalidateQueries({ queryKey: billingKeys.orders() });
      queryClient.invalidateQueries({ queryKey: billingKeys.financeSummary() });
    },
  });
}

// Payment Accounts Hooks
export function usePaymentAccounts() {
  return useQuery({
    queryKey: billingKeys.accounts(),
    queryFn: () => billingService.getPaymentAccounts(),
  });
}

export function useCreatePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StorePaymentAccountData) => billingService.createPaymentAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.accounts() });
    },
  });
}

export function useUpdatePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number | string;
      data: UpdatePaymentAccountData;
    }) => billingService.updatePaymentAccount(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.accounts() });
    },
  });
}

export function useDeletePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number | string) => billingService.deletePaymentAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.accounts() });
    },
  });
}

// Finance Summary Hook
export function useFinanceSummary(year?: number) {
  return useQuery({
    queryKey: billingKeys.financeSummary(year),
    queryFn: () => billingService.getFinanceSummary(year),
  });
}
