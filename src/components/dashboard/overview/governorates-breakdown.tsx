"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCardHeader } from "./dashboard-card-header";
import { GovernorateCard } from "./governorate-card";
import type { DashboardGovernorateDistribution } from "@/lib/api/dashboard-service";

export interface GovernorateBreakdownItem {
  id?: number | null;
  key?: string;
  name?: Record<string, string> | string;
  percentage: number;
  count?: number;
  students_count?: number;
  isOthers?: boolean;
}

interface GovernoratesBreakdownProps {
  governorates?: GovernorateBreakdownItem[] | DashboardGovernorateDistribution;
  isLoading?: boolean;
}

export function GovernoratesBreakdown({
  governorates,
  isLoading = false,
}: GovernoratesBreakdownProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  // Normalize data whether it is the raw DashboardGovernorateDistribution or an array of items
  let cards: GovernorateBreakdownItem[] = [];

  if (governorates && "top_governorates" in governorates) {
    const top: GovernorateBreakdownItem[] = governorates.top_governorates.map((gov) => ({
      id: gov.id,
      name: gov.name,
      percentage: gov.percentage,
      count: gov.students_count,
      isOthers: false,
    }));

    if (governorates.remaining && governorates.remaining.students_count > 0) {
      top.push({
        id: -1,
        key: "others",
        name: { ar: "باقي المحافظات", en: "Other Governorates" },
        percentage: governorates.remaining.percentage,
        count: governorates.remaining.students_count,
        isOthers: true,
      });
    }
    cards = top;
  } else if (Array.isArray(governorates)) {
    cards = governorates;
  }

  const resolveGovName = (gov: GovernorateBreakdownItem) => {
    if (typeof gov.name === "object" && gov.name !== null) {
      return gov.name[locale] || gov.name.ar || gov.name.en || "";
    }
    if (typeof gov.name === "string" && gov.name) {
      return gov.name;
    }
    if (gov.key) {
      try {
        return t(`governoratesList.${gov.key}`);
      } catch {
        return gov.key;
      }
    }
    return locale === "ar" ? "محافظة" : "Governorate";
  };

  return (
    <div className="flex flex-col gap-4">
      <DashboardCardHeader
        className="mb-0"
        icon={<Building2 className="size-5 text-primary" />}
        title={t("governoratesTitle")}
        action={{
          label: t("displayAllGovernorates"),
          href: "/dashboard/governorates",
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-xs text-muted-foreground">
          {locale === "ar"
            ? "لا يوجد توزيع جغرافي مسجل للطلاب حالياً"
            : "No governorate distribution available for registered students"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((gov, idx) => {
            const isOthers = gov.isOthers || gov.key === "others";
            const displayName = resolveGovName(gov);
            const count = gov.count ?? gov.students_count ?? 0;

            return (
              <GovernorateCard
                key={gov.id ?? gov.key ?? idx}
                displayName={displayName}
                percentage={gov.percentage}
                count={count}
                isOthers={isOthers}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
