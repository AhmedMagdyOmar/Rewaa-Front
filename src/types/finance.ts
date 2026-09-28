export interface FinancialMonthData {
  monthIndex: number; // 0 to 11
  weeks: [number, number, number, number]; // 4 weeks payments
}

export interface FinancialYearData {
  year: number;
  months: FinancialMonthData[];
}
