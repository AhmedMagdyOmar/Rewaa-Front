import { FileSpreadsheet, Printer, Download, FileText, Loader2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FinancialYearData } from "@/types/finance";

interface BillingPivotTableProps {
  selectedYear: number;
  currentYear: number;
  currentMonthIndex: number;
  isLoading: boolean;
  activeYearData: FinancialYearData;
  monthlyTotals: number[];
  monthKeys: readonly string[];
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  onPrintPdf: () => void;
  onExportCsv: () => void;
  isGeneratingPdf: boolean;
}

export function BillingPivotTable({
  selectedYear,
  currentYear,
  currentMonthIndex,
  isLoading,
  activeYearData,
  monthlyTotals,
  monthKeys,
  locale,
  t,
  onPrintPdf,
  onExportCsv,
  isGeneratingPdf,
}: BillingPivotTableProps) {
  return (
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
            onClick={onPrintPdf}
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
              <DropdownMenuItem onClick={onExportCsv}>
                <FileSpreadsheet className="size-4 me-2 text-muted-foreground" />
                {t("pivotTable.exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPrintPdf}>
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
        )}
      </div>
    </DashboardCard>
  );
}
