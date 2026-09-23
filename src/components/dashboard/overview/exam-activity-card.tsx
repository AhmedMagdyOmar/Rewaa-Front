"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CheckCircle2, ArrowUpRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";
import { StatTile } from "./stat-tile";
import type { DashboardExamActivityToday } from "@/lib/api/dashboard-service";

export interface ExamActivityData {
  data_available?: boolean;
  attempts_count?: number;
  students_count?: number;
  studentsCount?: number;
  passed_count?: number;
  success_rate?: number;
  successRate?: number;
  average_grade_percentage?: number;
  averageGrade?: string | number;
  chartData?: Array<{ label: string; value: number }>;
}

interface ExamActivityCardProps {
  examActivityToday?: ExamActivityData | DashboardExamActivityToday;
  isLoading?: boolean;
}

export function ExamActivityCard({ examActivityToday, isLoading = false }: ExamActivityCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const dataAvailable = examActivityToday
    ? "data_available" in examActivityToday
      ? examActivityToday.data_available
      : Boolean(examActivityToday.chartData)
    : false;

  const successRate = examActivityToday
    ? "success_rate" in examActivityToday && examActivityToday.success_rate !== undefined
      ? examActivityToday.success_rate
      : "successRate" in examActivityToday && examActivityToday.successRate !== undefined
        ? examActivityToday.successRate
        : 0
    : 0;

  const studentsCount = examActivityToday
    ? "students_count" in examActivityToday && examActivityToday.students_count !== undefined
      ? examActivityToday.students_count
      : "studentsCount" in examActivityToday && examActivityToday.studentsCount !== undefined
        ? examActivityToday.studentsCount
        : "attempts_count" in examActivityToday && examActivityToday.attempts_count !== undefined
          ? examActivityToday.attempts_count
          : 0
    : 0;

  let averageGradeText = "0%";
  if (examActivityToday) {
    if (
      "average_grade_percentage" in examActivityToday &&
      examActivityToday.average_grade_percentage !== undefined
    ) {
      averageGradeText = `${examActivityToday.average_grade_percentage}%`;
    } else if (
      "averageGrade" in examActivityToday &&
      examActivityToday.averageGrade !== undefined
    ) {
      averageGradeText = String(examActivityToday.averageGrade);
    }
  }

  const chartData =
    examActivityToday && "chartData" in examActivityToday && examActivityToday.chartData
      ? examActivityToday.chartData
      : [
          { label: t("examPassed"), value: successRate },
          { label: t("examFailed"), value: Math.max(0, 100 - successRate) },
        ];

  const localizedChartData = chartData.map((item) => {
    const key =
      item.label.toLowerCase() === "passed"
        ? "examPassed"
        : item.label.toLowerCase() === "failed"
          ? "examFailed"
          : null;
    return {
      ...item,
      label: key ? t(key) : item.label,
    };
  });

  return (
    <DashboardCard className="lg:col-span-3">
      <div>
        <DashboardCardHeader
          icon={<CheckCircle2 className="size-5 text-emerald-500" />}
          title={t("examActivityToday")}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center my-6 gap-4">
            <Skeleton className="size-36 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ) : !dataAvailable && studentsCount === 0 ? (
          <div className="flex flex-col items-center justify-center text-center my-6 py-6 border border-dashed rounded-xl bg-muted/20 gap-2">
            <Award className="size-8 text-muted-foreground/50" />
            <p className="text-xs font-medium text-muted-foreground">
              {locale === "ar"
                ? "لا يوجد نشاط امتحانات مسجل اليوم حتى الآن"
                : "No exam activity recorded today yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="flex flex-col items-center justify-center relative my-2">
              <DonutChart
                data={localizedChartData}
                category="label"
                value="value"
                colors={["chart-1", "chart-2"]}
                showLabel={false}
                className="size-40"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("successRate")}
                </span>
                <span className="text-2xl font-bold text-foreground">{successRate}%</span>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-3 mt-4">
              <StatTile
                variant="horizontal"
                label={t("studentsExamsToday")}
                value={studentsCount.toLocaleString()}
              />

              <StatTile
                variant="horizontal"
                label={t("averageGrade")}
                value={averageGradeText}
                valueClassName="text-emerald-600"
              />
            </div>
          </>
        )}
      </div>

      <Button asChild className="w-full mt-6 font-bold">
        <Link href="/dashboard/exams" className="w-full flex items-center justify-center gap-2">
          {t("activityDetails")}
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </DashboardCard>
  );
}
