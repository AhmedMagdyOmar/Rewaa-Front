"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import type { BackendMyCourse } from "@/types/api-contracts";
import type { Course } from "@/types/course";
import { BookOpen, Calendar, Play, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";

export interface StudentEnrolledCourseCardProps {
  course: BackendMyCourse | Course;
  teacherImage?: string;
  accessEndDate?: string;
  progressPercentage?: number;
  layout?: "grid" | "row";
}

export function StudentEnrolledCourseCard({
  course,
  teacherImage,
  accessEndDate,
  progressPercentage: customProgress,
  layout = "grid",
}: StudentEnrolledCourseCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.enrolledCourses");
  const tCourses = useTranslations("courses");
  const [imageError, setImageError] = React.useState(false);

  // Helper to resolve multilingual strings
  const resolveText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  // Course normalization
  const backendCourse =
    "course_id" in course || "enrollment_id" in course || "progress_percentage" in course
      ? (course as BackendMyCourse)
      : null;
  const legacyCourse = !backendCourse ? (course as Course) : null;

  const title = resolveText(course.title);
  const courseId = backendCourse?.course_id ?? backendCourse?.id ?? legacyCourse?.id;

  const rawCoverImage =
    backendCourse?.cover_image ?? backendCourse?.cover_image_url ?? legacyCourse?.coverImage ?? "";

  const stageName = resolveText(backendCourse?.educational_stage?.name);
  const subjectName = resolveText(backendCourse?.subject?.name);

  // Instructor Info
  const instructorName = backendCourse?.instructor?.full_name || legacyCourse?.teacherName || "";
  const instructorId = backendCourse?.instructor?.id;
  const instructorAvatar =
    backendCourse?.instructor?.avatar_url ||
    backendCourse?.instructor?.avatar ||
    teacherImage ||
    legacyCourse?.teacherImage ||
    "";

  // Progress percentage
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
  const courseTargetUrl = `/student-dashboard/courses/${courseId}`;
  const lessonsCount = backendCourse?.lessons_count ?? backendCourse?.progress?.total_lessons;

  // Render Horizontal Row Card (for list views / backwards compatibility)
  if (layout === "row") {
    return (
      <div className="group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 p-4 sm:p-5 rounded-2xl bg-card border border-border/70 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
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

          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            <Link
              href={courseTargetUrl}
              className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
            >
              {title}
            </Link>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
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

            <div className="space-y-1.5 pt-1 max-w-md w-full">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">{t("progress")}</span>
                <span className="text-primary font-mono">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-primary/15" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50 self-end md:self-center">
          <Button asChild size="default" className="font-semibold gap-2 shadow-xs shrink-0 px-5">
            <Link href={courseTargetUrl}>
              <span>{t("continue")}</span>
              <Play className="size-3.5 fill-current rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Render Grid Card (exact same architecture and visual design as StudentAvailableCourseCard + progress)
  return (
    <div className="group flex flex-col bg-card rounded-xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      {/* Cover Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
        {showImage ? (
          <Image
            src={rawCoverImage}
            alt={title || "Course cover"}
            fill
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <BookOpen className="size-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />

        {/* Progress Badge on top-start */}
        <div className="absolute top-2.5 inset-s-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-xs backdrop-blur-xs bg-primary/95 text-primary-foreground">
            {progressPercentage}%
          </span>
        </div>

        {/* Access End Date Strip at bottom of image if available */}
        {formattedDate && (
          <div className="absolute bottom-0 inset-x-0 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-xs text-white">
            <Calendar className="h-3 w-3 shrink-0 opacity-80" />
            <span className="text-[10px] font-medium truncate">
              {t("accessEnds", { date: formattedDate })}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Course Title */}
        <div className="flex items-start gap-1.5 mb-2 group-hover:text-primary transition-colors">
          <Link href={courseTargetUrl} className="block w-full">
            <h3 className="font-bold text-foreground line-clamp-2 text-base leading-snug">
              {title}
            </h3>
          </Link>
        </div>

        {/* Subject & Educational Stage */}
        {(subjectName || stageName) && (
          <div className="text-xs font-semibold text-primary/80 mb-1">
            {[subjectName, stageName].filter(Boolean).join(" / ")}
          </div>
        )}

        {/* Teacher Info */}
        {instructorName && (
          <div className="mb-3">
            {instructorId ? (
              <Link
                href={`/student-dashboard/teachers/${instructorId}`}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground truncate hover:text-primary transition-colors group/teacher w-fit max-w-full"
              >
                <div className="relative size-5 rounded-full overflow-hidden bg-primary/10 border border-border/60 shrink-0 flex items-center justify-center">
                  {instructorAvatar ? (
                    <Image
                      src={instructorAvatar}
                      alt={instructorName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <User className="size-3 text-primary/70" />
                  )}
                </div>
                <span className="font-medium truncate text-foreground/80 group-hover/teacher:text-primary group-hover/teacher:underline">
                  {instructorName}
                </span>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground truncate w-fit max-w-full">
                <div className="relative size-5 rounded-full overflow-hidden bg-primary/10 border border-border/60 shrink-0 flex items-center justify-center">
                  {instructorAvatar ? (
                    <Image
                      src={instructorAvatar}
                      alt={instructorName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <User className="size-3 text-primary/70" />
                  )}
                </div>
                <span className="font-medium truncate text-foreground/80">{instructorName}</span>
              </div>
            )}
          </div>
        )}

        {/* Info Row: Lessons count (if available) */}
        {lessonsCount !== undefined && lessonsCount > 0 && (
          <div className="mt-auto pt-2 pb-2 border-t border-border/40 flex flex-row items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium">
                {tCourses("card.lessonsShort", { count: lessonsCount })}
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground text-[11px]">{t("progress")}</span>
            <span className="text-primary font-mono text-xs">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-primary/15" />
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-1">
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full font-bold text-sm py-3.5! cursor-pointer shadow-xs gap-1.5"
          >
            <Link href={courseTargetUrl}>
              <span>{t("continue")}</span>
              <Play className="size-3.5 fill-current rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
