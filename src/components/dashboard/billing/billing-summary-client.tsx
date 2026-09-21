"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinanceSummary } from "@/hooks/use-billing";
import { FinancialSummaryPDF } from "@/components/pdf/FinancialSummaryPDF";
import type { FinancialMonthData, FinancialYearData } from "@/lib/financial-summary-storage";

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
  const summaryMetrics = useMemo(() => {
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

  // CSV Export function
  const handleExportCsv = () => {
    const monthHeaders = monthKeys.map((k) => t(`months.${k}`));
    const weekLabel = locale === "ar" ? "الأسبوع" : "Week";
    const totalLabel = locale === "ar" ? "الإجمالي" : "Total";

    const rows: string[][] = [];
    rows.push([weekLabel, ...monthHeaders]);

    [0, 1, 2, 3].forEach((wIdx) => {
      const weekName = `${weekLabel} ${wIdx + 1}`;
      const weekValues = activeYearData.months.map((m) => m.weeks[wIdx].toString());
      rows.push([weekName, ...weekValues]);
    });

    rows.push([totalLabel, ...monthlyTotals.map((tot) => tot.toString())]);

    const csvContent =
      "\uFEFF" +
      rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-summary-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Generation function
  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const monthNames = monthKeys.map((k) => t(`months.${k}`));
      const highestMonthName = t(`months.${monthKeys[summaryMetrics.highestIndex]}`);
      const lowestMonthName = t(`months.${monthKeys[summaryMetrics.lowestIndex]}`);

      const blob = await pdf(
        <FinancialSummaryPDF
          yearData={activeYearData}
          monthNames={monthNames}
          highestMonthName={highestMonthName}
          highestMonthTotal={summaryMetrics.highestTotal}
          lowestMonthName={lowestMonthName}
          lowestMonthTotal={summaryMetrics.lowestTotal}
          monthlyAverage={summaryMetrics.average}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-summary-${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
        {/* Card 1: Today */}
        <DashboardCard className="p-5 border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.todayPayments")}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {todayAmount.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="size-3.5" />
              <span>{todayDelta >= 0 ? `+${todayDelta}%` : `${todayDelta}%`}</span>
              <span className="text-muted-foreground font-normal">
                {t("stats.vsYesterday", { delta: `+${todayDelta}%` })}
              </span>
            </div>
          </div>
        </DashboardCard>

        {/* Card 2: This Week */}
        <DashboardCard className="p-5 border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.thisWeekPayments")}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {weekAmount.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="size-3.5" />
              <span>{weekDelta >= 0 ? `+${weekDelta}%` : `${weekDelta}%`}</span>
              <span className="text-muted-foreground font-normal">
                {t("stats.vsPrevWeek", { delta: `+${weekDelta}%` })}
              </span>
            </div>
          </div>
        </DashboardCard>

        {/* Card 3: This Month */}
        <DashboardCard className="p-5 border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.thisMonthPayments")}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {monthAmount.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="size-3.5" />
              <span>{monthDelta >= 0 ? `+${monthDelta}%` : `${monthDelta}%`}</span>
              <span className="text-muted-foreground font-normal">
                {t("stats.vsPrevMonth", { delta: `+${monthDelta}%` })}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* SECTION 3: PIVOT TABLE REPORT CARD */}
      <DashboardCard className="p-5 border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {t("pivotTable.title")} ({selectedYear})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              disabled={isGeneratingPdf}
              className="h-8 text-xs font-medium"
            >
              <Printer className="size-3.5 me-1.5 text-muted-foreground" />
              {isGeneratingPdf
                ? locale === "ar"
                  ? "جاري الطباعة..."
                  : "Printing..."
                : t("pivotTable.printPdf")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                  <Download className="size-3.5 me-1.5 text-muted-foreground" />
                  {t("pivotTable.export")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleExportCsv}>
                  <FileSpreadsheet className="size-4 me-2 text-muted-foreground" />
                  {t("pivotTable.exportCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintPdf}>
                  <FileText className="size-4 me-2 text-muted-foreground" />
                  {t("pivotTable.exportPdf")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Pivot Table Container */}
        <div className="mt-4 overflow-x-auto rounded-lg border border-border/60">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-xs">
                {locale === "ar" ? "جارٍ تحميل ملخص المالية..." : "Loading financial summary..."}
              </span>
            </div>
          ) : (
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/80">
                  <th className="p-3 text-start font-bold text-foreground min-w-25 sticky inset-s-0 bg-muted/90 backdrop-blur-xs">
                    {locale === "ar" ? "الأسابيع" : "Weeks"}
                  </th>
                  {monthKeys.map((key, mIdx) => {
                    const isCurrentMonth =
                      selectedYear === currentYear && mIdx === currentMonthIndex;
                    return (
                      <th
                        key={key}
                        className={`p-3 text-center font-bold transition-colors min-w-22.5 ${
                          isCurrentMonth
                            ? "bg-primary/10 text-primary border-x-2 border-primary/40"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t(`months.${key}`)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map((weekIdx) => (
                  <tr key={weekIdx} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground sticky inset-s-0 bg-background/95 backdrop-blur-xs border-e">
                      {t("pivotTable.weekRow", { number: weekIdx + 1 })}
                    </td>
                    {activeYearData.months.map((m, mIdx) => {
                      const isCurrentMonth =
                        selectedYear === currentYear && mIdx === currentMonthIndex;
                      const val = m.weeks[weekIdx];
                      return (
                        <td
                          key={mIdx}
                          className={`p-3 text-center transition-colors font-medium ${
                            isCurrentMonth
                              ? "bg-primary/5 text-primary font-bold border-x-2 border-primary/30"
                              : "text-foreground"
                          }`}
                        >
                          {val.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="border-t-2 border-border">
                  <td className="p-3 font-bold text-foreground sticky inset-s-0 bg-muted/80 backdrop-blur-xs border-e">
                    {t("pivotTable.totalRow")}
                  </td>
                  {monthlyTotals.map((tot, mIdx) => {
                    const isCurrentMonth =
                      selectedYear === currentYear && mIdx === currentMonthIndex;
                    return (
                      <td
                        key={mIdx}
                        className={`p-3 text-center font-bold text-sm transition-colors ${
                          isCurrentMonth
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted/30 text-foreground"
                        }`}
                      >
                        {tot.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </DashboardCard>

      {/* SECTION 4: 3 BOTTOM SUMMARY CARDS (Highest Month, Lowest Month, Average) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Highest Month */}
        <DashboardCard className="p-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">
              {t("summaryCards.highestMonth")}
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold">
              {t(`months.${monthKeys[summaryMetrics.highestIndex]}`)}
            </div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-700">
              {summaryMetrics.highestTotal.toLocaleString()}{" "}
              <span className="text-xs font-normal">{locale === "ar" ? "ج" : "EGP"}</span>
            </div>
          </div>
        </DashboardCard>

        {/* Lowest Month */}
        <DashboardCard className="p-5 border-destructive/30 bg-destructive/10 text-destructive-950 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-destructive/80">
              {t("summaryCards.lowestMonth")}
            </span>
            <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
              <TrendingDown className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold">
              {t(`months.${monthKeys[summaryMetrics.lowestIndex]}`)}
            </div>
            <div className="text-2xl font-extrabold mt-1 text-destructive">
              {summaryMetrics.lowestTotal.toLocaleString()}{" "}
              <span className="text-xs font-normal">{locale === "ar" ? "ج" : "EGP"}</span>
            </div>
          </div>
        </DashboardCard>

        {/* Monthly Average */}
        <DashboardCard className="p-5 border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("summaryCards.monthlyAverage")}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {Math.round(summaryMetrics.average).toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {locale === "ar" ? "متوسط المبيعات الشهرية" : "Average monthly revenue"}
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
