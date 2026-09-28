import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";

interface BillingPeriodStatProps {
  title: string;
  amount: number;
  delta: number;
  vsLabel: string;
  currencyLabel: string;
}

export function BillingPeriodStatCard({
  title,
  amount,
  delta,
  vsLabel,
  currencyLabel,
}: BillingPeriodStatProps) {
  const isPositive = delta >= 0;

  return (
    <DashboardCard className="p-5 border-border/80 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <DollarSign className="size-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {amount.toLocaleString()}{" "}
          <span className="text-xs font-normal text-muted-foreground">{currencyLabel}</span>
        </div>
        <div
          className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
            isPositive ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          <span>{isPositive ? `+${delta}%` : `${delta}%`}</span>
          <span className="text-muted-foreground font-normal">{vsLabel}</span>
        </div>
      </div>
    </DashboardCard>
  );
}

interface SummaryHighlightsProps {
  highestMonthName: string;
  highestMonthTotal: number;
  lowestMonthName: string;
  lowestMonthTotal: number;
  monthlyAverage: number;
  currencyLabel: string;
  highestLabel: string;
  lowestLabel: string;
  averageLabel: string;
  averageSubLabel: string;
}

export function BillingSummaryHighlights({
  highestMonthName,
  highestMonthTotal,
  lowestMonthName,
  lowestMonthTotal,
  monthlyAverage,
  currencyLabel,
  highestLabel,
  lowestLabel,
  averageLabel,
  averageSubLabel,
}: SummaryHighlightsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Highest Month */}
      <DashboardCard className="p-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-950 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700">{highestLabel}</span>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold">{highestMonthName}</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-700">
            {highestMonthTotal.toLocaleString()}{" "}
            <span className="text-xs font-normal">{currencyLabel}</span>
          </div>
        </div>
      </DashboardCard>

      {/* Lowest Month */}
      <DashboardCard className="p-5 border-destructive/30 bg-destructive/10 text-destructive-950 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-destructive/80">{lowestLabel}</span>
          <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
            <TrendingDown className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold">{lowestMonthName}</div>
          <div className="text-2xl font-extrabold mt-1 text-destructive">
            {lowestMonthTotal.toLocaleString()}{" "}
            <span className="text-xs font-normal">{currencyLabel}</span>
          </div>
        </div>
      </DashboardCard>

      {/* Monthly Average */}
      <DashboardCard className="p-5 border-border/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{averageLabel}</span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-foreground">
            {Math.round(monthlyAverage).toLocaleString()}{" "}
            <span className="text-xs font-normal text-muted-foreground">{currencyLabel}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{averageSubLabel}</div>
        </div>
      </DashboardCard>
    </div>
  );
}
