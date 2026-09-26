import React from "react";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  History,
  ShoppingBag,
  Compass,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { StudentWalletData } from "@/lib/api/student-wallet-service";
import type { BackendWalletTransaction } from "@/types/api-contracts";

interface StudentWalletBalanceCardProps {
  wallet: StudentWalletData | undefined;
  isLoadingWallet: boolean;
  transactions: BackendWalletTransaction[];
  isLoadingTransactions: boolean;
}

export function StudentWalletBalanceCard({
  wallet,
  isLoadingWallet,
  transactions,
  isLoadingTransactions,
}: StudentWalletBalanceCardProps) {
  const t = useTranslations("studentDashboard.wallet");

  const balance = Number(wallet?.balance ?? 0);
  const currency = wallet?.currency_code || "EGP";
  const isActive = wallet?.is_active !== false;

  // Calculate quick metrics from live transactions ledger
  const totalCredits = transactions
    .filter((tx) => tx.direction === "credit")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalDebits = transactions
    .filter((tx) => tx.direction === "debit")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary Hero Balance Card */}
      <DashboardCard className="lg:col-span-2 p-6 sm:p-8 bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        {/* Background decorative glows */}
        <div className="absolute -end-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute end-16 bottom-0 size-32 rounded-full bg-teal-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Wallet className="size-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-medium">{t("availableBalance")}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                    <CheckCircle2 className="size-3" />
                    {t("statusActive")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-100 border border-amber-400/30">
                    <ShieldAlert className="size-3" />
                    {t("statusInactive")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student-dashboard/courses/explore">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 backdrop-blur-xs text-xs font-semibold"
              >
                <Compass className="size-3.5 me-1.5" />
                {t("browseCourses")}
              </Button>
            </Link>
            <Link href="/student-dashboard/orders">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 backdrop-blur-xs text-xs font-semibold"
              >
                <ShoppingBag className="size-3.5 me-1.5" />
                {t("viewOrders")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Balance amount display */}
        <div className="relative z-10 my-4">
          {isLoadingWallet ? (
            <Skeleton className="h-14 w-48 bg-white/20 rounded-xl" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight" dir="ltr">
                {balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-lg sm:text-xl font-bold text-emerald-200">{currency}</span>
            </div>
          )}
        </div>

        {/* Mini stats footer inside Hero card */}
        <div className="relative z-10 pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <ArrowDownRight className="size-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-100/80 font-medium">{t("totalCredits")}</p>
              {isLoadingTransactions ? (
                <Skeleton className="h-4 w-16 bg-white/20 mt-1" />
              ) : (
                <p className="text-xs sm:text-sm font-bold text-white" dir="ltr">
                  +{totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <ArrowUpRight className="size-4 text-rose-200" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-100/80 font-medium">{t("totalDebits")}</p>
              {isLoadingTransactions ? (
                <Skeleton className="h-4 w-16 bg-white/20 mt-1" />
              ) : (
                <p className="text-xs sm:text-sm font-bold text-white" dir="ltr">
                  -{totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}
                </p>
              )}
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Quick Summary / Highlights Card */}
      <DashboardCard className="p-6 flex flex-col justify-between gap-4 bg-card border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <History className="size-4.5 text-primary" />
            <h3>{t("quickActions")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("totalTransactions")}
            </span>
            {isLoadingTransactions ? (
              <Skeleton className="h-5 w-8" />
            ) : (
              <span className="text-sm font-bold text-foreground">{transactions.length}</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("directions.credit")}
            </span>
            {isLoadingTransactions ? (
              <Skeleton className="h-5 w-8" />
            ) : (
              <span className="text-sm font-bold text-emerald-600">
                {transactions.filter((tx) => tx.direction === "credit").length}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("directions.debit")}
            </span>
            {isLoadingTransactions ? (
              <Skeleton className="h-5 w-8" />
            ) : (
              <span className="text-sm font-bold text-rose-600">
                {transactions.filter((tx) => tx.direction === "debit").length}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-border/60">
          <Link href="/student-dashboard/courses/explore" className="w-full">
            <Button className="w-full font-bold text-xs gap-2">
              <Compass className="size-4" />
              {t("browseCourses")}
            </Button>
          </Link>
        </div>
      </DashboardCard>
    </div>
  );
}
