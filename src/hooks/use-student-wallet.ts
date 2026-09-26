import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentWalletService, StudentWalletData } from "@/lib/api/student-wallet-service";
import type { WalletTransactionsResponse } from "@/types/api-contracts";

/**
 * Fetch authenticated student's wallet balance
 * GET /api/website/wallet
 */
export function useStudentWebsiteWallet() {
  return useQuery<StudentWalletData>({
    queryKey: queryKeys.student.wallet(),
    queryFn: () => studentWalletService.getWallet(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch authenticated student's wallet transactions
 * GET /api/website/wallet/transactions
 */
export function useStudentWebsiteWalletTransactions(filters?: {
  direction?: "credit" | "debit";
  page?: number;
  per_page?: number;
}) {
  return useQuery<WalletTransactionsResponse>({
    queryKey: queryKeys.student.walletTransactions(filters as Record<string, unknown>),
    queryFn: () => studentWalletService.getTransactions(filters),
    staleTime: 60 * 1000,
  });
}
