import { api } from "@/lib/apiClient";
import type { BackendWalletTransaction, WalletTransactionsResponse } from "@/types/api-contracts";

export interface StudentWalletData {
  id?: number;
  balance: number | string;
  currency_code?: string;
  is_active?: boolean;
}

export const studentWalletService = {
  /**
   * Get authenticated student's wallet balance
   * GET /api/website/wallet
   */
  async getWallet(): Promise<StudentWalletData> {
    const res = await api<{ wallet: StudentWalletData } | StudentWalletData>({
      url: "/api/website/wallet",
      method: "GET",
    });

    if ("wallet" in res) {
      return res.wallet;
    }
    return res as StudentWalletData;
  },

  /**
   * Get authenticated student's wallet ledger transactions
   * GET /api/website/wallet/transactions
   */
  async getTransactions(params?: {
    direction?: "credit" | "debit";
    page?: number;
    per_page?: number;
  }): Promise<WalletTransactionsResponse> {
    const res = await api<
      | {
          transactions: BackendWalletTransaction[];
          pagination: WalletTransactionsResponse["pagination"];
        }
      | {
          data: BackendWalletTransaction[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        }
      | BackendWalletTransaction[]
    >({
      url: "/api/website/wallet/transactions",
      method: "GET",
      params,
    });

    if (Array.isArray(res)) {
      return {
        transactions: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("transactions" in res) {
      return {
        transactions: res.transactions,
        pagination: res.pagination,
      };
    }

    return {
      transactions: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
    };
  },
};
