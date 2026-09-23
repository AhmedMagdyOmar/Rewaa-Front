"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { ProgressBar } from "@/components/ui/charts/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";
import type { DashboardStageItem } from "@/lib/api/dashboard-service";

export type StageDistributionItem =
  | DashboardStageItem
  | {
      id?: number | null;
      key?: string;
      name?: Record<string, string> | string;
      students_count?: number;
      students?: number;
      percentage: number;
    };

interface ClassesDistributionCardProps {
  classesDistribution?: StageDistributionItem[];
  totalStudents?: number;
  isLoading?: boolean;
}

export function ClassesDistributionCard({
  classesDistribution,
  totalStudents = 0,
  isLoading = false,
}: ClassesDistributionCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const items = classesDistribution ?? [];

  const resolveStageName = (item: StageDistributionItem) => {
    if (typeof item.name === "object" && item.name !== null) {
      return item.name[locale] || item.name.ar || item.name.en || "";
    }
    if (typeof item.name === "string" && item.name) {
      return item.name;
    }
    if ("key" in item && item.key) {
      try {
        return t(`classesList.${item.key}`);
      } catch {
        return item.key;
      }
    }
    return locale === "ar" ? "مرحلة دراسية" : "Stage";
  };

  return (
    <DashboardCard className="lg:col-span-3">
      <div>
        <DashboardCardHeader
          icon={<Users className="size-5 text-primary" />}
          title={t("classesDistribution")}
        />

        <div className="flex flex-col gap-5">
          {isLoading ? (
            <div className="flex flex-col gap-4 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {locale === "ar"
                ? "لا يوجد توزيع مراحل دراسية مسجل حالياً"
                : "No educational stage distribution available"}
            </div>
          ) : (
            items.map((cls, idx) => {
              const count =
                "students_count" in cls && cls.students_count !== undefined
                  ? cls.students_count
                  : "students" in cls && cls.students !== undefined
                    ? cls.students
                    : 0;
              const name = resolveStageName(cls);
              const percentage = cls.percentage ?? 0;

              const itemKey = cls.id ?? ("key" in cls ? cls.key : undefined) ?? idx;
              return (
                <div key={itemKey} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground truncate max-w-36">{name}</span>
                    <span className="text-muted-foreground">
                      {count.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <ProgressBar value={percentage} variant="default" showAnimation />
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
        {t("totalStudents")}: {isLoading ? "..." : totalStudents.toLocaleString()}
      </div>
    </DashboardCard>
  );
}
