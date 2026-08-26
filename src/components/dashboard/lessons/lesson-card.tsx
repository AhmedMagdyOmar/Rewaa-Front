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
import { getStoredCourses } from "@/lib/courses-storage";
import { getStoredTeachers } from "@/lib/settings-storage";
import { Lesson } from "@/types/course";
import {
  BookOpen,
  Check,
  Copy,
  Eye,
  FileQuestion,
  FileText,
  Globe,
  Globe2,
  GraduationCap,
  House,
  LayoutList,
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
  copiedId: string | null;
  onPublishToggle: (lessonId: string) => void;
  onCopyLink: (lessonId: string) => void;
  onDeleteRequest: (lesson: Lesson) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function LessonCard({
  lesson,
  copiedId,
  onPublishToggle,
  onCopyLink,
  onDeleteRequest,
}: LessonCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("lessons");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

  const [coursesPopupOpen, setCoursesPopupOpen] = React.useState(false);

  const isIndependent =
    lesson.lessonCategory === "independent" || (!lesson.lessonCategory && !lesson.courseId);

  const formatVenue = (v?: string) => {
    if (v === "online") return tCourses("venue.online");
    if (v === "center") return tCourses("venue.center");
    return tCourses("venue.all");
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

  const fallbackCover = lesson.coverImage || "/courses/physics.jpg";
  const pdfCount = (lesson.pdfFiles || []).length || (lesson.hasPdfAttachments ? 1 : 0);

  const teachers = typeof window !== "undefined" ? getStoredTeachers() : [];
  const teacherImage =
    lesson.teacherImage ||
    teachers.find(
      (t) =>
        t.name.trim().toLowerCase() === (lesson.teacherName || "").trim().toLowerCase() ||
        t.id === lesson.teacherName,
    )?.image ||
    "";

  const subjectAndGradeText = [formatSubject(lesson.subject), formatGrade(lesson.grade)]
    .filter(Boolean)
    .join(" • ");

  const coursesCount = lesson.coursesCount ?? 0;
  const viewsCount = lesson.viewsCount ?? 0;
  const isMultiCourse = coursesCount > 1;

  const linkedCoursesList = React.useMemo(() => {
    if (!isMultiCourse) return [];
    const allCourses = typeof window !== "undefined" ? getStoredCourses(locale) : [];
    const ids: string[] = [];
    if (lesson.courseIds && lesson.courseIds.length > 0) {
      ids.push(...lesson.courseIds);
    } else if (lesson.courseId) {
      ids.push(lesson.courseId);
    }

    interface LinkedCourseItem {
      id: string;
      title: string;
      viewsCount: number;
      publishStatus: "published" | "draft" | "scheduled";
    }

    const resolved: LinkedCourseItem[] = [];

    // Helper to find lesson instance inside a course
    const findLessonInCourse = (c: (typeof allCourses)[0]) => {
      for (const s of c.sections || []) {
        const found = (s.lessons || []).find((l) => l.id === lesson.id);
        if (found) return found;
      }
      return null;
    };

    ids.forEach((id) => {
      const match = allCourses.find((c) => c.id === id);
      if (match) {
        const lessonInCourse = findLessonInCourse(match);
        resolved.push({
          id: match.id,
          title: match.title,
          viewsCount: lessonInCourse?.viewsCount ?? viewsCount,
          publishStatus: lessonInCourse?.publishStatus ?? lesson.publishStatus ?? "published",
        });
      }
    });

    if (resolved.length === 0 && lesson.courseTitle) {
      resolved.push({
        id: lesson.courseId || "c1",
        title: lesson.courseTitle,
        viewsCount: viewsCount,
        publishStatus: lesson.publishStatus || "published",
      });
    }

    for (const c of allCourses) {
      if (resolved.length >= coursesCount) break;
      if (!resolved.some((r) => r.id === c.id)) {
        const lessonInCourse = findLessonInCourse(c);
        resolved.push({
          id: c.id,
          title: c.title,
          viewsCount: lessonInCourse?.viewsCount ?? Math.max(0, Math.floor(viewsCount * 0.7)),
          publishStatus: lessonInCourse?.publishStatus ?? "published",
        });
      }
    }
    return resolved;
  }, [
    isMultiCourse,
    lesson.courseIds,
    lesson.courseId,
    lesson.courseTitle,
    lesson.id,
    lesson.publishStatus,
    coursesCount,
    viewsCount,
    locale,
  ]);

  return (
    <>
      <div className="group flex flex-col bg-card rounded-xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
        {/* 1. COVER IMAGE & OVERLAYS */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={fallbackCover}
            alt={lesson.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/20" />

          {/* Top-End: Media Type */}
          <div className="absolute top-2 inset-e-2 flex items-center gap-1.5">
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
            {/* Title */}
            <h3 className="font-bold text-foreground text-[15px] line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2.5">
              {lesson.title}
            </h3>

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

          {/* 3. METADATA PILLS ROW */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <TooltipProvider delayDuration={200}>
              {/* Category Pill */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground cursor-default">
                    {isIndependent ? (
                      <Sparkles className="h-3 w-3 text-amber-500" />
                    ) : (
                      <BookOpen className="h-3 w-3 text-primary" />
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

              {/* Venue Pill (Independent Only) */}
              {isIndependent && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground">
                      {lesson.venue === "online" ? (
                        <Globe className="h-3 w-3 text-primary" />
                      ) : lesson.venue === "center" ? (
                        <House className="h-3 w-3 text-primary" />
                      ) : (
                        <Globe2 className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{formatVenue(lesson.venue)}</TooltipContent>
                </Tooltip>
              )}

              {pdfCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-medium">
                      <Paperclip className="h-3 w-3" />
                      <span>{pdfCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("card.pdfsCount", { count: pdfCount })}
                  </TooltipContent>
                </Tooltip>
              )}

              {lesson.isLinkedToExam && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-medium">
                      <FileQuestion className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {lesson.linkedExamTitle
                      ? `${t("card.examLinked")}: ${lesson.linkedExamTitle}`
                      : t("card.examLinked")}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Views Pill */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground cursor-default">
                    <Eye className="h-3 w-3" />
                    <span>{formatCount(viewsCount)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("card.viewsCount", { count: viewsCount })}
                </TooltipContent>
              </Tooltip>

              {/* Courses Count Pill */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground cursor-default">
                    <LayoutList className="h-3 w-3" />
                    <span>{coursesCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("card.coursesCount", { count: coursesCount })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 4. FOOTER ACTIONS */}
          <div className="flex items-center gap-2 mt-4 pt-1">
            {lesson.publishStatus === "draft" ? (
              <Button
                onClick={() => onPublishToggle(lesson.id)}
                size="sm"
                className="flex-1 font-bold text-sm py-3.5! cursor-pointer"
              >
                {t("card.publishNow")}
              </Button>
            ) : (
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
            )}

            {/* Action Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
                {lesson.publishStatus === "draft" && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/dashboard/lessons/${lesson.id}/edit`}>
                      <Pencil className="h-4 w-4 me-2" />
                      <span>{t("card.editLesson")}</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {isMultiCourse && (
                  <DropdownMenuItem onClick={() => setCoursesPopupOpen(true)}>
                    <LayoutList className="h-4 w-4 me-2" />
                    <span>{t("card.viewCourses")}</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => onCopyLink(lesson.id)}>
                  {copiedId === lesson.id ? (
                    <>
                      <Check className="h-4 w-4 me-2 text-success" />
                      <span className="text-success">{t("card.copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 me-2" />
                      <span>{t("card.copyLink")}</span>
                    </>
                  )}
                </DropdownMenuItem>

                {lesson.publishStatus !== "draft" && (
                  <DropdownMenuItem onClick={() => onPublishToggle(lesson.id)}>
                    <BookOpen className="h-4 w-4 me-2" />
                    <span>
                      {lesson.publishStatus === "published"
                        ? t("card.unpublish")
                        : t("card.publish")}
                    </span>
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
      </div>

      {/* Courses Popup Dialog */}
      {isMultiCourse && (
        <Dialog open={coursesPopupOpen} onOpenChange={setCoursesPopupOpen}>
          <DialogContent className="min-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <LayoutList className="h-4 w-4 text-primary shrink-0" />
                {t("card.coursesPopupTitle")}
              </DialogTitle>
            </DialogHeader>
            <ul className="space-y-2 mt-2 max-h-80 overflow-y-auto pr-0.5">
              {linkedCoursesList.map((course, idx) => (
                <li
                  key={course.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 border border-border/50 transition-colors text-sm"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="mt-1 text-muted-foreground text-xs font-semibold w-4 shrink-0 text-center">
                      {idx + 1}
                    </span>
                    <BookOpen className="mt-1 h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground text-xs sm:text-sm">
                      {course.title}
                    </span>
                  </div>

                  <div className="flex items-start mt-1 gap-2 shrink-0">
                    {/* Views Count Pill */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border/60 text-[11px] font-medium text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{formatCount(course.viewsCount)}</span>
                    </span>

                    {/* Publish Status Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        course.publishStatus === "published"
                          ? "bg-emerald-500/10 text-emerald-600  border border-emerald-500/20"
                          : course.publishStatus === "scheduled"
                            ? "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                            : "bg-muted text-muted-foreground border border-border/60"
                      }`}
                    >
                      {course.publishStatus === "published"
                        ? t("card.published")
                        : course.publishStatus === "scheduled"
                          ? t("card.scheduled")
                          : t("card.draft")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
