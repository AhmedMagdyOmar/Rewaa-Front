"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { ProgressBar } from "@/components/ui/charts/progress-bar";
import { dashboardMockData } from "@/lib/mockData";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";

interface ClassesDistributionCardProps {
  classesDistribution: typeof dashboardMockData.classesDistribution;
  totalStudents: number;
}

export function ClassesDistributionCard({
  classesDistribution,
  totalStudents,
}: ClassesDistributionCardProps) {
  const t = useTranslations("dashboard");

  return (
    <DashboardCard className="lg:col-span-3">
      <div>
        <DashboardCardHeader
          icon={<Users className="size-5 text-primary" />}
          title={t("classesDistribution")}
        />

        <div className="flex flex-col gap-5">
          {classesDistribution.map((cls) => (
            <div key={cls.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">{t(`classesList.${cls.key}`)}</span>
                <span className="text-muted-foreground">
                  {cls.students.toLocaleString()} ({cls.percentage}%)
                </span>
              </div>
              <ProgressBar value={cls.percentage} variant="default" showAnimation />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
        {t("totalStudents")}: {totalStudents.toLocaleString()}
      </div>
    </DashboardCard>
  );
}
