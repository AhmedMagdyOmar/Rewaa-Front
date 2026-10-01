"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamFormHeaderProps {
  currentStep: 1 | 2;
  title: string;
  mode: "create" | "edit";
  examPublishStatus: "draft" | "published" | "scheduled";
  onPublishStatusChange: (status: "draft" | "published" | "scheduled") => void;
  examScheduledPublishDate: string;
  onScheduledPublishDateChange: (date: string) => void;
}

export function ExamFormHeader({
  currentStep,
  title,
  mode,
  examPublishStatus,
  onPublishStatusChange,
  examScheduledPublishDate,
  onScheduledPublishDateChange,
}: ExamFormHeaderProps) {
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

      {/* Step 2 Header: Exam Publish Status Select & Schedule Dates */}
      {currentStep === 2 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select
            value={examPublishStatus}
            onValueChange={(val: "draft" | "published" | "scheduled") => onPublishStatusChange(val)}
          >
            <SelectTrigger className="w-36 h-9 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{locale === "ar" ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="published">{locale === "ar" ? "منشور" : "Published"}</SelectItem>
              <SelectItem value="scheduled">{locale === "ar" ? "مجدول" : "Scheduled"}</SelectItem>
            </SelectContent>
          </Select>

          {examPublishStatus === "scheduled" && (
            <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="exam-scheduled-publish-date"
                  className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {locale === "ar" ? "تاريخ النشر:" : "Publish Date:"}
                </label>
                <Input
                  id="exam-scheduled-publish-date"
                  type="date"
                  value={examScheduledPublishDate}
                  onChange={(e) => onScheduledPublishDateChange(e.target.value)}
                  className="h-9 w-36 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
