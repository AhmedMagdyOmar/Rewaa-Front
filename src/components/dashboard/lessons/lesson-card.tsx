"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lesson } from "@/types/course";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Globe2,
  GraduationCap,
  House,
  Layers,
  MoreVertical,
  Paperclip,
  Pencil,
  Sparkles,
  Trash2,
  User,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

interface LessonCardProps {
  lesson: Lesson;
  onDeleteRequest: (lesson: Lesson) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function LessonCard({ lesson, onDeleteRequest }: LessonCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("lessons");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

  const isIndependent =
    lesson.classification === "standalone" ||
    lesson.lessonCategory === "independent" ||
    (!lesson.classification && !lesson.courseId);

  const formatVenue = (v?: string) => {
    if (v === "online") return tCourses("venue.online");
    if (v === "onsite" || v === "center") return tCourses("venue.onsite");
    if (v === "hybrid" || v === "all") return tCourses("venue.hybrid");
    return v || "";
  };

  const formatGrade = (g?: string) => {
    if (!g) return "";
    return tGrades.has(g as Parameters<typeof tGrades.has>[0])
      ? tGrades(g as Parameters<typeof tGrades>[0])
      : g;
  };

  const formatSubject = (s?: string) => {
    if (!s) return "";
    return tSubjects.has(s as Parameters<typeof tSubjects.has>[0])
      ? tSubjects(s as Parameters<typeof tSubjects>[0])
      : s;
  };

  const pdfCount = (lesson.pdfFiles || []).length || (lesson.hasPdfAttachments ? 1 : 0);
  const teacherImage = lesson.teacherImage || "";

  const subjectAndGradeText = [formatSubject(lesson.subject), formatGrade(lesson.grade)]
    .filter(Boolean)
    .join(" • ");

  const completionsCount = lesson.completionsCount ?? 0;
  const [showLinkedCoursesDialog, setShowLinkedCoursesDialog] = React.useState(false);

  const linkedCourses = lesson.linkedCourses || [];
  const linkedCoursesCount =
    lesson.linkedCoursesCount ??
    (linkedCourses.length > 0 ? linkedCourses.length : lesson.courseId ? 1 : 0);
  const isMultiCourse = linkedCoursesCount > 1;
  const effectiveCourseTitle =
    lesson.courseTitle || (linkedCourses.length === 1 ? linkedCourses[0].title : undefined);

  return (
    <div className="group flex flex-col bg-card rounded-xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      {/* 1. COVER IMAGE & OVERLAYS */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
        {lesson.coverImage ? (
          <Image
            src={lesson.coverImage}
            alt={lesson.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <BookOpen className="size-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/20" />

        {/* Top-End: Media Type and Active Status */}
        <div className="absolute top-2 inset-e-2 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {lesson.isActive === false && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-destructive/90 text-white backdrop-blur-md shadow-xs">
                {t("card.inactive")}
              </span>
            )}
          </div>
          <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-xs">
            {lesson.type === "text" ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Video className="h-4 w-4" />
            )}
          </span>
        </div>
      </div>

      {/* 2. CARD BODY (Title First) */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Lesson Title Row with Category Icon (start) and Venue Icon (end, general only) */}
          <div className="flex items-start justify-between gap-2 mb-2.5 group-hover:text-primary transition-colors">
            <div className="flex items-start gap-1.5 min-w-0 flex-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-0.5 shrink-0 cursor-default text-muted-foreground hover:text-primary transition-colors">
                      {isIndependent ? (
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-primary" />
                      )}
                      <span className="sr-only">
                        {isIndependent ? t("card.generalLesson") : t("card.courseDependentLesson")}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isIndependent ? t("card.generalLesson") : t("card.courseDependentLesson")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <h3 className="font-bold text-foreground text-[15px] line-clamp-2 leading-snug">
                {lesson.title}
              </h3>
            </div>

            {/* Venue Icon at the end of the title row (visible only if general/independent) */}
            {isIndependent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-0.5 shrink-0 cursor-default text-muted-foreground hover:text-primary transition-colors">
                      {lesson.venue === "online" ? (
                        <Globe className="h-4 w-4" />
                      ) : lesson.venue === "onsite" ? (
                        <House className="h-4 w-4" />
                      ) : (
                        <Globe2 className="h-4 w-4" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{formatVenue(lesson.venue)}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Course and Section Link or Multi-Course Badge */}
          {isMultiCourse ? (
            <button
              type="button"
              onClick={() => setShowLinkedCoursesDialog(true)}
              className="mb-2.5 flex items-center justify-between w-full text-xs text-muted-foreground bg-primary/5 hover:bg-primary/10 transition-colors px-2.5 py-1.5 rounded-md border border-primary/20 text-start cursor-pointer group/link"
            >
              <div className="flex items-center gap-1.5 font-semibold text-primary truncate">
                <Layers className="size-3.5 shrink-0" />
                <span className="truncate">
                  {t("card.linkedCoursesCount", { count: linkedCoursesCount })}
                </span>
              </div>
              <span className="text-[11px] text-primary/80 font-normal shrink-0 underline-offset-2 group-hover/link:underline">
                {t("card.viewCourses")}
              </span>
            </button>
          ) : effectiveCourseTitle ? (
            <div className="mb-2.5 flex flex-col items-start gap-1.5 text-xs text-muted-foreground truncate bg-muted/40 px-2 py-1 rounded-md border border-border/40">
              <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                <BookOpen className="size-3.5 text-primary shrink-0" />
                <span className="truncate">{effectiveCourseTitle}</span>
              </div>
              {lesson.sectionTitle && <span className="truncate">{lesson.sectionTitle}</span>}
            </div>
          ) : null}

          {/* Teacher and Subject Info */}
          <div className="flex flex-col gap-2">
            {lesson.teacherName && (
              <div className="flex items-center gap-2">
                <div className="relative size-6 rounded-full overflow-hidden bg-primary/10 border border-border/60 shrink-0 flex items-center justify-center">
                  {teacherImage ? (
                    <Image
                      src={teacherImage}
                      alt={lesson.teacherName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="size-3.5 text-primary/70" />
                  )}
                </div>
                <span className="truncate text-sm font-medium text-foreground/80">
                  {lesson.teacherName}
                </span>
              </div>
            )}
            {subjectAndGradeText && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{subjectAndGradeText}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. METADATA PILLS ROW (Numeric pills only) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <TooltipProvider delayDuration={200}>
            {pdfCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-medium cursor-default">
                    <Paperclip className="h-3 w-3" />
                    <span>{pdfCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("card.pdfsCount", { count: pdfCount })}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Completed Students Pill (True backend source) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground cursor-default">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>{formatCount(completionsCount)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isAr
                  ? `${completionsCount} طالب أتموا الدرس`
                  : `${completionsCount} students completed`}
              </TooltipContent>
            </Tooltip>

            {/* Linked Exam Pill */}
            {lesson.isLinkedToExam && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 rounded-md text-xs font-medium cursor-default">
                    <FileCheck className="h-3 w-3" />
                    <span className="truncate max-w-30">
                      {lesson.linkedExamTitle || t("card.defaultExam")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {lesson.linkedExamTitle
                    ? `${t("card.linkedExamPrefix")} ${lesson.linkedExamTitle}`
                    : t("card.examLinked")}
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>

        {/* 4. FOOTER ACTIONS */}
        <div className="flex items-center gap-2 mt-4 pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 font-bold text-sm border border-primary! text-primary hover:text-primary py-3.5! cursor-pointer"
          >
            <Link href={`/${locale}/dashboard/lessons/${lesson.id}/edit`}>
              {t("card.editLesson")}
            </Link>
          </Button>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/dashboard/lessons/${lesson.id}/edit`}>
                  <Pencil className="h-4 w-4 me-2" />
                  <span>{t("card.editLesson")}</span>
                </Link>
              </DropdownMenuItem>

              {linkedCourses.length > 0 && (
                <DropdownMenuItem onClick={() => setShowLinkedCoursesDialog(true)}>
                  <Layers className="h-4 w-4 me-2 text-primary" />
                  <span>{t("card.viewLinkedCourses")}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => onDeleteRequest(lesson)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 me-2" />
                <span>{t("card.deleteLesson")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Linked Courses Dialog Modal */}
      <Dialog open={showLinkedCoursesDialog} onOpenChange={setShowLinkedCoursesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Layers className="h-5 w-5 text-primary" />
              <span>{t("card.coursesPopupTitle")}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto mt-2">
            {linkedCourses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-10 rounded-md overflow-hidden bg-muted shrink-0 border border-border/50 flex items-center justify-center">
                    {c.coverImage ? (
                      <Image
                        src={c.coverImage}
                        alt={c.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <BookOpen className="size-5 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {c.title}
                    </span>
                    {c.sectionTitle && (
                      <span className="text-xs text-muted-foreground truncate">
                        {c.sectionTitle}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5 text-xs font-semibold"
                >
                  <Link href={`/${locale}/dashboard/courses/${c.id}/edit`}>
                    <span>{t("card.editLesson")}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
