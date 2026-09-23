"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";
import { StatTile } from "./stat-tile";
import { DashboardCardHeader } from "./dashboard-card-header";

export interface StudentsStatsData {
  total: number;
  activeToday?: number;
  active_today?: number;
  newToday?: number;
  new_today?: number;
}

interface TotalStudentsCardProps {
  students?: StudentsStatsData;
  isLoading?: boolean;
}

export function TotalStudentsCard({ students, isLoading = false }: TotalStudentsCardProps) {
  const t = useTranslations("dashboard");

  const total = students?.total ?? 0;
  const activeToday = students?.active_today ?? students?.activeToday ?? 0;
  const newToday = students?.new_today ?? students?.newToday ?? 0;

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
        {isLoading ? <Skeleton className="h-9 w-32" /> : total.toLocaleString()}
      </div>

      <Separator className="my-2" />

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          variant="compact"
          label={t("activeToday")}
          value={isLoading ? <Skeleton className="h-6 w-16" /> : activeToday.toLocaleString()}
          valueClassName="text-emerald-600"
        />

        <StatTile
          variant="compact"
          label={t("newAccountsToday")}
          value={isLoading ? <Skeleton className="h-6 w-16" /> : newToday.toLocaleString()}
          valueClassName="text-primary"
        />
      </div>
    </DashboardCard>
  );
}
