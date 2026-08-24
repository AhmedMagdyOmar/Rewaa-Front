"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import { dashboardMockData } from "@/lib/mockData";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";
import { StatTile } from "./stat-tile";

interface ExamActivityCardProps {
  examActivityToday: typeof dashboardMockData.examActivityToday;
}

export function ExamActivityCard({ examActivityToday }: ExamActivityCardProps) {
  const t = useTranslations("dashboard");

  const localizedChartData = examActivityToday.chartData.map((item) => {
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
            <span className="text-xs text-muted-foreground font-medium">{t("successRate")}</span>
            <span className="text-2xl font-bold text-foreground">
              {examActivityToday.successRate}%
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-3 mt-4">
          <StatTile
            variant="horizontal"
            label={t("studentsExamsToday")}
            value={examActivityToday.studentsCount.toLocaleString()}
          />

          <StatTile
            variant="horizontal"
            label={t("averageGrade")}
            value={examActivityToday.averageGrade}
            valueClassName="text-emerald-600"
          />
        </div>
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
