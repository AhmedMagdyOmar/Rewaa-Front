"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

export function CoursesEmptyState() {
  const t = useTranslations("courses");

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
      <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <h3 className="text-lg font-semibold text-foreground">{t("empty.title")}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
    </div>
  );
}
