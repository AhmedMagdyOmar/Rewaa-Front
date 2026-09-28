import { pdf } from "@react-pdf/renderer";
import { FinancialSummaryPDF } from "@/components/pdf/FinancialSummaryPDF";
import type { FinancialYearData } from "@/types/finance";

export interface SummaryMetrics {
  highestIndex: number;
  highestTotal: number;
  lowestIndex: number;
  lowestTotal: number;
  average: number;
}

export function exportFinancialCsv({
  selectedYear,
  monthKeys,
  activeYearData,
  monthlyTotals,
  locale,
  t,
}: {
  selectedYear: number;
  monthKeys: readonly string[];
  activeYearData: FinancialYearData;
  monthlyTotals: number[];
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
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
}

export async function exportFinancialPdf({
  selectedYear,
  monthKeys,
  activeYearData,
  summaryMetrics,
  t,
}: {
  selectedYear: number;
  monthKeys: readonly string[];
  activeYearData: FinancialYearData;
  summaryMetrics: SummaryMetrics;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
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
}
