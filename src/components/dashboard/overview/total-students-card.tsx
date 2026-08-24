"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { dashboardMockData } from "@/lib/mockData";
import { DashboardCard } from "./dashboard-card";
import { StatTile } from "./stat-tile";
import { DashboardCardHeader } from ".";

interface TotalStudentsCardProps {
  students: typeof dashboardMockData.students;
}

export function TotalStudentsCard({ students }: TotalStudentsCardProps) {
  const t = useTranslations("dashboard");

  return (
    <DashboardCard className="lg:col-span-5 h-64">
      <DashboardCardHeader
        icon={<GraduationCap className="size-5 text-primary" />}
        title={t("totalStudents")}
        action={{
          label: t("manageStudents"),
          href: "/dashboard/students",
        }}
      />
      <div className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground -mt-4">
        {students.total.toLocaleString()}
      </div>

      <Separator className="my-2" />

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          variant="compact"
          label={t("activeToday")}
          value={students.activeToday.toLocaleString()}
          valueClassName="text-emerald-600"
        />

        <StatTile
          variant="compact"
          label={t("newAccountsToday")}
          value={students.newToday.toLocaleString()}
          valueClassName="text-primary"
        />
      </div>
    </DashboardCard>
  );
}
