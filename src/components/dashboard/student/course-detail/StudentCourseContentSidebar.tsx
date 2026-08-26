/* eslint-disable react-hooks/set-state-in-effect */
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
import { getStoredExams } from "@/lib/exams-storage";
import { cn } from "@/lib/utils";
import { Course, CourseSection, Lesson } from "@/types/course";
import { Exam } from "@/types/exam";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

interface StudentCourseContentSidebarProps {
  course: Course;
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
  completedLessons: string[];
  passedExamIds: string[];
  onToggleLessonCompletion: (lessonId: string) => void;
  onAttemptLockedLesson?: (section: CourseSection, requiredExamId?: string) => void;
  progressPercentage: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function StudentCourseContentSidebar({
  course,
  selectedLessonId,
  onSelectLesson,
  completedLessons,
  passedExamIds,
  onToggleLessonCompletion,
  onAttemptLockedLesson,
  progressPercentage,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: StudentCourseContentSidebarProps) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.courseDetails");

  const [exams, setExams] = React.useState<Exam[]>([]);

  React.useEffect(() => {
    setExams(getStoredExams(locale));
    const handleExamsUpdate = () => setExams(getStoredExams(locale));
    window.addEventListener("rewaa_exams_updated", handleExamsUpdate);
    return () => window.removeEventListener("rewaa_exams_updated", handleExamsUpdate);
  }, [locale]);

  // Sanitize course to ensure draft sections and draft lessons are excluded
  const sanitizedSections = React.useMemo(() => {
    return (course.sections || [])
      .filter((s) => !s.isDraft && s.status !== "draft")
      .map((s) => ({
        ...s,
        lessons: (s.lessons || []).filter((l) => l.publishStatus !== "draft"),
      }));
  }, [course.sections]);

  const totalSections = sanitizedSections.length;
  const totalLessons = sanitizedSections.reduce((acc, s) => acc + s.lessons.length, 0);

  // Helper to check if linked exam exists
  const isExamPublished = (examId?: string) => {
    if (!examId) return false;
    const found = exams.find((e) => e.id === examId);
    return Boolean(found);
  };

  // Helper to resolve exam name
  const getExamTitle = (examId?: string, fallbackTitle?: string) => {
    if (!examId) return fallbackTitle || t("lesson.linkedExam");
    const found = exams.find((e) => e.id === examId);
    return found?.title || fallbackTitle || t("lesson.linkedExam");
  };

  // Auto-expand section containing the selected lesson
  const defaultSectionValue = React.useMemo(() => {
    if (!selectedLessonId) return "section-0";
    const foundIndex = sanitizedSections.findIndex((sec) =>
      sec.lessons.some((l) => l.id === selectedLessonId),
    );
    return foundIndex !== -1 ? `section-${foundIndex}` : "section-0";
  }, [sanitizedSections, selectedLessonId]);

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
          {sanitizedSections.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
              {t("empty.noSections")}
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={[defaultSectionValue]}
              className="w-full space-y-3"
            >
              {sanitizedSections.map((section: CourseSection, sIdx: number) => {
                const sectionLessonsCount = section.lessons.length;
                const sectionCompletedCount = section.lessons.filter((l) =>
                  completedLessons.includes(l.id),
                ).length;
                const isSectionCompleted =
                  sectionLessonsCount > 0 && sectionCompletedCount === sectionLessonsCount;

                // Check lock status for this section based on prior sections' required exams
                let isSectionLocked = false;
                let requiredExamIdForUnlock: string | undefined;

                for (let prevIdx = 0; prevIdx < sIdx; prevIdx++) {
                  const prevSec = sanitizedSections[prevIdx];
                  if (
                    prevSec &&
                    prevSec.isLinkedToExam &&
                    prevSec.isRequiredPassExamForNextSection &&
                    prevSec.linkedExamId &&
                    isExamPublished(prevSec.linkedExamId)
                  ) {
                    if (!passedExamIds.includes(prevSec.linkedExamId)) {
                      isSectionLocked = true;
                      requiredExamIdForUnlock = prevSec.linkedExamId;
                      break;
                    }
                  }
                }

                // Check if current section has a published exam and if it is passed
                const hasExam =
                  section.isLinkedToExam &&
                  !!section.linkedExamId &&
                  isExamPublished(section.linkedExamId);
                const isCurrentExamPassed =
                  hasExam && passedExamIds.includes(section.linkedExamId!);

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
                            {section.title}
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
                          {section.isRequiredPassExamForNextSection && (
                            <span className="text-xs text-amber-600 font-semibold">
                              • {t("locked.mustPassExam")}
                            </span>
                          )}
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
                      {section.lessons.map((lesson: Lesson) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const isSelected = selectedLessonId === lesson.id;
                        const hasVideo = lesson.type !== "text" && !!lesson.lectureVideoLink;
                        const pdfCount =
                          (lesson.pdfFiles || []).length || (lesson.hasPdfAttachments ? 1 : 0);
                        const hasLessonExam = Boolean(
                          lesson.isLinkedToExam &&
                          lesson.linkedExamId &&
                          isExamPublished(lesson.linkedExamId),
                        );
                        const isLessonExamPassed =
                          hasLessonExam && passedExamIds.includes(lesson.linkedExamId!);

                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              "group/item relative flex items-start justify-between gap-2.5 p-3 rounded-xl border text-xs sm:text-sm transition-all",
                              isSectionLocked
                                ? "bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed opacity-75"
                                : isSelected
                                  ? "bg-primary/10 border-primary/40 text-primary shadow-xs font-semibold cursor-pointer"
                                  : "bg-background hover:bg-muted/60 border-border/60 text-foreground cursor-pointer",
                            )}
                            onClick={() => {
                              if (isSectionLocked) {
                                onAttemptLockedLesson?.(section, requiredExamIdForUnlock);
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
                                disabled={isSectionLocked}
                                onCheckedChange={() => {
                                  if (!isSectionLocked) {
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
                                    disabled={isSectionLocked}
                                    onClick={() => {
                                      if (isSectionLocked) {
                                        onAttemptLockedLesson?.(section, requiredExamIdForUnlock);
                                      } else {
                                        onSelectLesson(lesson.id);
                                      }
                                    }}
                                    className={cn(
                                      "flex items-start gap-2.5 text-start min-w-0 flex-1 text-xs sm:text-sm font-medium",
                                      isSectionLocked ? "cursor-not-allowed" : "hover:underline",
                                    )}
                                  >
                                    {isSectionLocked ? (
                                      <Lock className="size-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                                    ) : hasVideo ? (
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
                                      {lesson.title}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                  {isSectionLocked ? t("locked.tooltip") : lesson.title}
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
                                    {getExamTitle(lesson.linkedExamId, lesson.linkedExamTitle)}
                                    {isLessonExamPassed
                                      ? ` (${t("locked.examPassed")})`
                                      : ` (${t("lesson.linkedExam")})`}
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {pdfCount > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-[11px] font-bold flex items-center gap-1">
                                      <Paperclip className="size-3" />
                                      <span>{pdfCount}</span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {t("lesson.attachedFiles")}: {pdfCount}
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {isSectionLocked ? (
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

                      {/* Attached files directly under section if any */}
                      {!isSectionLocked &&
                        section.lessons.flatMap((l) => l.pdfFiles || []).length > 0 && (
                          <div className="pt-1.5 space-y-1.5">
                            {section.lessons
                              .flatMap((l) => l.pdfFiles || [])
                              .slice(0, 2)
                              .map((file, fIdx) => (
                                <Tooltip key={file.id || `file-${fIdx}`}>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={file.fileUrl || "#"}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-start justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0 gap-2"
                                    >
                                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                        <Paperclip className="size-3.5 text-primary shrink-0 mt-0.5" />
                                        <span className="leading-snug">{file.title}</span>
                                      </div>
                                      <Download className="size-3.5 text-muted-foreground shrink-0 ms-1 mt-0.5" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs">
                                    {file.title}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                          </div>
                        )}

                      {/* Linked Exam in Section - shows exam title & required badge */}
                      {section.isLinkedToExam &&
                        section.linkedExamId &&
                        isExamPublished(section.linkedExamId) && (
                          <div className="pt-1.5">
                            {(() => {
                              const examTitle = getExamTitle(
                                section.linkedExamId,
                                section.linkedExamTitle,
                              );
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link
                                      href={`/student-dashboard/exams/${section.linkedExamId}`}
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
                                            isCurrentExamPassed
                                              ? "text-emerald-600"
                                              : "text-amber-600",
                                          )}
                                        />
                                        <span className="leading-snug">{examTitle}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 ms-1 mt-0.5">
                                        {isCurrentExamPassed ? (
                                          <Badge className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 h-auto">
                                            {t("locked.examPassed")}
                                          </Badge>
                                        ) : section.isRequiredPassExamForNextSection ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[11px] bg-amber-500/15 border-amber-500/30 text-amber-700 px-2 py-0.5 h-auto font-bold"
                                          >
                                            {t("locked.examRequired")}
                                          </Badge>
                                        ) : (
                                          <FileCheck className="size-4 shrink-0 opacity-80" />
                                        )}
                                      </div>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs">
                                    {examTitle}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
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
