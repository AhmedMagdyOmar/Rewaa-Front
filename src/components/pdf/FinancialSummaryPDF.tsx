import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { FinancialYearData } from "@/lib/financial-summary-storage";

// Register IBM Plex Sans Arabic
Font.register({
  family: "IBM Plex Sans Arabic",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Bold.ttf",
      fontWeight: 700,
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf",
      fontWeight: 500,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "IBM Plex Sans Arabic",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1pt solid #e2e8f0",
    paddingBottom: 10,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  brandSubtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  badge: {
    fontSize: 10,
    backgroundColor: "#f0f9ff",
    border: "1pt solid #bae6fd",
    padding: "4 8",
    borderRadius: 4,
    color: "#0284c7",
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
  },

  // Table styles - compact to fit 12 months & rows
  table: {
    width: "100%",
    border: "1pt solid #e2e8f0",
    borderRadius: 6,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #e2e8f0",
    padding: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1pt solid #cbd5e1",
    padding: 4,
  },
  tableTotalRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 5,
  },
  colWeek: {
    width: "10%",
    fontSize: 7,
    fontWeight: 700,
    color: "#0f172a",
  },
  colMonth: {
    width: "7.5%",
    fontSize: 6.5,
    textAlign: "center",
    color: "#334155",
  },
  colMonthHeader: {
    width: "7.5%",
    fontSize: 6.5,
    fontWeight: 700,
    textAlign: "center",
    color: "#0f172a",
  },
  colTotalWeekHeader: {
    width: "10%",
    fontSize: 7,
    fontWeight: 700,
    color: "#ffffff",
  },
  colTotalMonth: {
    width: "7.5%",
    fontSize: 6.5,
    fontWeight: 700,
    textAlign: "center",
    color: "#ffffff",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  summaryCard: {
    width: "31%",
    border: "1pt solid #e2e8f0",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  summaryTitle: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
});

interface Props {
  yearData: FinancialYearData;
  monthNames: string[];
  highestMonthName: string;
  highestMonthTotal: number;
  lowestMonthName: string;
  lowestMonthTotal: number;
  monthlyAverage: number;
}

export function FinancialSummaryPDF({
  yearData,
  monthNames,
  highestMonthName,
  highestMonthTotal,
  lowestMonthName,
  lowestMonthTotal,
  monthlyAverage,
}: Props) {
  const monthTotals = yearData.months.map((m) => m.weeks.reduce((acc, curr) => acc + curr, 0));

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.brandName}>منصة رواء - ملخص المالية</Text>
            <Text style={styles.brandSubtitle}>
              تقرير الأداء والإيرادات المالية للسنة {yearData.year}
            </Text>
          </View>
          <View>
            <Text style={styles.badge}>السنة المالية: {yearData.year}</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>تقرير المدفوعات التفصيلي (4 أسابيع × 12 شهراً)</Text>

        {/* Pivot Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colWeek}>الأسبوع</Text>
            {monthNames.map((mName, idx) => (
              <Text key={idx} style={styles.colMonthHeader}>
                {mName}
              </Text>
            ))}
          </View>

          {/* 4 Week Rows */}
          {[0, 1, 2, 3].map((weekIdx) => (
            <View key={weekIdx} style={styles.tableRow}>
              <Text style={styles.colWeek}>الأسبوع {weekIdx + 1}</Text>
              {yearData.months.map((m, mIdx) => (
                <Text key={mIdx} style={styles.colMonth}>
                  {m.weeks[weekIdx].toLocaleString()} ج
                </Text>
              ))}
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.tableTotalRow}>
            <Text style={styles.colTotalWeekHeader}>الإجمالي</Text>
            {monthTotals.map((tot, mIdx) => (
              <Text key={mIdx} style={styles.colTotalMonth}>
                {tot.toLocaleString()} ج
              </Text>
            ))}
          </View>
        </View>

        {/* Bottom Summary Cards */}
        <View style={styles.summaryGrid}>
          <View
            style={[styles.summaryCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}
          >
            <Text style={[styles.summaryTitle, { color: "#166534" }]}>أعلى شهر في المدفوعات</Text>
            <Text style={[styles.summaryVal, { color: "#15803d" }]}>
              {highestMonthName} ({highestMonthTotal.toLocaleString()} ج)
            </Text>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}
          >
            <Text style={[styles.summaryTitle, { color: "#991b1b" }]}>أقل شهر في المدفوعات</Text>
            <Text style={[styles.summaryVal, { color: "#b91c1c" }]}>
              {lowestMonthName} ({lowestMonthTotal.toLocaleString()} ج)
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>المتوسط الشهري لـ 12 شهراً</Text>
            <Text style={styles.summaryVal}>{Math.round(monthlyAverage).toLocaleString()} ج</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
