"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import type { BackendMyCourse } from "@/types/api-contracts";
import type { Course } from "@/types/course";
import { Calendar, Play, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";

export interface StudentEnrolledCourseCardProps {
  course: BackendMyCourse | Course;
  teacherImage?: string;
  accessEndDate?: string;
  progressPercentage?: number;
}

export function StudentEnrolledCourseCard({
  course,
  teacherImage,
  accessEndDate,
  progressPercentage: customProgress,
}: StudentEnrolledCourseCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.enrolledCourses");
  const [imageError, setImageError] = React.useState(false);

  // Title handling (supports bilingual Record<string, string> or simple string)
  let title = "";
  if (typeof course.title === "object" && course.title !== null) {
    const titleObj = course.title as Record<string, string>;
    title = titleObj[locale] || titleObj.ar || titleObj.en || Object.values(titleObj)[0] || "";
  } else if (typeof course.title === "string") {
    title = course.title;
  }

  // Course ID for link
  const backendCourse =
    "course_id" in course || "enrollment_id" in course || "progress_percentage" in course
      ? (course as BackendMyCourse)
      : null;
  const legacyCourse = !backendCourse ? (course as Course) : null;

  const courseId = backendCourse?.course_id ?? backendCourse?.id ?? legacyCourse?.id;

  const rawCoverImage =
    backendCourse?.cover_image ?? backendCourse?.cover_image_url ?? legacyCourse?.coverImage ?? "";

  // Instructor Info
  const instructorName = backendCourse?.instructor?.full_name || legacyCourse?.teacherName || "";
  const instructorAvatar =
    backendCourse?.instructor?.avatar_url ||
    backendCourse?.instructor?.avatar ||
    teacherImage ||
    legacyCourse?.teacherImage ||
    "";

  // Progress
  const progressPercentage = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        customProgress ??
          backendCourse?.progress?.percentage ??
          backendCourse?.progress_percentage ??
          legacyCourse?.progressPercentage ??
          0,
      ),
    ),
  );

  // Access End Date
  const rawEndDate =
    backendCourse?.expires_at ??
    backendCourse?.access_ends_at ??
    accessEndDate ??
    legacyCourse?.offerEndDate;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(rawEndDate);

  const showImage = Boolean(rawCoverImage) && !imageError;

  return (
    <div className="group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 p-4 sm:p-5 rounded-2xl bg-card border border-border/70 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200">
      {/* Left Side (Cover Image + Column of Title / Teacher / Access Date + Progress Bar) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
        {/* Cover Image */}
        <div className="relative aspect-video sm:aspect-4/3 w-full sm:w-36 md:w-44 h-auto sm:h-28 rounded-xl overflow-hidden bg-muted shrink-0 shadow-xs">
          {showImage ? (
            <Image
              src={rawCoverImage}
              alt={title || "Course Cover"}
              fill
              unoptimized
              onError={() => setImageError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 180px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
              {title ? title.slice(0, 2) : "CR"}
            </div>
          )}
        </div>

        {/* Column of Course Title + Teacher Info & Access Date + Progress Bar */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          <Link
            href={`/student-dashboard/courses/${courseId}`}
            className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
          >
            {title}
          </Link>

          {/* Teacher Image & Name + Access End Date */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
            {/* Teacher info */}
            {instructorName && (
              <div className="flex items-center gap-2">
                <div className="relative size-6 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                  {instructorAvatar ? (
                    <Image
                      src={instructorAvatar}
                      alt={instructorName}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="24px"
                    />
                  ) : (
                    <User className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className="font-medium text-foreground truncate max-w-35 sm:max-w-50">
                  {instructorName}
                </span>
              </div>
            )}

            {/* Access End Date (if exists) */}
            {formattedDate && (
              <>
                {instructorName && <span className="text-border hidden sm:inline">•</span>}
                <div className="flex items-center gap-1.5 text-muted-foreground/90">
                  <Calendar className="size-3.5 text-primary/70 shrink-0" />
                  <span>{t("accessEnds", { date: formattedDate })}</span>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar under teacher and date */}
          <div className="space-y-1.5 pt-1 max-w-md w-full">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{t("progress")}</span>
              <span className="text-primary font-mono">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-primary/15" />
          </div>
        </div>
      </div>

      {/* Continue Button at the bottom end */}
      <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50 self-end md:self-center">
        <Button asChild size="default" className="font-semibold gap-2 shadow-xs shrink-0 px-5">
          <Link href={`/student-dashboard/courses/${courseId}`}>
            <span>{t("continue")}</span>
            <Play className="size-3.5 fill-current rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
