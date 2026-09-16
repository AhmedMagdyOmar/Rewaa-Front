"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LessonPublishStatus } from "@/types/course";

interface CourseFormHeaderProps {
  currentStep: 1 | 2;
  title: string;
  initialCourseId?: string;
  coursePublishStatus: LessonPublishStatus;
  onPublishStatusChange: (status: LessonPublishStatus) => void;
  courseScheduledPublishDate: string;
  onScheduledPublishDateChange: (date: string) => void;
}

export function CourseFormHeader({
  currentStep,
  title,
  initialCourseId,
  coursePublishStatus,
  onPublishStatusChange,
  courseScheduledPublishDate,
  onScheduledPublishDateChange,
}: CourseFormHeaderProps) {
  const t = useTranslations("courses.new");
  const locale = useLocale();

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/courses`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {currentStep === 2 && title.trim()
              ? title
              : initialCourseId
                ? t("editTitle")
                : t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentStep === 2
              ? t("step2.subtitle")
              : initialCourseId
                ? t("editSubtitle")
                : t("subtitle")}
          </p>
        </div>
      </div>

      {/* Step 2 Header: Course Publish Status Select & Schedule Dates */}
      {currentStep === 2 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select
            value={coursePublishStatus}
            onValueChange={(val: LessonPublishStatus) => onPublishStatusChange(val)}
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

          {/* Scheduled Date Input with Label */}
          {coursePublishStatus === "scheduled" && (
            <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="course-scheduled-publish-date"
                  className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {locale === "ar" ? "تاريخ النشر:" : "Publish Date:"}
                </label>
                <Input
                  id="course-scheduled-publish-date"
                  type="date"
                  value={courseScheduledPublishDate}
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
