import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  ShoppingBag,
  Gift,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { BackendWalletTransaction } from "@/types/api-contracts";

interface StudentWalletTransactionsTableProps {
  transactions: BackendWalletTransaction[];
  isLoading: boolean;
  currency?: string;
}

export function StudentWalletTransactionsTable({
  transactions,
  isLoading,
  currency = "EGP",
}: StudentWalletTransactionsTableProps) {
  const t = useTranslations("studentDashboard.wallet");
  const locale = useLocale();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const getReasonBadge = (reason: string, reasonLabel?: string) => {
    const label = t.has(`reasons.${reason}`) ? t(`reasons.${reason}`) : reasonLabel || reason;

    if (reason === "course_purchase") {
      return (
        <Badge
          variant="outline"
          className="text-[11px] gap-1.5 py-1 px-2.5 bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-900/50"
        >
          <ShoppingBag className="size-3" />
          <span>{label}</span>
        </Badge>
      );
    }

    if (reason === "admin_top_up" || reason === "manual_credit") {
      return (
        <Badge
          variant="outline"
          className="text-[11px] gap-1.5 py-1 px-2.5 bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-900/50"
        >
          <ArrowDownRight className="size-3" />
          <span>{label}</span>
        </Badge>
      );
    }

    if (reason === "wallet_refund" || reason === "refund") {
      return (
        <Badge
          variant="outline"
          className="text-[11px] gap-1.5 py-1 px-2.5 bg-teal-500/10 text-teal-700 border-teal-200 dark:border-teal-900/50"
        >
          <RotateCcw className="size-3" />
          <span>{label}</span>
        </Badge>
      );
    }

    if (reason === "activation_code") {
      return (
        <Badge
          variant="outline"
          className="text-[11px] gap-1.5 py-1 px-2.5 bg-purple-500/10 text-purple-700 border-purple-200 dark:border-purple-900/50"
        >
          <Gift className="size-3" />
          <span>{label}</span>
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="text-[11px] gap-1.5 py-1 px-2.5 bg-muted text-foreground border-border"
      >
        <SlidersHorizontal className="size-3" />
        <span>{label}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2 text-end">
              <Skeleton className="h-4 w-20 ms-auto" />
              <Skeleton className="h-3 w-16 ms-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-16 px-4 text-center space-y-3">
        <div className="size-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
          <FileText className="size-7" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-foreground">{t("empty.title")}</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{t("empty.description")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent *:rtl:text-start">
            <TableHead className="w-24 text-xs font-bold">{t("table.id")}</TableHead>
            <TableHead className="text-xs font-bold">{t("table.reason")}</TableHead>
            <TableHead className="text-xs font-bold">{t("table.type")}</TableHead>
            <TableHead className="text-xs font-bold text-end">{t("table.amount")}</TableHead>
            <TableHead className="text-xs font-bold text-end">{t("table.balanceAfter")}</TableHead>
            <TableHead className="text-xs font-bold text-end">{t("table.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const isCredit = tx.direction === "credit";
            const numAmount = Number(tx.amount || 0);
            const numBalanceAfter =
              tx.balance_after !== undefined && tx.balance_after !== null
                ? Number(tx.balance_after)
                : null;

            return (
              <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                {/* ID & Order reference */}
                <TableCell className="font-mono text-xs font-semibold rtl:text-end" dir="ltr">
                  #{tx.id}
                  {tx.order_id && (
                    <div className="mt-0.5">
                      <Link
                        href={`/student-dashboard/orders/${tx.order_id}`}
                        className="text-[11px] font-mono text-primary hover:underline"
                      >
                        {tx.order_number
                          ? tx.order_number
                          : t("table.orderNumber", { number: tx.order_id })}
                      </Link>
                    </div>
                  )}
                </TableCell>

                {/* Reason & description badge */}
                <TableCell>
                  <div className="space-y-1">
                    <div>{getReasonBadge(tx.reason, tx.reason_label)}</div>
                    {tx.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{tx.notes}</p>
                    )}
                  </div>
                </TableCell>

                {/* Direction */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {isCredit ? (
                      <div className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <ArrowDownRight className="size-3.5" />
                      </div>
                    ) : (
                      <div className="size-6 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="size-3.5" />
                      </div>
                    )}
                    <span
                      className={`text-xs font-bold ${
                        isCredit ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isCredit ? t("directions.credit") : t("directions.debit")}
                    </span>
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="text-end font-bold text-sm" dir="ltr">
                  <span
                    className={
                      isCredit ? "text-emerald-600 font-black" : "text-rose-600 font-black"
                    }
                  >
                    {isCredit ? "+" : "-"}
                    {numAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>{" "}
                  <span className="text-xs font-normal text-muted-foreground">{currency}</span>
                </TableCell>

                {/* Balance After */}
                <TableCell className="text-end font-medium text-xs text-muted-foreground" dir="ltr">
                  {numBalanceAfter !== null ? (
                    <span>
                      {numBalanceAfter.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px]">{currency}</span>
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                {/* Date */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(tx.created_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
