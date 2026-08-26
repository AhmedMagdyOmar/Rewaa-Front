/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { getStoredExams } from "@/lib/exams-storage";
import { getStoredLessons } from "@/lib/lessons-storage";
import { getPassedExams } from "@/lib/student-course-progress";
import { cn } from "@/lib/utils";
import { Lesson } from "@/types/course";
import { Exam } from "@/types/exam";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

interface StudentLessonDetailsClientProps {
  lessonId: string;
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

export function StudentLessonDetailsClient({ lessonId }: StudentLessonDetailsClientProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("studentDashboard.lessonDetailsPage");
  const tLessons = useTranslations("studentDashboard.lessonsPage");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

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

  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [passedExamIds, setPassedExamIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const lessons = getStoredLessons(locale);
    // Find lesson that is independent and published
    const found = lessons.find((l) => {
      if (l.id !== lessonId) return false;
      const isIndependent = !l.courseId && l.lessonCategory !== "course-dependent";
      const isPublished = l.publishStatus === "published" || (!l.publishStatus && !!l.title);
      return isIndependent && isPublished;
    });

    setLesson(found || null);
    setExams(getStoredExams(locale));
    setPassedExamIds(getPassedExams());
    setIsLoading(false);

    const handleExamsUpdate = () => setExams(getStoredExams(locale));
    const handlePassedExamsUpdate = () => setPassedExamIds(getPassedExams());

    window.addEventListener("rewaa_exams_updated", handleExamsUpdate);
    window.addEventListener("rewaa_student_passed_exams_updated", handlePassedExamsUpdate);

    return () => {
      window.removeEventListener("rewaa_exams_updated", handleExamsUpdate);
      window.removeEventListener("rewaa_student_passed_exams_updated", handlePassedExamsUpdate);
    };
  }, [lessonId, locale]);

  const isExamPublished = (examId?: string) => {
    if (!examId) return false;
    const found = exams.find((e) => e.id === examId);
    return Boolean(found);
  };

  const getExamTitle = (examId?: string, fallbackTitle?: string) => {
    if (!examId) return fallbackTitle || t("linkedExam");
    const found = exams.find((e) => e.id === examId);
    return found?.title || fallbackTitle || t("linkedExam");
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">Loading lesson...</div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-16 text-center space-y-4 bg-card rounded-2xl border border-dashed border-border/70 p-8 max-w-xl mx-auto my-8">
        <BookOpen className="size-12 mx-auto text-muted-foreground/40 mb-2" />
        <h2 className="text-xl font-bold text-foreground">{t("lessonNotFoundTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("lessonNotFoundDesc")}</p>
        <div className="pt-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/student-dashboard/lessons">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span>{t("backToLessons")}</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const allAttachments = lesson.pdfFiles || [];
  const hasLinkedExam = Boolean(
    lesson.isLinkedToExam && lesson.linkedExamId && isExamPublished(lesson.linkedExamId),
  );
  const isExamPassed =
    hasLinkedExam && lesson.linkedExamId ? passedExamIds.includes(lesson.linkedExamId) : false;
  const linkedExamTitle = hasLinkedExam
    ? getExamTitle(lesson.linkedExamId, lesson.linkedExamTitle)
    : "";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6 pb-12 w-full">
        {/* Top Header Row with Standard Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <Link href="/student-dashboard/lessons">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {lesson.type === "text" ? (
                    <>
                      <FileText className="h-3 w-3" />
                      {tLessons("card.textOnly")}
                    </>
                  ) : (
                    <>
                      <Video className="h-3 w-3" />
                      {tLessons("card.videoText")}
                    </>
                  )}
                </span>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  {tLessons("card.independent")}
                </span>

                {hasLinkedExam && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    <FileSpreadsheet className="h-3 w-3" />
                    {tLessons("card.examLinked")}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {lesson.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Grid: Details Content + Sidebar Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Content (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player if videoAndText */}
            {lesson.type !== "text" &&
              lesson.lectureVideoLink &&
              (() => {
                const embedUrl = getEmbedUrl(lesson.lectureVideoLink);
                return (
                  <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 p-3 sm:p-4 shadow-xs">
                    <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center border border-border/40">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={lesson.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center p-6 space-y-3 text-white">
                          <Video className="size-12 mx-auto text-primary animate-pulse" />
                          <p className="text-sm font-medium">{lesson.title}</p>
                          <a
                            href={lesson.lectureVideoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                          >
                            <span>{t("openExternal")}</span>
                            <ArrowRight className="size-3.5 rtl:rotate-180" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Tabbed Content Container (Matching StudentCourseMainView Tabs) */}
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs overflow-hidden">
              <Tabs defaultValue="description" className="w-full">
                {/* Tabs Header List */}
                <div className="p-3 sm:p-4 border-b border-border/80 bg-muted/20">
                  <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/80 gap-1 h-auto scrollbar-none">
                    <TabsTrigger
                      value="description"
                      className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <FileText className="size-4" />
                      <span>{t("writtenNotes")}</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="attachments"
                      className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Paperclip className="size-4" />
                      <span>{t("attachments")}</span>
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
                        <span>{t("linkedExam")}</span>
                        <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                          1
                        </span>
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
                    {lesson.description || lesson.writtenText ? (
                      <div className="prose prose-sm sm:prose-base max-w-none">
                        <MarkdownViewer
                          content={lesson.description || lesson.writtenText || ""}
                          isRtl={isRtl}
                        />
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                        {t("noMediaOrNotes")}
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
                            className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                                <FileText className="size-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm font-bold text-foreground wrap-break-word leading-snug">
                                  {file.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">
                                  {t("fileSize", {
                                    size: formatFileSize(file.sizeInBytes),
                                  })}
                                </div>
                              </div>
                            </div>

                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs font-semibold shrink-0 mt-0.5"
                            >
                              <a
                                href={file.fileUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="size-3.5" />
                                <span>{t("downloadPdf")}</span>
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                        {t("noAttachments")}
                      </p>
                    )}
                  </TabsContent>

                  {/* TAB 3: Linked Exam */}
                  {hasLinkedExam && lesson.linkedExamId && (
                    <TabsContent
                      value="exams"
                      className="space-y-4 mt-0 focus-visible:outline-hidden"
                    >
                      <div
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border text-foreground transition-all",
                          isExamPassed
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-amber-500/10 border-amber-500/30",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={cn(
                              "p-3 rounded-xl shrink-0",
                              isExamPassed
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
                                  isExamPassed ? "text-emerald-700" : "text-amber-700",
                                )}
                              >
                                {t("linkedExam")}
                              </span>
                              {isExamPassed && (
                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                  {t("examPassed")}
                                </Badge>
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm sm:text-base font-bold text-foreground mt-1 truncate cursor-default">
                                  {linkedExamTitle}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-md text-xs">
                                {linkedExamTitle}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        <Button
                          asChild
                          className={cn(
                            "font-bold gap-2 shadow-xs shrink-0 self-end sm:self-center",
                            isExamPassed
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-amber-600 hover:bg-amber-700 text-white",
                          )}
                        >
                          <Link href={`/student-dashboard/exams/${lesson.linkedExamId}`}>
                            <span>{t("takeLinkedExam")}</span>
                            <FileCheck className="size-4 rtl:rotate-180" />
                          </Link>
                        </Button>
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </div>
          </div>

          {/* Right / Sidebar Information Card (1 Column) */}
          <div className="space-y-6">
            <DashboardCard className="p-6 space-y-4 rounded-2xl">
              <h2 className="text-base font-bold text-foreground border-b border-border/60 pb-3">
                {t("metadata")}
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("category")}</span>
                  <span className="font-semibold text-foreground">
                    {tLessons("card.independent")}
                  </span>
                </div>

                {lesson.teacherName && (
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{t("teacher")}</span>
                    <span className="font-semibold text-foreground">{lesson.teacherName}</span>
                  </div>
                )}

                {(lesson.subject || lesson.grade) && (
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{t("subjectAndGrade")}</span>
                    <span className="font-semibold text-foreground">
                      {[formatSubject(lesson.subject), formatGrade(lesson.grade)]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("venue")}</span>
                  <span className="font-semibold text-foreground">{formatVenue(lesson.venue)}</span>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
