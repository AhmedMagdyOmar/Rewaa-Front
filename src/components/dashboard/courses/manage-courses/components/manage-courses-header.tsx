"use client";

import * as React from "react";
import { Barcode, Plus, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ManageCoursesHeaderProps {
  onRefresh: () => void;
  isFetching: boolean;
}

const emptySubscribe = () => () => {};

export function ManageCoursesHeader({ onRefresh, isFetching }: ManageCoursesHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("courses");
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isSpinning = isMounted && isFetching;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("manageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("manageSubtitle")}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Refresh button */}
        <Button
          variant="outline"
          size="default"
          onClick={onRefresh}
          disabled={isSpinning}
          className="gap-2 shadow-xs font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
          <span>{locale === "ar" ? "تحديث" : "Refresh"}</span>
        </Button>
        <Button asChild variant="outline" size="default" className="gap-2 shadow-xs font-semibold">
          <Link href={`/${locale}/dashboard/courses/codes`}>
            <Barcode className="h-4 w-4" />
            <span>{t("activationCodes")}</span>
          </Link>
        </Button>
        <Button asChild size="default" className="gap-2 shadow-sm font-semibold">
          <Link href={`/${locale}/dashboard/courses/new`}>
            <Plus className="h-4 w-4" />
            <span>{t("addNewCourse")}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
