/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileQuestion,
  Pencil,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { DashboardCard } from "../overview/dashboard-card";

import { getStoredExams } from "@/lib/exams-storage";
import { Exam, QuestionDifficulty, QuestionKind } from "@/types/exam";

interface ExamDetailsClientProps {
  examId: string;
}

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  easy: "bg-green-100 text-green-700 border-green-300/40",
  medium: "bg-amber-100 text-amber-700 border-amber-300/40",
  hard: "bg-red-100 text-red-700 border-red-300/40",
};

export function ExamDetailsClient({ examId }: ExamDetailsClientProps) {
  const locale = useLocale();
  const t = useTranslations("exams");
  const tDetails = useTranslations("exams.details");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

  const [exam, setExam] = React.useState<Exam | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const stored = getStoredExams(locale);
    const found = stored.find((e) => e.id === examId);
    if (found) {
      setExam(found);
      setTimeout(() => {
        if (found.examSections && found.examSections.length > 0) {
          setActiveSection(found.examSections[0].id);
        }
      }, 100);
    }
    setIsLoading(false);
  }, [examId, locale]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading exam details...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t("empty.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/exams`}>
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {tDetails("backToExams")}
          </Link>
        </Button>
      </div>
    );
  }

  const formatGrade = (g?: string) => {
    if (!g) return "";
    try {
      return tGrades(g);
    } catch {
      return g;
    }
  };

  const formatSubject = (s?: string) => {
    if (!s) return "";
    try {
      return tSubjects(s);
    } catch {
      return s;
    }
  };

  const formatVenue = (v?: string) => {
    if (v === "online") return tCourses("venue.online");
    if (v === "center") return tCourses("venue.center");
    return tCourses("venue.all");
  };

  const formatCategory = (cat: string) => {
    const key = cat as Parameters<typeof t.has>[0];
    return t.has(`category.${key}` as Parameters<typeof t.has>[0])
      ? t(`category.${key}` as Parameters<typeof t>[0])
      : cat;
  };

  const formatDifficulty = (d: QuestionDifficulty) =>
    tDetails(`questions.difficulty.${d}` as Parameters<typeof tDetails>[0]);

  const formatKind = (k: QuestionKind) =>
    tDetails(`questions.kind.${k}` as Parameters<typeof tDetails>[0]);

  const isRtl = locale === "ar";

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header Row with Standard Round Back Button ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard/exams`}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {exam.title}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>
                {[formatSubject(exam.subject), formatGrade(exam.grade)].filter(Boolean).join(" • ")}
              </span>
              <span>•</span>
              <span className="font-medium text-foreground">{exam.teacherName}</span>
            </p>
          </div>
        </div>

        <Button
          asChild
          size="default"
          className="gap-2 shrink-0 self-start sm:self-auto shadow-xs font-semibold"
        >
          <Link href={`/${locale}/dashboard/exams/${exam.id}/edit`}>
            <Pencil className="h-4 w-4" />
            <span>{tDetails("editExam")}</span>
          </Link>
        </Button>
      </div>

      {/* ── Main 2-Column Grid (8 Cols / 4 Cols) ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Card */}
          <DashboardCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{tDetails("overview")}</span>
              </h2>
              <Badge variant="secondary" className="text-xs">
                {formatCategory(exam.category)}
              </Badge>
            </div>

            {exam.description ? (
              <MarkdownViewer content={exam.description} isRtl={isRtl} />
            ) : (
              <p className="text-sm text-muted-foreground italic">{tDetails("noDescription")}</p>
            )}
          </DashboardCard>

          {/* Sections & Questions Bank Card */}
          <DashboardCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-primary" />
                <span>{tDetails("sectionsTitle")}</span>
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                {tDetails("questionsCount", { count: exam.numberOfQuestions })}
              </span>
            </div>

            {!exam.examSections || exam.examSections.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                {tDetails("noSections")}
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                value={activeSection}
                onValueChange={setActiveSection}
                className="w-full flex flex-col gap-3"
              >
                {exam.examSections.map((sec) => (
                  <AccordionItem
                    key={sec.id}
                    value={sec.id}
                    className="border border-border/60 rounded-xl px-4 py-1 bg-muted/20 data-[state=open]:bg-muted/40 transition-colors"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-start gap-2 pe-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{sec.title}</h3>
                          {sec.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">{sec.subtitle}</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0 self-start sm:self-auto"
                        >
                          {tDetails("questionsCount", { count: sec.questions.length })}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 flex flex-col gap-3 border-t border-border/40 mt-2">
                      {sec.questions.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-lg bg-background border border-border/50 flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="size-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                {qIdx + 1}
                              </span>
                              <h4 className="text-xs font-bold text-foreground">
                                {q.questionName}
                              </h4>
                              <Badge variant="secondary" className="text-[10px]">
                                {tDetails(
                                  `questions.type.${q.type}` as Parameters<typeof tDetails>[0],
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${DIFFICULTY_COLORS[q.difficulty]}`}
                              >
                                {formatDifficulty(q.difficulty)}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {formatKind(q.questionType)}
                              </Badge>
                            </div>
                            <span className="text-xs font-semibold text-primary">
                              {tDetails("questions.gradePoints", { points: q.grade })}
                            </span>
                          </div>

                          <div className="text-xs text-foreground/90">
                            <MarkdownViewer content={q.questionContent} isRtl={isRtl} />
                          </div>

                          {/* MCQ Options if present */}
                          {q.type === "mcq" && q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`p-2 rounded-md border text-xs flex items-center gap-2 ${
                                    opt.id === q.modelAnswer
                                      ? "bg-green-500/10 border-green-500/30 font-semibold"
                                      : "bg-muted/30 border-border/40 text-foreground/80"
                                  }`}
                                >
                                  {opt.id === q.modelAnswer && (
                                    <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                                  )}
                                  <span>{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Model Answer for Non-MCQ */}
                          {q.type !== "mcq" && q.modelAnswer && (
                            <div className="p-2.5 rounded-md bg-green-500/10 border border-green-500/30 text-xs text-green-700 space-y-1">
                              <span className="font-semibold block">
                                {tDetails("questions.modelAnswer")}:
                              </span>
                              <p className="font-medium">{q.modelAnswer}</p>
                            </div>
                          )}

                          {/* Explanation if present */}
                          {q.hasAnswerExplanation && q.answerExplanation && (
                            <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20 text-xs text-foreground/80 space-y-1">
                              <span className="font-semibold text-primary flex items-center gap-1">
                                <Sparkles className="size-3" />
                                {tDetails("questions.explanation")}
                              </span>
                              <p>{q.answerExplanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </DashboardCard>
        </div>

        {/* Right Column (4 Cols - Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Key Statistics Grid (2x2) */}
          <DashboardCard className="p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground border-b border-border/60 pb-3">
              {tDetails("stats.totalQuestions")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                <span className="text-xs text-muted-foreground block">
                  {tDetails("stats.totalQuestions")}
                </span>
                <span className="text-xl font-bold text-foreground flex items-center gap-1.5">
                  <FileQuestion className="size-4 text-blue-500" />
                  {exam.numberOfQuestions}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                <span className="text-xs text-muted-foreground block">
                  {tDetails("stats.totalStudents")}
                </span>
                <span className="text-xl font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-4 text-purple-500" />
                  {exam.numberOfStudents}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                <span className="text-xs text-muted-foreground block">
                  {tDetails("stats.successRate")}
                </span>
                <span className="text-xl font-bold text-green-600 flex items-center gap-1.5">
                  <TrendingUp className="size-4" />
                  {exam.successRate}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                <span className="text-xs text-muted-foreground block">
                  {tDetails("stats.timesUsed")}
                </span>
                <span className="text-xl font-bold text-foreground flex items-center gap-1.5">
                  <RefreshCw className="size-4 text-amber-500" />
                  {exam.timesUsed}
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Exam Configuration & Metadata Sidebar */}
          <DashboardCard className="p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground border-b border-border/60 pb-3">
              {tDetails("metadata.title")}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{tDetails("metadata.teacher")}</span>
                <span className="font-semibold text-foreground">{exam.teacherName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{tDetails("metadata.category")}</span>
                <span className="font-semibold text-foreground">
                  {formatCategory(exam.category)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{tDetails("metadata.type")}</span>
                <span className="font-semibold text-foreground">
                  {exam.examType === "independent"
                    ? t("table.independent")
                    : t("table.courseLinked")}
                </span>
              </div>

              {exam.examType === "independent" && exam.venue && (
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{tDetails("metadata.venue")}</span>
                  <span className="font-semibold text-foreground">{formatVenue(exam.venue)}</span>
                </div>
              )}

              {exam.examType === "course-dependent" && exam.courseId && (
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{tDetails("metadata.linkedCourse")}</span>
                  <Link
                    href={`/${locale}/dashboard/courses/${exam.courseId}/edit`}
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="size-3" />
                    <span>{exam.courseTitle || exam.courseId}</span>
                  </Link>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{tDetails("metadata.triesAllowed")}</span>
                <span className="font-semibold text-foreground">{exam.triesAllowed}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{tDetails("metadata.duration")}</span>
                <span className="font-semibold text-foreground">
                  {tDetails("metadata.minutesSuffix", { minutes: exam.durationMinutes })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  {tDetails("metadata.passingPercentage")}
                </span>
                <span className="font-semibold text-foreground">{exam.passingPercentage}%</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  {tDetails("metadata.showModelAnswers")}
                </span>
                <span className="font-semibold text-foreground">
                  {exam.showModelAnswers ? tDetails("metadata.yes") : tDetails("metadata.no")}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  {tDetails("metadata.randomizeQuestions")}
                </span>
                <span className="font-semibold text-foreground">
                  {exam.randomizeQuestionsOrder
                    ? tDetails("metadata.yes")
                    : tDetails("metadata.no")}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{tDetails("metadata.randomizeMCQ")}</span>
                <span className="font-semibold text-foreground">
                  {exam.randomizeMCQChoices ? tDetails("metadata.yes") : tDetails("metadata.no")}
                </span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
