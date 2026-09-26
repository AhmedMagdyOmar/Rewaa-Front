"use client";

import React, { useState } from "react";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Button } from "@/components/ui/button";
import {
  useStudentWebsiteWallet,
  useStudentWebsiteWalletTransactions,
} from "@/hooks/use-student-wallet";
import { StudentWalletBalanceCard } from "./StudentWalletBalanceCard";
import { StudentWalletFilterBar, type WalletDirectionFilter } from "./StudentWalletFilterBar";
import { StudentWalletTransactionsTable } from "./StudentWalletTransactionsTable";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

export function StudentWalletClient() {
  const t = useTranslations("studentDashboard.wallet");

  const [directionFilter, setDirectionFilter] = useState<WalletDirectionFilter>("all");
  const [page, setPage] = useState<number>(1);
  const perPage = 15;

  // 1. Fetch live balance
  const {
    data: walletData,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
    isRefetching: isRefetchingWallet,
  } = useStudentWebsiteWallet();

  // 2. Fetch paginated ledger
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
    isRefetching: isRefetchingTransactions,
  } = useStudentWebsiteWalletTransactions({
    direction: directionFilter === "all" ? undefined : directionFilter,
    page,
    per_page: perPage,
  });

  // 3. Unfiltered transactions for calculating quick metrics/counts
  const { data: allTransactionsData } = useStudentWebsiteWalletTransactions({
    per_page: 100,
  });

  const allTxList = allTransactionsData?.transactions ?? [];
  const currentTxList = transactionsData?.transactions ?? [];
  const pagination = transactionsData?.pagination;

  const counts = {
    all: allTxList.length,
    credit: allTxList.filter((t) => t.direction === "credit").length,
    debit: allTxList.filter((t) => t.direction === "debit").length,
  };

  const handleFilterChange = (newFilter: WalletDirectionFilter) => {
    setDirectionFilter(newFilter);
    setPage(1);
  };

  const handleRefresh = () => {
    refetchWallet();
    refetchTransactions();
  };

  const isRefreshing = isRefetchingWallet || isRefetchingTransactions;

  const totalPages = pagination?.last_page ?? 1;
  const totalItems = pagination?.total ?? currentTxList.length;
  const startItem = totalItems > 0 ? (page - 1) * perPage + 1 : 0;
  const endItem = Math.min(page * perPage, totalItems);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto text-xs font-semibold gap-2 border-border/80"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? t("refreshing") : t("refresh")}</span>
        </Button>
      </div>

      {/* Hero Balance & Quick Stats */}
      <StudentWalletBalanceCard
        wallet={walletData}
        isLoadingWallet={isLoadingWallet}
        transactions={allTxList}
        isLoadingTransactions={isLoadingTransactions}
      />

      {/* Transaction Ledger Card */}
      <DashboardCard className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h3 className="text-lg font-bold text-foreground">{t("transactionsTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("transactionsSubtitle")}</p>
          </div>

          <StudentWalletFilterBar
            currentFilter={directionFilter}
            onFilterChange={handleFilterChange}
            counts={counts}
          />
        </div>

        {/* Transactions Table */}
        <StudentWalletTransactionsTable
          transactions={currentTxList}
          isLoading={isLoadingTransactions}
          currency={walletData?.currency_code || "EGP"}
        />

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              {t("pagination.showing", {
                start: startItem,
                end: endItem,
                total: totalItems,
              })}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingTransactions}
                className="text-xs font-semibold gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>{t("pagination.previous")}</span>
              </Button>

              <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-muted text-foreground">
                {page} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoadingTransactions}
                className="text-xs font-semibold gap-1"
              >
                <span>{t("pagination.next")}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
