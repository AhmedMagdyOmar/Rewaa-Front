import { api } from "@/lib/apiClient";
import type {
  BackendOrder,
  BackendPaymentAccount,
  OrdersListResponse,
  PayWithWalletPayload,
  StudentOrderFilterParams,
  StudentPaymentAccountsResponse,
  SubmitManualPaymentPayload,
  SubmitManualPaymentResponse,
} from "@/types/api-contracts";

export const studentOrdersService = {
  /**
   * List authenticated student's orders
   * GET /api/website/orders
   */
  async getOrders(params?: StudentOrderFilterParams): Promise<OrdersListResponse> {
    const res = await api<
      | { orders: BackendOrder[]; pagination?: OrdersListResponse["pagination"] }
      | {
          data: BackendOrder[];
          current_page?: number;
          last_page?: number;
          per_page?: number;
          total?: number;
        }
      | BackendOrder[]
    >({
      url: "/api/website/orders",
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

    if ("orders" in res && Array.isArray(res.orders)) {
      return {
        orders: res.orders,
        pagination: res.pagination ?? {
          current_page: 1,
          last_page: 1,
          per_page: res.orders.length,
          total: res.orders.length,
        },
      };
    }

    if ("data" in res && Array.isArray(res.data)) {
      return {
        orders: res.data,
        pagination: {
          current_page: res.current_page ?? 1,
          last_page: res.last_page ?? 1,
          per_page: res.per_page ?? res.data.length,
          total: res.total ?? res.data.length,
        },
      };
    }

    return {
      orders: [],
      pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  },

  /**
   * Get single order details for student
   * GET /api/website/orders/{id}
   */
  async getOrder(orderId: number | string): Promise<BackendOrder> {
    const res = await api<{ order: BackendOrder } | BackendOrder>({
      url: `/api/website/orders/${orderId}`,
      method: "GET",
    });

    if ("order" in res) {
      return res.order;
    }
    return res as BackendOrder;
  },

  /**
   * Get active payment accounts for checkout bank transfer
   * GET /api/website/payment-accounts
   */
  async getPaymentAccounts(): Promise<BackendPaymentAccount[]> {
    const res = await api<
      StudentPaymentAccountsResponse | { data: BackendPaymentAccount[] } | BackendPaymentAccount[]
    >({
      url: "/api/website/payment-accounts",
      method: "GET",
    });

    if (Array.isArray(res)) {
      return res;
    }
    if ("payment_accounts" in res && Array.isArray(res.payment_accounts)) {
      return res.payment_accounts;
    }
    if ("data" in res && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Pay order with student wallet
   * POST /api/website/orders/{id}/pay-with-wallet
   */
  async payWithWallet(
    orderId: number | string,
    payload: PayWithWalletPayload,
  ): Promise<BackendOrder> {
    const res = await api<{ order: BackendOrder } | BackendOrder>({
      url: `/api/website/orders/${orderId}/pay-with-wallet`,
      method: "POST",
      data: payload,
    });

    if ("order" in res) {
      return res.order;
    }
    return res as BackendOrder;
  },

  /**
   * Submit manual bank transfer receipt
   * POST /api/website/orders/{id}/payments
   */
  async submitManualPayment(
    orderId: number | string,
    payload: SubmitManualPaymentPayload,
  ): Promise<SubmitManualPaymentResponse> {
    const formData = new FormData();
    formData.append("payment_account_id", String(payload.payment_account_id));
    formData.append("amount", String(payload.amount));
    formData.append("proof", payload.proof);
    formData.append("idempotency_key", payload.idempotency_key);

    if (payload.submitted_phone) {
      formData.append("submitted_phone", payload.submitted_phone);
    }
    if (payload.transaction_reference) {
      formData.append("transaction_reference", payload.transaction_reference);
    }

    const res = await api<SubmitManualPaymentResponse>({
      url: `/api/website/orders/${orderId}/payments`,
      method: "POST",
      data: formData,
    });

    return res;
  },
};
