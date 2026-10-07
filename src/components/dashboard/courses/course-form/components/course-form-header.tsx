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
import { LocalizedDateInput } from "@/components/ui/localized-date-input";
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

const STATUS_TRIGGER_STYLES: Record<LessonPublishStatus, string> = {
  draft: "bg-warning-bg! text-warning! border-warning/30! [&_svg]:text-warning!",
  published: "bg-success-bg! text-success! border-success/30! [&_svg]:text-success!",
  scheduled: "bg-purple-500/20! text-purple-700! border-purple-400/30! [&_svg]:text-purple-700!",
};

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
      <div className="flex items-start sm:items-start gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0 mt-1 sm:mt-0"
        >
          <Link href={`/${locale}/dashboard/courses`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>

        <div>
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {currentStep === 2 && title.trim()
                ? title
                : initialCourseId
                  ? t("editTitle")
                  : t("title")}
            </h1>

            {/* Step 2 Header: Course Publish Status Select & Schedule Dates */}
            {currentStep === 2 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Select
                  value={coursePublishStatus}
                  onValueChange={(val: LessonPublishStatus) => onPublishStatusChange(val)}
                >
                  <SelectTrigger
                    className={`h-9 max-w-30 px-3.5 text-base font-bold shadow-xs transition-colors ${STATUS_TRIGGER_STYLES[coursePublishStatus]}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft" className="text-base font-medium">
                      {locale === "ar" ? "مسودة" : "Draft"}
                    </SelectItem>
                    <SelectItem value="published" className="text-base font-medium">
                      {locale === "ar" ? "منشور" : "Published"}
                    </SelectItem>
                    <SelectItem value="scheduled" className="text-base font-medium">
                      {locale === "ar" ? "مجدول" : "Scheduled"}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Scheduled Date Input with Label */}
                {coursePublishStatus === "scheduled" && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <label
                      htmlFor="course-scheduled-publish-date"
                      className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {locale === "ar" ? "تاريخ النشر:" : "Publish Date:"}
                    </label>
                    <LocalizedDateInput
                      id="course-scheduled-publish-date"
                      value={courseScheduledPublishDate}
                      onChange={onScheduledPublishDateChange}
                      className="w-44 text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {currentStep === 2
              ? t("step2.subtitle")
              : initialCourseId
                ? t("editSubtitle")
                : t("subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
