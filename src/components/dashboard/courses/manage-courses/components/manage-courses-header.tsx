"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";

export function ManageCoursesHeader() {
  const locale = useLocale();
  const t = useTranslations("courses");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("manageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("manageSubtitle")}</p>
      </div>
      <div className="flex items-center gap-3">
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
