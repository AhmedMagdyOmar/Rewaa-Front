import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, ListFilter } from "lucide-react";

export type WalletDirectionFilter = "all" | "credit" | "debit";

interface StudentWalletFilterBarProps {
  currentFilter: WalletDirectionFilter;
  onFilterChange: (filter: WalletDirectionFilter) => void;
  counts?: {
    all: number;
    credit: number;
    debit: number;
  };
}

export function StudentWalletFilterBar({
  currentFilter,
  onFilterChange,
  counts,
}: StudentWalletFilterBarProps) {
  const t = useTranslations("studentDashboard.wallet");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 p-1 bg-muted/80 rounded-xl border border-border/60 overflow-x-auto w-full sm:w-auto">
        {/* Tab 1: All */}
        <Button
          type="button"
          variant={currentFilter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange("all")}
          className={`rounded-lg text-xs font-bold gap-2 px-3.5 ${
            currentFilter === "all" ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListFilter className="size-3.5" />
          <span>{t("filters.all")}</span>
          {counts?.all !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                currentFilter === "all"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts.all}
            </span>
          )}
        </Button>

        {/* Tab 2: Credits */}
        <Button
          type="button"
          variant={currentFilter === "credit" ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange("credit")}
          className={`rounded-lg text-xs font-bold gap-2 px-3.5 ${
            currentFilter === "credit"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-emerald-600"
          }`}
        >
          <ArrowDownRight className="size-3.5" />
          <span>{t("filters.credit")}</span>
          {counts?.credit !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                currentFilter === "credit"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {counts.credit}
            </span>
          )}
        </Button>

        {/* Tab 3: Debits */}
        <Button
          type="button"
          variant={currentFilter === "debit" ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange("debit")}
          className={`rounded-lg text-xs font-bold gap-2 px-3.5 ${
            currentFilter === "debit"
              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-rose-600"
          }`}
        >
          <ArrowUpRight className="size-3.5" />
          <span>{t("filters.debit")}</span>
          {counts?.debit !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                currentFilter === "debit"
                  ? "bg-white/20 text-white"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {counts.debit}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
