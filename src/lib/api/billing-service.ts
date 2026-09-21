import { api } from "@/lib/apiClient";
import type {
  ApiPaginationMeta,
  BackendFinanceSummary,
  BackendOrder,
  BackendPayment,
  BackendPaymentAccount,
  OrdersListResponse,
  PaymentsListResponse,
} from "@/types/api-contracts";

export interface OrderFilterParams {
  search?: string;
  status?: string;
  student_id?: number | string;
  course_id?: number | string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface PaymentFilterParams {
  search?: string;
  status?: string;
  method?: string;
  student_id?: number | string;
  order_id?: number | string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface StorePaymentAccountData {
  type: string;
  account_name: Record<string, string>;
  account_number: string;
  instructions?: Record<string, string>;
  is_active?: boolean;
}

export type UpdatePaymentAccountData = Partial<StorePaymentAccountData>;

export interface RejectPaymentData {
  rejection_reason: string;
}

export const billingService = {
  // Orders
  async getOrders(params?: OrderFilterParams): Promise<OrdersListResponse> {
    const res = await api<
      | { orders: BackendOrder[]; pagination: ApiPaginationMeta }
      | {
          data: BackendOrder[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        }
      | BackendOrder[]
    >({
      url: "/api/dashboard/provider/orders",
      method: "GET",
      params,
    });

    if (Array.isArray(res)) {
      return {
        orders: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("orders" in res) {
      return {
        orders: res.orders,
        pagination: res.pagination,
      };
    }

    return {
      orders: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
    };
  },

  async getOrder(orderId: number | string): Promise<BackendOrder> {
    const res = await api<{ order: BackendOrder } | BackendOrder>({
      url: `/api/dashboard/provider/orders/${orderId}`,
      method: "GET",
    });

    if ("order" in res) {
      return res.order;
    }
    return res as BackendOrder;
  },

  // Payments / Billing Requests
  async getPayments(params?: PaymentFilterParams): Promise<PaymentsListResponse> {
    const res = await api<
      | { payments: BackendPayment[]; pagination: ApiPaginationMeta }
      | {
          data: BackendPayment[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        }
      | BackendPayment[]
    >({
      url: "/api/dashboard/provider/payments",
      method: "GET",
      params,
    });

    if (Array.isArray(res)) {
      return {
        payments: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("payments" in res) {
      return {
        payments: res.payments,
        pagination: res.pagination,
      };
    }

    return {
      payments: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
    };
  },

  async getPayment(paymentId: number | string): Promise<BackendPayment> {
    const res = await api<{ payment: BackendPayment } | BackendPayment>({
      url: `/api/dashboard/provider/payments/${paymentId}`,
      method: "GET",
    });

    if ("payment" in res) {
      return res.payment;
    }
    return res as BackendPayment;
  },

  async approvePayment(paymentId: number | string): Promise<BackendPayment> {
    const res = await api<{ payment: BackendPayment } | BackendPayment>({
      url: `/api/dashboard/provider/payments/${paymentId}/approve`,
      method: "POST",
    });

    if ("payment" in res) {
      return res.payment;
    }
    return res as BackendPayment;
  },

  async rejectPayment(
    paymentId: number | string,
    data: RejectPaymentData,
  ): Promise<BackendPayment> {
    const res = await api<{ payment: BackendPayment } | BackendPayment>({
      url: `/api/dashboard/provider/payments/${paymentId}/reject`,
      method: "POST",
      data,
    });

    if ("payment" in res) {
      return res.payment;
    }
    return res as BackendPayment;
  },

  // Payment Accounts (Provider Setup)
  async getPaymentAccounts(): Promise<BackendPaymentAccount[]> {
    const res = await api<{ accounts: BackendPaymentAccount[] } | BackendPaymentAccount[]>({
      url: "/api/dashboard/provider/payment-accounts",
      method: "GET",
    });

    if (Array.isArray(res)) {
      return res;
    }
    if ("accounts" in res) {
      return res.accounts;
    }
    return [];
  },

  async createPaymentAccount(data: StorePaymentAccountData): Promise<BackendPaymentAccount> {
    const res = await api<{ account: BackendPaymentAccount } | BackendPaymentAccount>({
      url: "/api/dashboard/provider/payment-accounts",
      method: "POST",
      data,
    });

    if ("account" in res) {
      return res.account;
    }
    return res as BackendPaymentAccount;
  },

  async updatePaymentAccount(
    accountId: number | string,
    data: UpdatePaymentAccountData,
  ): Promise<BackendPaymentAccount> {
    const res = await api<{ account: BackendPaymentAccount } | BackendPaymentAccount>({
      url: `/api/dashboard/provider/payment-accounts/${accountId}`,
      method: "PUT",
      data,
    });

    if ("account" in res) {
      return res.account;
    }
    return res as BackendPaymentAccount;
  },

  async deletePaymentAccount(accountId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/payment-accounts/${accountId}`,
      method: "DELETE",
    });
  },

  // Finance Summary
  async getFinanceSummary(year?: number): Promise<BackendFinanceSummary> {
    const res = await api<{ summary: BackendFinanceSummary } | BackendFinanceSummary>({
      url: "/api/dashboard/provider/finance/summary",
      method: "GET",
      params: year ? { year } : undefined,
    });

    if ("summary" in res) {
      return res.summary;
    }
    return res as BackendFinanceSummary;
  },
};
