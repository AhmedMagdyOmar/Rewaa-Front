/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { getStoredExams } from "@/lib/exams-storage";
import { cn } from "@/lib/utils";
import { Course, Lesson, LessonAttachment } from "@/types/course";
import { Exam } from "@/types/exam";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Lock,
  Paperclip,
  Play,
  User,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

interface StudentCourseMainViewProps {
  course: Course;
  selectedLesson: Lesson | null;
  completedLessons: string[];
  passedExamIds: string[];
  onToggleLessonCompletion: (lessonId: string) => void;
  onSelectLesson: (lessonId: string | null) => void;
  onNextLesson?: () => void;
  onPreviousLesson?: () => void;
  hasNextLesson?: boolean;
  hasPreviousLesson?: boolean;
  isNextLessonLocked?: boolean;
  accessEndDate?: string;
  teacherImage?: string;
}

function getEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.includes("youtube.com/embed/")) return trimmed;
  if (trimmed.includes("youtube.com/watch")) {
    const videoId = trimmed.split("v=")[1]?.split("&")[0];
    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : trimmed.replace("watch?v=", "embed/");
  }
  if (trimmed.includes("youtu.be/")) {
    const videoId = trimmed.split("youtu.be/")[1]?.split("?")[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
  }
  if (trimmed.includes("vimeo.com/")) {
    const videoId = trimmed.split("vimeo.com/")[1]?.split("?")[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : trimmed;
  }
  return null;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function StudentCourseMainView({
  course,
  selectedLesson,
  completedLessons,
  passedExamIds,
  onToggleLessonCompletion,
  onSelectLesson,
  onNextLesson,
  onPreviousLesson,
  hasNextLesson,
  hasPreviousLesson,
  isNextLessonLocked,
  accessEndDate,
  teacherImage,
}: StudentCourseMainViewProps) {
  const t = useTranslations("studentDashboard.courseDetails");
  const tNew = useTranslations("courses.new");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [exams, setExams] = React.useState<Exam[]>([]);

  React.useEffect(() => {
    setExams(getStoredExams(locale));
    const handleExamsUpdate = () => setExams(getStoredExams(locale));
    window.addEventListener("rewaa_exams_updated", handleExamsUpdate);
    return () => window.removeEventListener("rewaa_exams_updated", handleExamsUpdate);
  }, [locale]);

  const isExamPublished = (examId?: string) => {
    if (!examId) return false;
    const found = exams.find((e) => e.id === examId);
    return found ? found.publishStatus === "published" : false;
  };

  const getExamTitle = (examId?: string, fallbackTitle?: string) => {
    if (!examId) return fallbackTitle || t("lesson.linkedExam");
    const found = exams.find((e) => e.id === examId);
    return found?.title || fallbackTitle || t("lesson.linkedExam");
  };

  const formatGrade = (gradeKey: string) => {
    return tNew.has(`grades.${gradeKey}` as Parameters<typeof tNew.has>[0])
      ? tNew(`grades.${gradeKey}` as Parameters<typeof tNew>[0])
      : gradeKey;
  };

  const formatSubject = (subjectKey: string) => {
    return tNew.has(`subjects.${subjectKey}` as Parameters<typeof tNew.has>[0])
      ? tNew(`subjects.${subjectKey}` as Parameters<typeof tNew>[0])
      : subjectKey;
  };

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

  const allAttachments: LessonAttachment[] = selectedLesson
    ? [
        ...(selectedLesson.pdfFiles || []),
        ...(selectedLesson.imageFiles || []),
        ...(selectedLesson.attachments || []),
      ]
    : [];

  const isCompleted = selectedLesson ? completedLessons.includes(selectedLesson.id) : false;
  const isVideoLesson =
    selectedLesson && selectedLesson.type !== "text" && !!selectedLesson.lectureVideoLink;
  const embedUrl = isVideoLesson ? getEmbedUrl(selectedLesson.lectureVideoLink) : null;

  const firstLessonId = course.sections.flatMap((s) => s.lessons)[0]?.id;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* CASE 1: NO LESSON SELECTED (Course Overview Information) */}
        {!selectedLesson ? (
          <div className="space-y-6">
            {/* Header Navigation Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0"
                >
                  <Link href="/student-dashboard/courses">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-1 cursor-default">
                        {course.title}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm text-xs">
                      {course.title}
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("overview.courseOverview")}
                  </p>
                </div>
              </div>

              {firstLessonId && (
                <Button
                  type="button"
                  onClick={() => onSelectLesson(firstLessonId)}
                  className="gap-2 font-semibold shadow-xs shrink-0"
                >
                  <Play className="size-3.5 fill-current rtl:rotate-180" />
                  <span className="hidden sm:inline">{t("overview.startFirstLesson")}</span>
                  <span className="sm:hidden">{t("overview.startFirstLesson").split(" ")[0]}</span>
                </Button>
              )}
            </div>

            {/* Cover Hero Banner */}
            <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-muted border border-border/80 shadow-xs">
              {course.coverImage ? (
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                  {course.title.slice(0, 3)}
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

              <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 flex flex-wrap items-end justify-between gap-3 text-white">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                      {formatGrade(course.grade)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-black/40 text-white border-white/20 backdrop-blur-xs text-xs font-semibold"
                    >
                      {formatSubject(course.subject)}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white line-clamp-2 cursor-default">
                        {course.title}
                      </h2>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm text-xs">
                      {course.title}
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
                  {teacherImage ? (
                    <Image
                      src={teacherImage}
                      alt={course.teacherName}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("overview.instructor")}</div>
                  <div className="text-sm font-bold text-foreground">{course.teacherName}</div>
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
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border/80 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <BookOpen className="size-5 text-primary" />
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t("overview.syllabus")}
                </h3>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none">
                <MarkdownViewer content={course.description} isRtl={isRtl} />
              </div>
            </div>
          </div>
        ) : (
          /* CASE 2: LESSON IS SELECTED */
          <div className="space-y-6">
            {/* Top Row: Back to Course Overview & Completion Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onSelectLesson(null)}
                  className="h-9 w-9 rounded-full shrink-0"
                  title={t("backToCourses")}
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {isVideoLesson ? t("itemTypes.video") : t("itemTypes.reading")}
                    </Badge>
                    {isCompleted && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1 text-[11px]">
                        <CheckCircle2 className="size-3" />
                        <span>{t("lesson.completed")}</span>
                      </Badge>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate mt-1 cursor-default">
                        {selectedLesson.title}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-md text-xs">
                      {selectedLesson.title}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Checkbox "Completed" */}
              <div className="flex items-center gap-3 self-end sm:self-center bg-muted/40 px-3.5 py-2 rounded-xl border border-border/60 shrink-0">
                <Checkbox
                  id="lesson-completion-toggle"
                  checked={isCompleted}
                  onCheckedChange={() => onToggleLessonCompletion(selectedLesson.id)}
                  className="size-4.5 rounded-lg data-checked:bg-emerald-600 data-checked:border-emerald-600"
                />
                <label
                  htmlFor="lesson-completion-toggle"
                  className="text-xs sm:text-sm font-bold text-foreground cursor-pointer select-none"
                >
                  {t("lesson.completed")}
                </label>
              </div>
            </div>

            {/* Subcase 2A: Lesson has Video */}
            {isVideoLesson && (
              <div className="space-y-3">
                <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black/95 flex items-center justify-center border border-border/80 shadow-md">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={selectedLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3 text-white">
                      <Video className="size-12 mx-auto text-primary animate-pulse" />
                      <p className="text-sm font-medium">{selectedLesson.title}</p>
                      <a
                        href={selectedLesson.lectureVideoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <span>Open External Video</span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unified Tabs Container for Lesson Details: Description, Attachments, Linked Exam */}
            {(() => {
              const currentSection = course.sections.find((s) =>
                s.lessons.some((l) => l.id === selectedLesson.id),
              );
              const hasSectionExam = Boolean(
                currentSection?.isLinkedToExam &&
                currentSection?.linkedExamId &&
                isExamPublished(currentSection.linkedExamId),
              );
              const hasLessonDirectExam = Boolean(
                selectedLesson.isLinkedToExam &&
                selectedLesson.linkedExamId &&
                isExamPublished(selectedLesson.linkedExamId) &&
                selectedLesson.linkedExamId !== currentSection?.linkedExamId,
              );
              const hasLinkedExam = hasSectionExam || hasLessonDirectExam;

              const isSectionExamPassed =
                hasSectionExam && currentSection?.linkedExamId
                  ? passedExamIds.includes(currentSection.linkedExamId)
                  : false;
              const sectionExamTitle =
                hasSectionExam && currentSection?.linkedExamId
                  ? getExamTitle(currentSection.linkedExamId, currentSection.linkedExamTitle)
                  : "";

              const isLessonDirectExamPassed =
                hasLessonDirectExam && selectedLesson.linkedExamId
                  ? passedExamIds.includes(selectedLesson.linkedExamId)
                  : false;
              const lessonDirectExamTitle =
                hasLessonDirectExam && selectedLesson.linkedExamId
                  ? getExamTitle(selectedLesson.linkedExamId, selectedLesson.linkedExamTitle)
                  : "";

              const examCount = (hasSectionExam ? 1 : 0) + (hasLessonDirectExam ? 1 : 0);

              return (
                <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs overflow-hidden">
                  <Tabs defaultValue="description" className="w-full">
                    {/* Tabs Header */}
                    <div className="p-3 sm:p-4 border-b border-border/80 bg-muted/20">
                      <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/80 gap-1 h-auto scrollbar-none">
                        <TabsTrigger
                          value="description"
                          className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <FileText className="size-4" />
                          <span>{t("lesson.description")}</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="attachments"
                          className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Paperclip className="size-4" />
                          <span>{t("lesson.attachedFiles")}</span>
                          {allAttachments.length > 0 && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                              {allAttachments.length}
                            </span>
                          )}
                        </TabsTrigger>

                        {hasLinkedExam && (
                          <TabsTrigger
                            value="exams"
                            className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                          >
                            <FileSpreadsheet className="size-4" />
                            <span>{t("lesson.linkedExam")}</span>
                            {examCount > 0 && (
                              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                                {examCount}
                              </span>
                            )}
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </div>

                    {/* Tab Contents */}
                    <div className="p-6 sm:p-8">
                      {/* TAB 1: Description / Notes */}
                      <TabsContent
                        value="description"
                        className="space-y-4 mt-0 focus-visible:outline-hidden"
                      >
                        {selectedLesson.description || selectedLesson.writtenText ? (
                          <div className="prose prose-sm sm:prose-base max-w-none">
                            <MarkdownViewer
                              content={
                                selectedLesson.description || selectedLesson.writtenText || ""
                              }
                              isRtl={isRtl}
                            />
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                            {t("lesson.noMediaOrNotes")}
                          </p>
                        )}
                      </TabsContent>

                      {/* TAB 2: Attached Files */}
                      <TabsContent
                        value="attachments"
                        className="space-y-4 mt-0 focus-visible:outline-hidden"
                      >
                        {allAttachments.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allAttachments.map((file, idx) => (
                              <div
                                key={file.id || `file-${idx}`}
                                className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                                    <FileText className="size-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-xs sm:text-sm font-bold text-foreground truncate cursor-default">
                                          {file.title}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs text-xs">
                                        {file.title}
                                      </TooltipContent>
                                    </Tooltip>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      {t("lesson.fileSize", {
                                        size: formatFileSize(file.sizeInBytes),
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs font-semibold shrink-0"
                                >
                                  <a
                                    href={file.fileUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="size-3.5" />
                                    <span>{t("lesson.downloadFile")}</span>
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                            {locale === "ar"
                              ? "لا توجد ملفات مرفقة لهذا الدرس."
                              : "No attachments available for this lesson."}
                          </p>
                        )}
                      </TabsContent>

                      {/* TAB 3: Linked Exam(s) */}
                      {hasLinkedExam && (
                        <TabsContent
                          value="exams"
                          className="space-y-4 mt-0 focus-visible:outline-hidden"
                        >
                          {/* Section Linked Exam */}
                          {hasSectionExam && currentSection?.linkedExamId && (
                            <div
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border text-foreground transition-all",
                                isSectionExamPassed
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-amber-500/10 border-amber-500/30",
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={cn(
                                    "p-3 rounded-xl shrink-0",
                                    isSectionExamPassed
                                      ? "bg-emerald-500/20 text-emerald-700"
                                      : "bg-amber-500/20 text-amber-700",
                                  )}
                                >
                                  <FileSpreadsheet className="size-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={cn(
                                        "text-xs font-semibold",
                                        isSectionExamPassed ? "text-emerald-700" : "text-amber-700",
                                      )}
                                    >
                                      {t("lesson.linkedExam")}
                                    </span>
                                    {isSectionExamPassed ? (
                                      <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                        {t("locked.examPassed")}
                                      </Badge>
                                    ) : currentSection.isRequiredPassExamForNextSection ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-500/20 border-amber-500/30 text-amber-800 text-[10px] px-1.5 py-0 font-bold"
                                      >
                                        {t("locked.examRequired")}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm sm:text-base font-bold text-foreground mt-1 truncate cursor-default">
                                        {sectionExamTitle}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-md text-xs">
                                      {sectionExamTitle}
                                    </TooltipContent>
                                  </Tooltip>
                                  {currentSection.isRequiredPassExamForNextSection &&
                                    !isSectionExamPassed && (
                                      <p className="text-[11px] text-amber-700/90 mt-0.5">
                                        {t("locked.mustPassExam")}
                                      </p>
                                    )}
                                </div>
                              </div>

                              <Button
                                asChild
                                className={cn(
                                  "font-bold gap-2 shadow-xs shrink-0 self-end sm:self-center",
                                  isSectionExamPassed
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-amber-600 hover:bg-amber-700 text-white",
                                )}
                              >
                                <Link
                                  href={`/student-dashboard/exams/${currentSection.linkedExamId}`}
                                >
                                  <span>
                                    {isSectionExamPassed
                                      ? t("lesson.takeLinkedExam")
                                      : t("locked.takeExamCta")}
                                  </span>
                                  <FileCheck className="size-4 rtl:rotate-180" />
                                </Link>
                              </Button>
                            </div>
                          )}

                          {/* Direct Lesson Linked Exam (if any) */}
                          {hasLessonDirectExam && selectedLesson.linkedExamId && (
                            <div
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border text-foreground",
                                isLessonDirectExamPassed
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-amber-500/10 border-amber-500/30",
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={cn(
                                    "p-3 rounded-xl shrink-0",
                                    isLessonDirectExamPassed
                                      ? "bg-emerald-500/20 text-emerald-700"
                                      : "bg-amber-500/20 text-amber-700",
                                  )}
                                >
                                  <FileSpreadsheet className="size-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-amber-700">
                                    {t("lesson.linkedExam")}
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate cursor-default">
                                        {lessonDirectExamTitle}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-md text-xs">
                                      {lessonDirectExamTitle}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>

                              <Button
                                asChild
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shadow-xs shrink-0 self-end sm:self-center"
                              >
                                <Link
                                  href={`/student-dashboard/exams/${selectedLesson.linkedExamId}`}
                                >
                                  <span>{t("lesson.takeLinkedExam")}</span>
                                  <FileCheck className="size-4 rtl:rotate-180" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                      )}
                    </div>
                  </Tabs>
                </div>
              );
            })()}

            {/* Bottom Lesson Navigation (Previous / Next Lesson) */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onPreviousLesson}
                disabled={!hasPreviousLesson}
                className="gap-2 font-semibold text-xs sm:text-sm rounded-xl py-5 shadow-xs"
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
                <span>{t("lesson.previousLesson")}</span>
              </Button>

              {isNextLessonLocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        type="button"
                        onClick={onNextLesson}
                        className="gap-2 font-semibold text-xs sm:text-sm rounded-xl py-5 shadow-xs bg-amber-600/90 hover:bg-amber-600 text-white"
                      >
                        <Lock className="size-3.5" />
                        <span>{t("lesson.nextLesson")}</span>
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {t("locked.tooltip")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  type="button"
                  onClick={onNextLesson}
                  disabled={!hasNextLesson}
                  className="gap-2 font-semibold text-xs sm:text-sm rounded-xl py-5 shadow-xs"
                >
                  <span>{t("lesson.nextLesson")}</span>
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
