/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo } from "react";
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

import {
  getStoredFinancialSummary,
  resetStoredFinancialSummary,
  FinancialSummaryState,
} from "@/lib/financial-summary-storage";
import { FinancialSummaryPDF } from "@/components/pdf/FinancialSummaryPDF";

export function BillingSummaryClient() {
  const locale = useLocale();
  const t = useTranslations("financialSummary");

  const [state, setState] = useState<FinancialSummaryState | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    setState(getStoredFinancialSummary());
  }, []);

  const handleReset = () => {
    const fresh = resetStoredFinancialSummary();
    setState(fresh);
  };

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

  // Current year data for pivot table
  const activeYearData = useMemo(() => {
    if (!state) return null;
    return state.yearsData[selectedYear] || state.yearsData[2026];
  }, [state, selectedYear]);

  // Compute monthly totals for active year
  const monthlyTotals = useMemo(() => {
    if (!activeYearData) return Array(12).fill(0);
    return activeYearData.months.map((m) => m.weeks.reduce((acc, curr) => acc + curr, 0));
  }, [activeYearData]);

  // Find highest month, lowest month, average
  const summaryMetrics = useMemo(() => {
    if (!activeYearData || monthlyTotals.length === 0) {
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

    return {
      highestIndex: hIdx,
      highestTotal: monthlyTotals[hIdx],
      lowestIndex: lIdx,
      lowestTotal: monthlyTotals[lIdx],
      average: sum / 12,
    };
  }, [activeYearData, monthlyTotals]);

  // CSV Export function
  const handleExportCsv = () => {
    if (!activeYearData) return;

    const monthHeaders = monthKeys.map((k) => t(`months.${k}`));
    const weekLabel = locale === "ar" ? "الأسبوع" : "Week";
    const totalLabel = locale === "ar" ? "الإجمالي" : "Total";

    // Row 1: Headers
    const rows: string[][] = [];
    rows.push([weekLabel, ...monthHeaders]);

    // Rows 2-5: 4 Weeks
    [0, 1, 2, 3].forEach((wIdx) => {
      const weekName = `${weekLabel} ${wIdx + 1}`;
      const weekValues = activeYearData.months.map((m) => m.weeks[wIdx].toString());
      rows.push([weekName, ...weekValues]);
    });

    // Row 6: Monthly Totals
    rows.push([totalLabel, ...monthlyTotals.map((tot) => tot.toString())]);

    // Convert to CSV string with UTF-8 BOM for proper Excel rendering in Arabic
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
    if (!activeYearData) return;
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

  if (!state || !activeYearData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {locale === "ar" ? "جاري التحميل..." : "Loading..."}
      </div>
    );
  }

  // Delta helpers for 3 top cards
  const todayDelta = Math.round(
    ((state.todayPayments.amount - state.todayPayments.prevAmount) /
      state.todayPayments.prevAmount) *
      100,
  );
  const weekDelta = Math.round(
    ((state.thisWeekPayments.amount - state.thisWeekPayments.prevAmount) /
      state.thisWeekPayments.prevAmount) *
      100,
  );
  const monthDelta = Math.round(
    ((state.thisMonthPayments.amount - state.thisMonthPayments.prevAmount) /
      state.thisMonthPayments.prevAmount) *
      100,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: PAGE HEADER & SELECT YEAR & ACTIONS
      ────────────────────────────────────────────────────────────────────────────── */}
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

          {/* Reset Mock Data */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 text-xs font-semibold"
          >
            <RotateCcw className="size-3.5 me-1.5" />
            {t("resetData")}
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: 3 STAT CARDS (Today, This Week, This Month)
      ────────────────────────────────────────────────────────────────────────────── */}
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
              {state.todayPayments.amount.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="size-3.5" />
              <span>+{todayDelta}%</span>
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
              {state.thisWeekPayments.amount.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="size-3.5" />
              <span>+{weekDelta}%</span>
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
              {state.thisMonthPayments.amount.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="size-3.5" />
              <span>+{monthDelta}%</span>
              <span className="text-muted-foreground font-normal">
                {t("stats.vsPrevMonth", { delta: `+${monthDelta}%` })}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: PIVOT TABLE REPORT CARD
      ────────────────────────────────────────────────────────────────────────────── */}
      <DashboardCard className="p-5 border-border/80 shadow-xs">
        {/* Table Header Controls */}
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
            {/* Print PDF Button */}
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

            {/* Export Dropdown Menu */}
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
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/80">
                <th className="p-3 text-start font-bold text-foreground min-w-25 sticky inset-s-0 bg-muted/90 backdrop-blur-xs">
                  {locale === "ar" ? "الأسابيع" : "Weeks"}
                </th>
                {monthKeys.map((key, mIdx) => {
                  const isCurrentMonth = selectedYear === currentYear && mIdx === currentMonthIndex;
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
                  const isCurrentMonth = selectedYear === currentYear && mIdx === currentMonthIndex;
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
        </div>
      </DashboardCard>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 4: 3 BOTTOM SUMMARY CARDS (Highest Month, Lowest Month, Average)
      ────────────────────────────────────────────────────────────────────────────── */}
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
