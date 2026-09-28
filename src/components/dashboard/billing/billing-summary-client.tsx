"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, RotateCcw, Receipt, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceSummary } from "@/hooks/use-billing";
import type { FinancialMonthData, FinancialYearData } from "@/types/finance";
import {
  BillingPeriodStatCard,
  BillingSummaryHighlights,
} from "@/components/dashboard/billing/billing-metrics-cards";
import { BillingPivotTable } from "@/components/dashboard/billing/billing-pivot-table";
import { exportFinancialCsv, exportFinancialPdf, type SummaryMetrics } from "@/lib/export-finance";

const emptySubscribe = () => () => {};

export function BillingSummaryClient() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const locale = useLocale();
  const t = useTranslations("financialSummary");

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: summaryData, isLoading, isFetching, refetch } = useFinanceSummary(selectedYear);
  const isSpinning = isMounted && (isLoading || isFetching);

  const monthKeys = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ] as const;

  const currentMonthIndex = new Date().getMonth(); // 0-11
  const currentYear = new Date().getFullYear();

  // Adapt backend monthly and weekly data into FinancialYearData for pivot table and PDF
  const activeYearData: FinancialYearData = useMemo(() => {
    const months: FinancialMonthData[] = [];
    for (let m = 0; m < 12; m++) {
      const monthNum = m + 1;
      const monthWeeks =
        summaryData?.weekly_sales?.[monthNum] || summaryData?.weekly_sales?.[String(monthNum)];
      if (monthWeeks) {
        months.push({
          monthIndex: m,
          weeks: [
            Number(monthWeeks[1] || monthWeeks["1"] || 0),
            Number(monthWeeks[2] || monthWeeks["2"] || 0),
            Number(monthWeeks[3] || monthWeeks["3"] || 0),
            Number(monthWeeks[4] || monthWeeks["4"] || 0),
          ],
        });
      } else {
        const monthTotal = Number(
          summaryData?.monthly_sales?.[monthNum] ||
            summaryData?.monthly_sales?.[String(monthNum)] ||
            0,
        );
        months.push({
          monthIndex: m,
          weeks: [monthTotal, 0, 0, 0],
        });
      }
    }
    return {
      year: selectedYear,
      months,
    };
  }, [summaryData, selectedYear]);

  // Compute monthly totals for active year
  const monthlyTotals = useMemo(() => {
    return activeYearData.months.map((m, idx) => {
      const monthNum = idx + 1;
      const directMonthly = Number(
        summaryData?.monthly_sales?.[monthNum] || summaryData?.monthly_sales?.[String(monthNum)],
      );
      if (!isNaN(directMonthly) && directMonthly > 0) {
        return directMonthly;
      }
      return m.weeks.reduce((acc, curr) => acc + curr, 0);
    });
  }, [activeYearData, summaryData]);

  // Find highest month, lowest month, average
  const summaryMetrics: SummaryMetrics = useMemo(() => {
    if (monthlyTotals.length === 0) {
      return {
        highestIndex: 0,
        highestTotal: 0,
        lowestIndex: 0,
        lowestTotal: 0,
        average: 0,
      };
    }

    let hIdx = 0;
    let lIdx = 0;
    let sum = 0;

    monthlyTotals.forEach((tot, idx) => {
      sum += tot;
      if (tot > monthlyTotals[hIdx]) hIdx = idx;
      if (tot < monthlyTotals[lIdx]) lIdx = idx;
    });

    const average =
      summaryData?.average_monthly_sales !== undefined
        ? Number(summaryData.average_monthly_sales)
        : sum / 12;

    return {
      highestIndex: summaryData?.highest_month?.month ? summaryData.highest_month.month - 1 : hIdx,
      highestTotal:
        summaryData?.highest_month?.total !== undefined
          ? Number(summaryData.highest_month.total)
          : monthlyTotals[hIdx],
      lowestIndex: summaryData?.lowest_month?.month ? summaryData.lowest_month.month - 1 : lIdx,
      lowestTotal:
        summaryData?.lowest_month?.total !== undefined
          ? Number(summaryData.lowest_month.total)
          : monthlyTotals[lIdx],
      average,
    };
  }, [monthlyTotals, summaryData]);

  const handleExportCsv = () => {
    exportFinancialCsv({
      selectedYear,
      monthKeys,
      activeYearData,
      monthlyTotals,
      locale,
      t,
    });
  };

  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportFinancialPdf({
        selectedYear,
        monthKeys,
        activeYearData,
        summaryMetrics,
        t,
      });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const todayAmount = Number(summaryData?.periods?.today?.total ?? 0);
  const todayDelta = Number(summaryData?.periods?.today?.change_percentage ?? 0);

  const weekAmount = Number(summaryData?.periods?.this_week?.total ?? 0);
  const weekDelta = Number(summaryData?.periods?.this_week?.change_percentage ?? 0);

  const monthAmount = Number(summaryData?.periods?.this_month?.total ?? 0);
  const monthDelta = Number(summaryData?.periods?.this_month?.change_percentage ?? 0);

  const currencyLabel = locale === "ar" ? "ج" : "EGP";

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: PAGE HEADER & SELECT YEAR & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href="/dashboard/billing">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select Year */}
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-35 h-9 text-xs font-medium">
              <Calendar className="size-3.5 me-1 text-muted-foreground" />
              <SelectValue placeholder={t("selectYear")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Data */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isSpinning}
            className="h-9 text-xs font-semibold"
          >
            <RotateCcw className={`size-3.5 me-1.5 ${isSpinning ? "animate-spin" : ""}`} />
            {locale === "ar" ? "تحديث البيانات" : "Refresh"}
          </Button>

          {/* Link to /dashboard/billing */}
          <Button asChild size="sm" className="h-9 text-xs font-semibold">
            <Link href="/dashboard/billing">
              <Receipt className="size-3.5 me-1.5" />
              {t("viewRequests")}
            </Link>
          </Button>
        </div>
      </div>

      {/* SECTION 2: 3 STAT CARDS (Today, This Week, This Month) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BillingPeriodStatCard
          title={t("stats.todayPayments")}
          amount={todayAmount}
          delta={todayDelta}
          vsLabel={t("stats.vsYesterday", { delta: `+${todayDelta}%` })}
          currencyLabel={currencyLabel}
        />
        <BillingPeriodStatCard
          title={t("stats.thisWeekPayments")}
          amount={weekAmount}
          delta={weekDelta}
          vsLabel={t("stats.vsPrevWeek", { delta: `+${weekDelta}%` })}
          currencyLabel={currencyLabel}
        />
        <BillingPeriodStatCard
          title={t("stats.thisMonthPayments")}
          amount={monthAmount}
          delta={monthDelta}
          vsLabel={t("stats.vsPrevMonth", { delta: `+${monthDelta}%` })}
          currencyLabel={currencyLabel}
        />
      </div>

      {/* SECTION 3: PIVOT TABLE REPORT CARD */}
      <BillingPivotTable
        selectedYear={selectedYear}
        currentYear={currentYear}
        currentMonthIndex={currentMonthIndex}
        isLoading={isLoading}
        activeYearData={activeYearData}
        monthlyTotals={monthlyTotals}
        monthKeys={monthKeys}
        locale={locale}
        t={t}
        onPrintPdf={handlePrintPdf}
        onExportCsv={handleExportCsv}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* SECTION 4: 3 BOTTOM SUMMARY CARDS (Highest Month, Lowest Month, Average) */}
      <BillingSummaryHighlights
        highestMonthName={t(`months.${monthKeys[summaryMetrics.highestIndex]}`)}
        highestMonthTotal={summaryMetrics.highestTotal}
        lowestMonthName={t(`months.${monthKeys[summaryMetrics.lowestIndex]}`)}
        lowestMonthTotal={summaryMetrics.lowestTotal}
        monthlyAverage={summaryMetrics.average}
        currencyLabel={currencyLabel}
        highestLabel={t("summaryCards.highestMonth")}
        lowestLabel={t("summaryCards.lowestMonth")}
        averageLabel={t("summaryCards.monthlyAverage")}
        averageSubLabel={locale === "ar" ? "متوسط المبيعات الشهرية" : "Average monthly revenue"}
      />
    </div>
  );
}
