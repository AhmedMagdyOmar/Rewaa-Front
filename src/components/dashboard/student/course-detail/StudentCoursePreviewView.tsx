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
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { getStoredExams } from "@/lib/exams-storage";
import { Course, LessonAttachment } from "@/types/course";
import { Exam } from "@/types/exam";
import { Teacher } from "@/types/settings";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Globe,
  Globe2,
  House,
  Lock,
  Paperclip,
  Sparkles,
  Tag,
  User,
  Users,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";

interface StudentCoursePreviewViewProps {
  course: Course;
  matchedTeacher?: Teacher;
  onEnroll: (courseId: string) => void;
  isEnrolling?: boolean;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function StudentCoursePreviewView({
  course,
  matchedTeacher,
  onEnroll,
  isEnrolling = false,
}: StudentCoursePreviewViewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("studentDashboard.coursePreview");
  const tNew = useTranslations("courses.new");
  const tCourses = useTranslations("courses");

  // Load exams to get exact question counts and exam titles
  const [exams, setExams] = React.useState<Exam[]>([]);

  React.useEffect(() => {
    setExams(getStoredExams(locale));
    const handleExamsUpdate = () => setExams(getStoredExams(locale));
    window.addEventListener("rewaa_exams_updated", handleExamsUpdate);
    return () => window.removeEventListener("rewaa_exams_updated", handleExamsUpdate);
  }, [locale]);

  // Format grade & subject safely
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

  // Pricing & Discounts
  const originalPrice = course.price;
  const isFree = course.isFree || originalPrice === 0;

  // Calculate discounted price if offer exists
  const calculatedDiscountedPrice = React.useMemo(() => {
    if (isFree) return 0;
    if (!course.hasOffer || !course.offerPercentage) return originalPrice;

    // Parse percentage (e.g., "15% خصم", "20% OFF", "20%")
    const match = course.offerPercentage.match(/(\d+)%/);
    if (match && match[1]) {
      const discountPct = parseInt(match[1], 10);
      const discounted = originalPrice * (1 - discountPct / 100);
      return Math.round(discounted);
    }
    return originalPrice;
  }, [isFree, course.hasOffer, course.offerPercentage, originalPrice]);

  const formatPrice = (price: number) => {
    if (isFree || price === 0) {
      return t("free");
    }
    const currencyStr = isRtl
      ? course.currency === "EGP"
        ? tCourses("card.egp")
        : course.currency
      : course.currency;
    return `${price.toLocaleString(isRtl ? "ar-EG" : "en-US")} ${currencyStr}`;
  };
  // Sanitize course sections & lessons (exclude draft sections & lessons)
  const sanitizedSections = React.useMemo(() => {
    return (course.sections || [])
      .filter((s) => !s.isDraft && s.status !== "draft")
      .map((s) => ({
        ...s,
        lessons: (s.lessons || []).filter((l) => l.publishStatus !== "draft"),
      }));
  }, [course.sections]);

  // Aggregated Course Contents Stats
  const flatLessons = React.useMemo(() => {
    return sanitizedSections.flatMap((s) => s.lessons);
  }, [sanitizedSections]);

  // All attached files across all published lessons in the course
  const allAttachments: LessonAttachment[] = React.useMemo(() => {
    return flatLessons.flatMap((l) => [
      ...(l.pdfFiles || []),
      ...(l.imageFiles || []),
      ...(l.attachments || []),
    ]);
  }, [flatLessons]);

  // Helper to check if linked exam exists
  const isExamPublished = React.useCallback(
    (examId?: string) => {
      if (!examId) return false;
      const found = exams.find((e) => e.id === examId);
      return Boolean(found);
    },
    [exams],
  );

  // Exam stats (only linked exams)
  const linkedExamIds = React.useMemo(() => {
    const ids = new Set<string>();
    sanitizedSections.forEach((sec) => {
      if (sec.isLinkedToExam && sec.linkedExamId && isExamPublished(sec.linkedExamId)) {
        ids.add(sec.linkedExamId);
      }
    });
    flatLessons.forEach((l) => {
      if (l.isLinkedToExam && l.linkedExamId && isExamPublished(l.linkedExamId)) {
        ids.add(l.linkedExamId);
      }
    });
    return Array.from(ids);
  }, [sanitizedSections, flatLessons, isExamPublished]);

  const totalExamsCount = linkedExamIds.length;

  const totalQuestionsCount = React.useMemo(() => {
    let count = 0;
    linkedExamIds.forEach((examId) => {
      const exam = exams.find((e) => e.id === examId);
      if (exam) {
        const qCount = exam.examSections.reduce((acc, es) => acc + es.questions.length, 0);
        count += qCount;
      }
    });
    // Fallback if exams not loaded yet or mock default
    return count > 0 ? count : totalExamsCount * 15;
  }, [linkedExamIds, exams, totalExamsCount]);

  // Duration in hours
  const totalVideoHours = course.durationHours || Math.max(1, Math.round(flatLessons.length * 1.5));

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full space-y-6">
        {/* Header Back Button Row */}
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href="/student-dashboard/courses/explore">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <span className="text-sm font-medium text-muted-foreground">{t("backToExplore")}</span>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ────────────────────────────────────────────────────────────────────────
              COLUMN 1: MAIN INFO & TABS (8 Cols on LG)
          ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Header Badges, Title & Teacher info */}
            <div className="space-y-4 bg-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs">
              {/* Badges for Grade and Subject */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-bold text-xs px-3 py-1">
                  {formatGrade(course.grade)}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-muted/60 text-foreground border-border/80 text-xs font-semibold px-3 py-1"
                >
                  {formatSubject(course.subject)}
                </Badge>
                {course.venue && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium text-muted-foreground px-2.5 py-1"
                  >
                    {tCourses(`venue.${course.venue}`)}
                  </Badge>
                )}
              </div>

              {/* Course Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {course.title}
              </h1>

              {/* Teacher Info + Number of Enrolled Students */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-border/60">
                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="relative size-11 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                    {matchedTeacher?.image ? (
                      <Image
                        src={matchedTeacher.image}
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
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {tCourses("details.teacher")}
                    </div>
                    <div className="text-sm font-bold text-foreground">{course.teacherName}</div>
                  </div>
                </div>

                {/* Enrolled Students Count */}
                <div className="flex items-center gap-2 border-s border-border/60 ps-4 sm:ps-6">
                  <Users className="size-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground">
                    {t("studentsEnrolled", { count: course.numberOfParticipants })}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Tabbed Content Container */}
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs overflow-hidden">
              <Tabs defaultValue="sections" className="w-full">
                {/* Scrollable Tabs List */}
                <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20">
                  <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/80 gap-1 h-auto scrollbar-none">
                    <TabsTrigger
                      value="sections"
                      className="gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <BookOpen className="size-4" />
                      <span>{t("tabs.sections")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="description"
                      className="gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <FileText className="size-4" />
                      <span>{t("tabs.description")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="attachments"
                      className="gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Paperclip className="size-4" />
                      <span>{t("tabs.attachments")}</span>
                      {allAttachments.length > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                          {allAttachments.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 sm:p-8">
                  {/* ─────────────────────────────────────────────────────────────
                      TAB 1: SECTIONS & CONTENT PREVIEW (NO ACTIVE LINKS)
                  ───────────────────────────────────────────────────────────── */}
                  <TabsContent
                    value="sections"
                    className="space-y-4 mt-0 focus-visible:outline-hidden"
                  >
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-foreground">
                      <Lock className="size-4 text-primary mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{t("sectionsTab.previewNotice")}</p>
                    </div>

                    {sanitizedSections.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                        {tCourses("details.noSections")}
                      </div>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue="preview-section-0"
                        className="w-full space-y-3"
                      >
                        {sanitizedSections.map((section, sIdx) => {
                          const hasPublishedExam =
                            section.isLinkedToExam &&
                            !!section.linkedExamId &&
                            isExamPublished(section.linkedExamId);

                          return (
                            <AccordionItem
                              key={section.id}
                              value={`preview-section-${sIdx}`}
                              className="border border-border/70 rounded-xl px-4 py-1 bg-muted/20 data-[state=open]:bg-muted/40 transition-colors"
                            >
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-start gap-2 pe-3">
                                  <div>
                                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                                      {section.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {t("sectionsTab.lessonsCount", {
                                        count: section.lessons.length,
                                      })}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {hasPublishedExam && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-primary/10 text-primary border-primary/20"
                                      >
                                        {t("sectionsTab.examBadge")}
                                      </Badge>
                                    )}
                                    {section.isRequiredPassExamForNextSection &&
                                      hasPublishedExam && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        >
                                          {t("sectionsTab.requiredExamBadge")}
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                              </AccordionTrigger>

                              <AccordionContent className="pt-2 pb-4 space-y-2.5 border-t border-border/40 mt-2">
                                {section.lessons.map((lesson, lIdx) => (
                                  <div
                                    key={lesson.id || `l-${lIdx}`}
                                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 gap-3"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                                        {lesson.type === "text" ? (
                                          <FileText className="size-4 text-emerald-500" />
                                        ) : (
                                          <Video className="size-4 text-primary" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                          {lesson.title}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                          <span>
                                            {lesson.type === "text"
                                              ? t("sectionsTab.textLesson")
                                              : t("sectionsTab.videoLesson")}
                                          </span>
                                          {((lesson.pdfFiles?.length || 0) > 0 ||
                                            (lesson.attachments?.length || 0) > 0) && (
                                            <>
                                              <span>•</span>
                                              <span className="flex items-center gap-1">
                                                <Paperclip className="size-3" />
                                                <span>
                                                  {(lesson.pdfFiles?.length || 0) +
                                                    (lesson.attachments?.length || 0)}
                                                </span>
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Locked Status indicator (No link) */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
                                      <Lock className="size-3 text-muted-foreground" />
                                      <span className="hidden sm:inline">
                                        {t("sectionsTab.lockedLesson")}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Section Linked Exam (if published) */}
                                {hasPublishedExam && (
                                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 shrink-0">
                                        <FileSpreadsheet className="size-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs sm:text-sm font-bold text-amber-900 truncate">
                                          {section.linkedExamTitle || t("sectionsTab.examBadge")}
                                        </div>
                                        <div className="text-[11px] text-amber-700/80">
                                          {t("sectionsTab.requiredExamBadge")}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium shrink-0">
                                      <Lock className="size-3" />
                                      <span className="hidden sm:inline">
                                        {t("sectionsTab.lockedLesson")}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </TabsContent>

                  {/* ─────────────────────────────────────────────────────────────
                      TAB 2: MARKDOWN DESCRIPTION
                  ───────────────────────────────────────────────────────────── */}
                  <TabsContent
                    value="description"
                    className="space-y-4 mt-0 focus-visible:outline-hidden"
                  >
                    <div className="prose prose-sm sm:prose-base max-w-none">
                      {course.description ? (
                        <MarkdownViewer content={course.description} isRtl={isRtl} />
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                          {t("descriptionTab.noDescription")}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* ─────────────────────────────────────────────────────────────
                      TAB 3: ATTACHMENTS PREVIEW (NO DOWNLOAD LINKS)
                  ───────────────────────────────────────────────────────────── */}
                  <TabsContent
                    value="attachments"
                    className="space-y-4 mt-0 focus-visible:outline-hidden"
                  >
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">
                        {t("attachmentsTab.title")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("attachmentsTab.subtitle")}
                      </p>
                    </div>

                    {allAttachments.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                        {t("attachmentsTab.noAttachments")}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allAttachments.map((file, idx) => (
                          <div
                            key={file.id || `att-${idx}`}
                            className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 gap-3"
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
                                  {t("attachmentsTab.fileSize", {
                                    size: formatFileSize(file.sizeInBytes),
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40 mt-0.5">
                              <Lock className="size-3" />
                              <span className="hidden sm:inline">
                                {t("attachmentsTab.lockedFile")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────
              COLUMN 2: PURCHASE & COURSE CONTENTS SIDEBAR (4 Cols on LG)
          ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
            <div className="rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md overflow-hidden p-5 sm:p-6 space-y-6">
              {/* 1. Cover Image */}
              <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-xs">
                {course.coverImage ? (
                  <Image
                    src={course.coverImage}
                    alt={course.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                    {course.title.slice(0, 3)}
                  </div>
                )}
                {/* Venue Badge on top-end */}
                {course.venue && (
                  <div className="absolute top-3 inset-e-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-xs">
                      {course.venue === "online" ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : course.venue === "onsite" ? (
                        <House className="h-3.5 w-3.5" />
                      ) : (
                        <Globe2 className="h-3.5 w-3.5" />
                      )}
                      {course.venue === "hybrid"
                        ? tCourses("venue.hybrid")
                        : course.venue === "online"
                          ? tCourses("venue.online")
                          : tCourses("venue.onsite")}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* 2. Cost & Active Offers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    {course.hasOffer && !isFree && calculatedDiscountedPrice < originalPrice ? (
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                          {formatPrice(calculatedDiscountedPrice)}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground line-through decoration-destructive/70 decoration-2">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Offer badge at the other end */}
                  {course.hasOffer && course.offerPercentage && !isFree && (
                    <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2.5 py-1 gap-1 shadow-xs animate-pulse">
                      <Tag className="size-3" />
                      <span>{course.offerPercentage}</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* 3. CTA Button: Full Width "Enroll in Course" */}
              <Button
                type="button"
                size="lg"
                onClick={() => onEnroll(course.id)}
                disabled={isEnrolling}
                className="w-full font-bold text-base py-6 rounded-xl shadow-md cursor-pointer gap-2"
              >
                <Sparkles className="size-4.5 fill-current" />
                <span>{isEnrolling ? t("enrolling") : t("enrollInCourse")}</span>
              </Button>

              {/* 4. "Course Contents" Feature List */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("courseContents")}
                </h3>

                <ul className="space-y-3 text-xs sm:text-sm text-foreground">
                  {/* Number of hours of video */}
                  <li className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Clock className="size-4" />
                    </div>
                    <span className="font-medium">
                      {t("videoHours", { count: totalVideoHours })}
                    </span>
                  </li>

                  {/* Number of exams and number of questions */}
                  <li className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
                      <FileQuestion className="size-4" />
                    </div>
                    <span className="font-medium">
                      {t("examsAndQuestions", {
                        examsCount: totalExamsCount,
                        questionsCount: totalQuestionsCount,
                      })}
                    </span>
                  </li>

                  {/* Number of attached files */}
                  <li className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                      <Paperclip className="size-4" />
                    </div>
                    <span className="font-medium">
                      {t("attachedFilesCount", { count: allAttachments.length })}
                    </span>
                  </li>

                  {/* Duration of permitted access */}
                  <li className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <span className="font-medium">
                      {course.hasTimeLimit && course.timeLimitValue
                        ? t("accessDuration", { days: course.timeLimitValue })
                        : t("unlimitedAccess")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
