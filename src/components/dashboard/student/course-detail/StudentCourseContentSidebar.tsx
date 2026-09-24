"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  BackendCourseContent,
  BackendCourseContentSection,
  BackendCourseContentSectionLesson,
  BackendCourseContentSectionLessonExam,
} from "@/types/api-contracts";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

interface StudentCourseContentSidebarProps {
  content: BackendCourseContent;
  selectedLessonId: number | null;
  onSelectLesson: (lessonId: number) => void;
  onToggleLessonCompletion: (lessonId: number) => void;
  onAttemptLockedLesson?: (
    section: BackendCourseContentSection,
    requiredExam?: BackendCourseContentSectionLessonExam | null,
  ) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function StudentCourseContentSidebar({
  content,
  selectedLessonId,
  onSelectLesson,
  onToggleLessonCompletion,
  onAttemptLockedLesson,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: StudentCourseContentSidebarProps) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.courseDetails");

  const sections = React.useMemo(() => content.sections || [], [content.sections]);
  const totalSections = sections.length;
  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const progressPercentage = Math.round(content.progress?.percentage || 0);

  // Auto-expand section containing the selected lesson
  const defaultSectionValue = React.useMemo(() => {
    if (!selectedLessonId) return "section-0";
    const foundIndex = sections.findIndex((sec) =>
      sec.lessons?.some((l) => l.id === selectedLessonId),
    );
    return foundIndex !== -1 ? `section-${foundIndex}` : "section-0";
  }, [sections, selectedLessonId]);

  // Helper to resolve localized text safely
  const getLocalized = (val?: Record<string, string> | null, fallback = "") => {
    if (!val) return fallback;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || fallback;
  };

  // Collapsed Sidebar View (Desktop mini-rail)
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            "flex flex-col items-center justify-between h-full min-h-120 py-4 bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-xs gap-4",
            className,
          )}
        >
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* Expand toggle button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="h-10 w-10 rounded-xl border-border/80 hover:bg-muted/80 text-foreground shrink-0 shadow-xs"
                >
                  <PanelLeftOpen className="size-5 rtl:rotate-180 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={locale === "ar" ? "left" : "right"} className="text-xs">
                {t("expandSidebar")}
              </TooltipContent>
            </Tooltip>

            {/* Circular / Vertical Progress Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold w-full cursor-default">
                  <span>{progressPercentage}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side={locale === "ar" ? "left" : "right"} className="text-xs">
                {t("totalProgress", { progress: progressPercentage })}
              </TooltipContent>
            </Tooltip>

            {/* Book Icon Indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex flex-col items-center justify-center size-10 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <BookOpen className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side={locale === "ar" ? "left" : "right"} className="text-xs">
                {t("courseContent")} ({totalLessons})
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex flex-col h-full bg-card border border-border/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs",
          className,
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <BookOpen className="size-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">
                {t("courseContent")}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary font-bold text-xs sm:text-sm px-2.5 py-0.5 border border-primary/20"
              >
                {t("totalProgress", { progress: progressPercentage })}
              </Badge>

              {onToggleCollapse && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onToggleCollapse}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hidden lg:flex"
                    >
                      <PanelLeftClose className="size-4 rtl:rotate-180" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {t("collapseSidebar")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Count indicators: sections & lessons */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
            <span>{t("sectionsCount", { count: totalSections })}</span>
            <span>•</span>
            <span>{t("lessonsCount", { count: totalLessons })}</span>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2.5 bg-primary/15 rounded-full" />
        </div>

        {/* Sections & Items Collapsible List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {sections.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
              {t("empty.noSections")}
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={[defaultSectionValue]}
              className="w-full space-y-3"
            >
              {sections.map((section: BackendCourseContentSection, sIdx: number) => {
                const sectionLessons = section.lessons || [];
                const sectionLessonsCount = sectionLessons.length;
                const sectionCompletedCount = sectionLessons.filter((l) => l.is_completed).length;
                const isSectionCompleted =
                  sectionLessonsCount > 0 && sectionCompletedCount === sectionLessonsCount;
                const isSectionLocked = section.is_locked;
                const sectionTitle = getLocalized(section.title, `Section ${sIdx + 1}`);

                // Section exam check
                const sectionExam = section.exam;
                const hasExam = Boolean(sectionExam);
                const isCurrentExamPassed = sectionExam?.is_passed ?? false;
                const sectionExamTitle = getLocalized(sectionExam?.title, t("lesson.linkedExam"));

                return (
                  <AccordionItem
                    key={section.id || `section-${sIdx}`}
                    value={`section-${sIdx}`}
                    className={cn(
                      "border rounded-xl px-3.5 py-1.5 bg-background data-[state=open]:bg-muted/30 transition-colors",
                      isSectionLocked
                        ? "border-amber-500/30 bg-amber-500/5 data-[state=open]:bg-amber-500/10 opacity-90"
                        : "border-border/70",
                    )}
                  >
                    <AccordionTrigger className="hover:no-underline py-2.5 min-w-0 [&>svg]:shrink-0 [&>svg]:mt-1">
                      <div className="flex flex-col items-start text-start gap-1.5 pe-2 flex-1 min-w-0">
                        <div className="flex items-start gap-2.5 w-full min-w-0">
                          {isSectionLocked ? (
                            <div className="size-5 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Lock className="size-3 text-amber-600" />
                            </div>
                          ) : isSectionCompleted ? (
                            <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <span className="size-5 rounded-full border border-muted-foreground/40 shrink-0 text-xs flex items-center justify-center font-bold text-muted-foreground mt-0.5">
                              {sIdx + 1}
                            </span>
                          )}
                          <h3 className="text-sm sm:text-base font-bold text-foreground min-w-0 flex-1 leading-snug">
                            {sectionTitle}
                          </h3>

                          {isSectionLocked && (
                            <Badge
                              variant="outline"
                              className="text-[11px] bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold shrink-0 gap-1 px-2 py-0.5 mt-0.5"
                            >
                              <Lock className="size-3" />
                              <span>{t("locked.badge")}</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ps-7 text-xs text-muted-foreground font-medium">
                          <span>
                            {sectionCompletedCount}/{sectionLessonsCount}{" "}
                            {t("lessonsCount", { count: sectionLessonsCount })}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-2.5 pb-3.5 space-y-2 border-t border-border/50 mt-1">
                      {/* If locked, display lock explanation warning box */}
                      {isSectionLocked && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-800 flex items-start gap-2.5 mb-2">
                          <Lock className="size-4 shrink-0 text-amber-600 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs leading-tight">
                              {t("locked.tooltip")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* List of Lessons inside section */}
                      {sectionLessons.map((lesson: BackendCourseContentSectionLesson) => {
                        const isCompleted = lesson.is_completed;
                        const isSelected = selectedLessonId === lesson.id;
                        const isLessonLocked = lesson.is_locked || isSectionLocked;
                        const lessonTitle = getLocalized(lesson.title, `Lesson ${lesson.position}`);
                        const isVideo = lesson.type?.includes("video");
                        const lessonExam = lesson.exam;
                        const hasLessonExam = Boolean(lessonExam);
                        const isLessonExamPassed = lessonExam?.is_passed ?? false;
                        const lessonExamTitle = getLocalized(
                          lessonExam?.title,
                          t("lesson.linkedExam"),
                        );

                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              "group/item relative flex items-start justify-between gap-2.5 p-3 rounded-xl border text-xs sm:text-sm transition-all",
                              isLessonLocked
                                ? "bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed opacity-75"
                                : isSelected
                                  ? "bg-primary/10 border-primary/40 text-primary shadow-xs font-semibold cursor-pointer"
                                  : "bg-background hover:bg-muted/60 border-border/60 text-foreground cursor-pointer",
                            )}
                            onClick={() => {
                              if (isLessonLocked) {
                                onAttemptLockedLesson?.(section, lessonExam || sectionExam);
                              } else {
                                onSelectLesson(lesson.id);
                              }
                            }}
                          >
                            {/* Completion Checkbox & Title */}
                            <div
                              className="flex items-start gap-3 min-w-0 flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isCompleted}
                                disabled={isLessonLocked}
                                onCheckedChange={() => {
                                  if (!isLessonLocked) {
                                    onToggleLessonCompletion(lesson.id);
                                  }
                                }}
                                aria-label={t("lesson.markAsCompleted")}
                                className="size-4.5 shrink-0 rounded-lg data-checked:bg-emerald-600 data-checked:border-emerald-600 mt-0.5"
                              />

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    disabled={isLessonLocked}
                                    onClick={() => {
                                      if (isLessonLocked) {
                                        onAttemptLockedLesson?.(section, lessonExam || sectionExam);
                                      } else {
                                        onSelectLesson(lesson.id);
                                      }
                                    }}
                                    className={cn(
                                      "flex items-start gap-2.5 text-start min-w-0 flex-1 text-xs sm:text-sm font-medium",
                                      isLessonLocked ? "cursor-not-allowed" : "hover:underline",
                                    )}
                                  >
                                    {isLessonLocked ? (
                                      <Lock className="size-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                                    ) : isVideo ? (
                                      <Video className="size-4 shrink-0 text-primary mt-0.5" />
                                    ) : (
                                      <FileText className="size-4 shrink-0 text-blue-500 mt-0.5" />
                                    )}
                                    <span
                                      className={cn(
                                        "text-xs sm:text-sm leading-snug",
                                        isCompleted &&
                                          !isSelected &&
                                          "line-through text-muted-foreground opacity-80",
                                      )}
                                    >
                                      {lessonTitle}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                  {isLessonLocked ? t("locked.tooltip") : lessonTitle}
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            {/* Extra Badges / Indicators */}
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              {/* Exam linked indicator icon */}
                              {hasLessonExam && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={cn(
                                        "p-1.5 rounded-lg flex items-center justify-center transition-colors",
                                        isLessonExamPassed
                                          ? "bg-emerald-500/15 text-emerald-600"
                                          : "bg-amber-500/15 text-amber-600",
                                      )}
                                    >
                                      <FileSpreadsheet className="size-3.5" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {lessonExamTitle}
                                    {isLessonExamPassed
                                      ? ` (${t("locked.examPassed")})`
                                      : ` (${t("lesson.linkedExam")})`}
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {isLessonLocked ? (
                                <Lock className="size-3.5 text-muted-foreground/60" />
                              ) : (
                                <ChevronRight
                                  className={cn(
                                    "size-4 text-muted-foreground transition-transform rtl:rotate-180",
                                    isSelected &&
                                      "text-primary translate-x-0.5 rtl:-translate-x-0.5",
                                  )}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Linked Exam in Section */}
                      {hasExam && sectionExam && (
                        <div className="pt-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/student-dashboard/exams/${sectionExam.id}`}
                                className={cn(
                                  "flex items-start justify-between p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors min-w-0 gap-2",
                                  isCurrentExamPassed
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-800"
                                    : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-800",
                                )}
                              >
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <FileSpreadsheet
                                    className={cn(
                                      "size-4.5 shrink-0 mt-0.5",
                                      isCurrentExamPassed ? "text-emerald-600" : "text-amber-600",
                                    )}
                                  />
                                  <span className="leading-snug">{sectionExamTitle}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ms-1 mt-0.5">
                                  {isCurrentExamPassed ? (
                                    <Badge className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 h-auto">
                                      {t("locked.examPassed")}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[11px] bg-amber-500/15 border-amber-500/30 text-amber-700 px-2 py-0.5 h-auto font-bold"
                                    >
                                      {t("locked.examRequired")}
                                    </Badge>
                                  )}
                                </div>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              {sectionExamTitle}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
