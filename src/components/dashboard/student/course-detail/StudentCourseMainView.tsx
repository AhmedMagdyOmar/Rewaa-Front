"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { BackendCourseContent, BackendStudentCourseDetails } from "@/types/api-contracts";
import { ArrowLeft, BookOpen, Calendar, Play, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

interface StudentCourseMainViewProps {
  course: BackendStudentCourseDetails;
  content?: BackendCourseContent;
  onSelectLesson: (lessonId: number) => void;
}

export function StudentCourseMainView({
  course,
  content,
  onSelectLesson,
}: StudentCourseMainViewProps) {
  const t = useTranslations("studentDashboard.courseDetails");
  const tCourses = useTranslations("courses");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const getLocalized = (val?: Record<string, string> | null, fallback = "") => {
    if (!val) return fallback;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || fallback;
  };

  const title = getLocalized(course.title);
  const description = getLocalized(course.description);
  const stageName = getLocalized(course.educational_stage?.name);
  const subjectName = getLocalized(course.subject?.name);
  const instructorName = course.instructor?.full_name || "";
  const accessEndDate = course.enrollment?.expires_at || undefined;

  const formatExpiryDate = (dateStr?: string) => {
    if (!dateStr) return t("overview.unlimitedAccess");
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat(isRtl ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // First unlocked lesson or next lesson to start
  const firstLessonId = content?.next_lesson?.id || content?.sections?.[0]?.lessons?.[0]?.id;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <Link href="/student-dashboard/courses">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <div className="min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-1 cursor-default">
                    {title}
                  </h1>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-xs">
                  {title}
                </TooltipContent>
              </Tooltip>
              <p className="text-xs text-muted-foreground mt-0.5">{t("overview.courseOverview")}</p>
            </div>
          </div>

          {firstLessonId && (
            <Button
              type="button"
              onClick={() => onSelectLesson(firstLessonId)}
              className="gap-2 font-semibold shadow-xs shrink-0"
            >
              <Play className="size-3.5 fill-current rtl:rotate-180" />
              <span className="hidden sm:inline">
                {content?.progress?.completed_lessons && content.progress.completed_lessons > 0
                  ? t("overview.continueLearning")
                  : t("overview.startFirstLesson")}
              </span>
              <span className="sm:hidden">{t("overview.startFirstLesson").split(" ")[0]}</span>
            </Button>
          )}
        </div>

        {/* Cover Hero Banner */}
        <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-muted border border-border/80 shadow-xs">
          {course.cover_image ? (
            <Image
              src={course.cover_image}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 75vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
              {title.slice(0, 3)}
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 flex flex-wrap items-end justify-between gap-3 text-white">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                {stageName && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    {stageName}
                  </Badge>
                )}
                {subjectName && (
                  <Badge
                    variant="outline"
                    className="bg-black/40 text-white border-white/20 backdrop-blur-xs text-xs font-semibold"
                  >
                    {subjectName}
                  </Badge>
                )}
                {course.delivery_mode && (
                  <Badge
                    variant="outline"
                    className="bg-black/40 text-white border-white/20 backdrop-blur-xs text-xs font-semibold"
                  >
                    {tCourses.has(
                      `venue.${course.delivery_mode}` as Parameters<typeof tCourses.has>[0],
                    )
                      ? tCourses(`venue.${course.delivery_mode}` as Parameters<typeof tCourses>[0])
                      : course.delivery_mode}
                  </Badge>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white line-clamp-2 cursor-default">
                    {title}
                  </h2>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-xs">
                  {title}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Meta Info Bar: Teacher, Expiration Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          {/* Instructor */}
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("overview.instructor")}</div>
              <div className="text-sm font-bold text-foreground">{instructorName || "—"}</div>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-3 sm:border-s sm:border-border/60 sm:ps-6">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("overview.accessExpiry")}</div>
              <div className="text-sm font-bold text-foreground">
                {formatExpiryDate(accessEndDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Markdown Course Description Overview */}
        {description && (
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border/80 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <BookOpen className="size-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {t("overview.syllabus")}
              </h3>
            </div>
            <div className="prose prose-sm sm:prose-base max-w-none">
              <MarkdownViewer content={description} isRtl={isRtl} />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
