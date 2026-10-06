"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

interface ExamFormHeaderProps {
  currentStep: 1 | 2;
  title: string;
  mode: "create" | "edit";
}

export function ExamFormHeader({ currentStep, title, mode }: ExamFormHeaderProps) {
  const locale = useLocale();
  const tForm = useTranslations("exams.form");
  const tStep2 = useTranslations("exams.step2");

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/exams`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {currentStep === 2 && title.trim()
              ? title
              : mode === "create"
                ? tForm("createTitle")
                : tForm("editTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentStep === 1 ? tForm("createSubtitle") : tStep2("subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
