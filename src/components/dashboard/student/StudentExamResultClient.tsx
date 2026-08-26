/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { DashboardCard } from "../overview/dashboard-card";
import { Link } from "@/i18n/routing";
import { getStoredExams } from "@/lib/exams-storage";
import { getPassedExams, recordExamPass } from "@/lib/student-course-progress";
import { Exam, Question } from "@/types/exam";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileQuestion,
  Lightbulb,
  ListFilter,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { StudentExamIntroView } from "./StudentExamIntroView";
import { StudentExamTakingView } from "./StudentExamTakingView";

interface StudentExamResultClientProps {
  examId: string;
}

export type QuestionFilterType = "all" | "correct" | "incorrect";

interface EvaluatedQuestion {
  question: Question;
  sectionTitle: string;
  sectionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  earnedPoints: number;
}

export function StudentExamResultClient({ examId }: StudentExamResultClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("studentDashboard.examResultPage");
  const tExams = useTranslations("exams");
  const tDetails = useTranslations("exams.details");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

  const [exam, setExam] = React.useState<Exam | null>(null);
  const [passedExamIds, setPassedExamIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterType, setFilterType] = React.useState<QuestionFilterType>("all");
  const [activeMode, setActiveMode] = React.useState<"intro" | "taking" | "review" | null>(null);
  const [customAnswers, setCustomAnswers] = React.useState<Record<string, string> | null>(null);
  // Load Exam and Passed state
  React.useEffect(() => {
    const loadData = () => {
      const stored = getStoredExams(locale);
      const found = stored.find((e) => e.id === examId);
      setExam(found || null);
      setPassedExamIds(getPassedExams());
      setIsLoading(false);
    };

    loadData();
    window.addEventListener("rewaa_exams_updated", loadData);
    window.addEventListener("rewaa_student_passed_exams_updated", loadData);
    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener("rewaa_exams_updated", loadData);
      window.removeEventListener("rewaa_student_passed_exams_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [examId, locale]);

  // Format helpers
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

  const formatVenue = (v?: string) => {
    if (v === "online") return tCourses("venue.online");
    if (v === "center") return tCourses("venue.center");
    return tCourses("venue.all");
  };

  const formatCategory = (cat: string) => {
    const key = cat as Parameters<typeof tExams.has>[0];
    return tExams.has(`category.${key}` as Parameters<typeof tExams.has>[0])
      ? tExams(`category.${key}` as Parameters<typeof tExams>[0])
      : cat;
  };

  // Generate deterministic student answers & evaluations
  const evaluatedQuestions: EvaluatedQuestion[] = React.useMemo(() => {
    if (!exam || !exam.examSections) return [];

    const list: EvaluatedQuestion[] = [];
    let qGlobalIndex = 0;

    exam.examSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const isPassed = passedExamIds.includes(exam.id);
        // If passed, student gets ~85% correct answers. If not, ~45% correct.
        // Deterministic evaluation based on index so it is consistent.
        const shouldBeCorrect = isPassed
          ? qGlobalIndex % 5 !== 4 // 80-90% correct
          : qGlobalIndex % 2 === 0; // 50% correct

        // If student submitted actual answers in this session, use them; otherwise use deterministic mock
        let studentAns = customAnswers ? customAnswers[q.id] || "" : "";
        if (!customAnswers) {
          if (!shouldBeCorrect) {
            if (q.type === "mcq" && q.options && q.options.length > 1) {
              const wrongOpt = q.options.find((o) => o.id !== q.modelAnswer);
              studentAns = wrongOpt ? wrongOpt.id : "opt-wrong";
            } else if (q.type === "true/false") {
              studentAns = q.modelAnswer === "true" ? "false" : "true";
            } else {
              studentAns = isAr
                ? "إجابة الطالب التقريبية غير المكتملة"
                : "Incomplete student response";
            }
          } else {
            studentAns = q.modelAnswer;
          }
        }

        const isCorrect = studentAns.trim().toLowerCase() === q.modelAnswer.trim().toLowerCase();
        const earnedPoints = isCorrect ? q.grade || 5 : 0;

        list.push({
          question: q,
          sectionTitle: sec.title,
          sectionId: sec.id,
          studentAnswer: studentAns,
          isCorrect,
          earnedPoints,
        });

        qGlobalIndex++;
      });
    });

    return list;
  }, [exam, passedExamIds, isAr, customAnswers]);

  // Totals & KPI metrics
  const totalScore = React.useMemo(() => {
    if (!exam) return 30;
    let sum = 0;
    if (exam.examSections && exam.examSections.length > 0) {
      exam.examSections.forEach((sec) => {
        sec.questions.forEach((q) => {
          sum += q.grade || 5;
        });
      });
    }
    return sum > 0 ? sum : Math.max(20, exam.numberOfQuestions * 2);
  }, [exam]);

  const earnedScore = React.useMemo(() => {
    if (evaluatedQuestions.length === 0) {
      return Math.round((totalScore * (exam?.passingPercentage || 60)) / 100);
    }
    return evaluatedQuestions.reduce((acc, q) => acc + q.earnedPoints, 0);
  }, [evaluatedQuestions, totalScore, exam]);

  const percentage = React.useMemo(() => {
    if (totalScore <= 0) return 0;
    return Math.round((earnedScore / totalScore) * 100);
  }, [earnedScore, totalScore]);

  const isPassed = percentage >= (exam?.passingPercentage || 60);

  const correctQuestionsCount = evaluatedQuestions.filter((q) => q.isCorrect).length;
  const wrongQuestionsCount = evaluatedQuestions.length - correctQuestionsCount;

  // Filtered Questions by Section
  const filteredQuestions = React.useMemo(() => {
    if (filterType === "correct") {
      return evaluatedQuestions.filter((q) => q.isCorrect);
    }
    if (filterType === "incorrect") {
      return evaluatedQuestions.filter((q) => !q.isCorrect);
    }
    return evaluatedQuestions;
  }, [evaluatedQuestions, filterType]);

  // Initialize mode once data loads
  React.useEffect(() => {
    if (!isLoading && exam) {
      const passed = passedExamIds.includes(exam.id);
      if (activeMode === null) {
        setActiveMode(passed ? "review" : "intro");
      }
    }
  }, [isLoading, exam, passedExamIds, activeMode]);

  // Handle Starting Exam
  const handleStartExam = () => {
    setActiveMode("taking");
  };

  // Handle Exam Submission
  const handleSubmitExam = (submittedAnswers: Record<string, string>) => {
    if (!exam) return;
    setCustomAnswers(submittedAnswers);
    // Mark as passed/completed
    recordExamPass(exam.id, true);
    setActiveMode("review");
  };

  // Retake action handler
  const handleRetakeExam = () => {
    if (!exam) return;
    setCustomAnswers(null);
    setActiveMode("taking");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-pulse p-4">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="h-44 w-full bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-muted rounded-2xl" />
          <div className="lg:col-span-4 h-96 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center space-y-4">
        <FileQuestion className="size-12 text-muted-foreground/50 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">{tExams("empty.title")}</h2>
        <p className="text-sm text-muted-foreground">{tExams("empty.description")}</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/student-dashboard/exams?tab=completed">
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {t("backToExams")}
          </Link>
        </Button>
      </div>
    );
  }

  // ── Mode 1: Pre-Exam Briefing / Intro Screen ──────────────────────────────
  if (activeMode === "intro") {
    return (
      <StudentExamIntroView
        exam={exam}
        onStartExam={handleStartExam}
        formatSubject={formatSubject}
        formatGrade={formatGrade}
        formatCategory={formatCategory}
        formatVenue={formatVenue}
      />
    );
  }

  // ── Mode 2: Active Exam Taking Workspace ────────────────────────────────────
  if (activeMode === "taking") {
    return <StudentExamTakingView exam={exam} onSubmitExam={handleSubmitExam} />;
  }

  // ── Mode 3: Completed Exam Results & Review ─────────────────────────────────
  const completedDateStr = exam.createdAt
    ? new Date(exam.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. Top Header Row with Standard Round Back Button ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href="/student-dashboard/exams?tab=completed">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {exam.title}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs font-bold gap-1 px-2.5 py-0.5 ${
                  isPassed
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="size-3.5 text-rose-600" />
                )}
                <span>{isPassed ? t("statusPassed") : t("statusFailed")}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>
                {[formatSubject(exam.subject), formatGrade(exam.grade)].filter(Boolean).join(" • ")}
              </span>
              <span>•</span>
              <span className="font-medium text-foreground">{exam.teacherName}</span>
              <span>•</span>
              <span>{t("completedOn", { date: completedDateStr })}</span>
            </p>
          </div>
        </div>

        {/* Action Button: Retake or Course Link */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {exam.courseId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold gap-1.5 h-9"
            >
              <Link href={`/student-dashboard/courses/${exam.courseId}`}>
                <BookOpen className="size-3.5" />
                <span>{t("sidebar.courseButton")}</span>
              </Link>
            </Button>
          )}

          <Button
            onClick={handleRetakeExam}
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white shadow-xs"
          >
            <RotateCcw className="size-3.5 rtl:rotate-180" />
            <span>{t("sidebar.retakeButton")}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Hero Results Banner Card ──────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-xs ${
          isPassed
            ? "bg-linear-to-br from-emerald-500/10 via-card to-background border-emerald-500/30"
            : "bg-linear-to-br from-rose-500/10 via-card to-background border-rose-500/30"
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Hero Title & Description */}
          <div className="space-y-2 text-center md:text-start max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-background/80 backdrop-blur-xs border shadow-2xs">
              <Sparkles className={`size-3.5 ${isPassed ? "text-emerald-600" : "text-rose-600"}`} />
              <span>{t("attemptInfo", { current: 1, max: exam.triesAllowed || 2 })}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              {isPassed ? t("hero.passedTitle") : t("hero.failedTitle")}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isPassed ? t("hero.passedSubtitle") : t("hero.failedSubtitle")}
            </p>
          </div>

          {/* Right Hero Score Badge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border/80 shadow-xs min-w-56 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("kpi.totalScore")}
            </span>

            <div className="flex items-baseline gap-1 text-3xl sm:text-4xl font-black text-foreground">
              <span className={isPassed ? "text-emerald-600" : "text-rose-600"}>{earnedScore}</span>
              <span className="text-xl text-muted-foreground font-semibold">/ {totalScore}</span>
            </div>

            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">
              <span>{percentage}%</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                ({t("kpi.passingGrade")}: {exam.passingPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. KPI Statistics Grid (4 Cards) ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Passing Grade */}
        <DashboardCard className="p-4 flex flex-col justify-between gap-3 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpi.passingGrade")}
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{exam.passingPercentage}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {earnedScore >= totalScore * (exam.passingPercentage / 100)
                ? t("statusPassed")
                : t("statusFailed")}
            </p>
          </div>
        </DashboardCard>

        {/* Metric 2: Time Taken / Duration */}
        <DashboardCard className="p-4 flex flex-col justify-between gap-3 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("kpi.timeSpent")}</span>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {t("kpi.durationSuffix", { count: exam.durationMinutes })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("sidebar.duration")}</p>
          </div>
        </DashboardCard>

        {/* Metric 3: Correct Questions Count */}
        <DashboardCard className="p-4 flex flex-col justify-between gap-3 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("kpi.questionsAccuracy")}
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {correctQuestionsCount}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                / {evaluatedQuestions.length}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("kpi.correctCount", { count: correctQuestionsCount })}
            </p>
          </div>
        </DashboardCard>

        {/* Metric 4: Wrong Questions Count */}
        <DashboardCard className="p-4 flex flex-col justify-between gap-3 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("filters.incorrect", { count: wrongQuestionsCount })}
            </span>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <XCircle className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600">
              {wrongQuestionsCount}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                / {evaluatedQuestions.length}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("kpi.wrongCount", { count: wrongQuestionsCount })}
            </p>
          </div>
        </DashboardCard>
      </div>

      {/* ── 4. Main 2-Column Grid (8 Cols Questions / 4 Cols Sidebar) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Questions Review & Answers Comparison (8 Cols) ─ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Questions Header & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileQuestion className="size-4 text-primary" />
                <span>{t("questions.title")}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("questions.subtitle")}</p>
            </div>

            {/* Filter Toggle Buttons: All / Correct / Incorrect */}
            <div className="flex items-center p-1 bg-muted rounded-lg border border-border/40 text-xs font-medium self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-primary text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("filters.all", { count: evaluatedQuestions.length })}
              </button>
              <button
                type="button"
                onClick={() => setFilterType("correct")}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterType === "correct"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("filters.correct", { count: correctQuestionsCount })}
              </button>
              <button
                type="button"
                onClick={() => setFilterType("incorrect")}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterType === "incorrect"
                    ? "bg-rose-600 text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("filters.incorrect", { count: wrongQuestionsCount })}
              </button>
            </div>
          </div>

          {/* Questions Stream / Accordions */}
          {filteredQuestions.length === 0 ? (
            <DashboardCard className="p-12 text-center text-sm text-muted-foreground border-dashed">
              <FileCheck2 className="size-10 text-muted-foreground/40 mx-auto mb-2" />
              <p>{t("questions.noQuestionsFound")}</p>
            </DashboardCard>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((item, index) => {
                const { question: q, isCorrect, earnedPoints, studentAnswer } = item;
                const points = q.grade || 5;

                return (
                  <DashboardCard
                    key={q.id}
                    className={`p-5 space-y-4 border transition-all ${
                      isCorrect
                        ? "border-emerald-500/30 bg-card hover:border-emerald-500/50"
                        : "border-rose-500/30 bg-card hover:border-rose-500/50"
                    }`}
                  >
                    {/* Question Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Correct / Incorrect Indicator Badge */}
                        <div
                          className={`size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect
                              ? "bg-emerald-500/15 text-emerald-700"
                              : "bg-rose-500/15 text-rose-700"
                          }`}
                        >
                          {isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                        </div>

                        <span className="text-xs font-bold text-foreground">
                          {t("questions.questionNumber", { number: index + 1 })}
                        </span>

                        {q.questionName && (
                          <span className="text-xs font-medium text-muted-foreground">
                            • {q.questionName}
                          </span>
                        )}

                        <Badge variant="secondary" className="text-[10px]">
                          {tDetails(`questions.type.${q.type}` as Parameters<typeof tDetails>[0])}
                        </Badge>
                      </div>

                      {/* Earned Points Badge */}
                      <div className="self-end sm:self-auto">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                          }`}
                        >
                          {t("questions.earnedPoints", {
                            earned: earnedPoints,
                            total: points,
                          })}
                        </Badge>
                      </div>
                    </div>

                    {/* Question Statement / Markdown Content */}
                    <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      <MarkdownViewer content={q.questionContent} isRtl={isAr} />
                    </div>

                    {/* ── Question Answer Review Component ─────────────────────── */}
                    {/* Case 1: Multiple Choice Question (MCQ) */}
                    {q.type === "mcq" && q.options && q.options.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const isModelAnswer = opt.id === q.modelAnswer;
                            const isStudentSelection = opt.id === studentAnswer;

                            let optionStyle = "bg-muted/30 border-border/50 text-foreground/80";

                            if (isModelAnswer && isStudentSelection) {
                              // Student chose correct answer
                              optionStyle =
                                "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 font-semibold";
                            } else if (isModelAnswer && !isStudentSelection) {
                              // Correct answer that student missed
                              optionStyle =
                                "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-medium";
                            } else if (!isModelAnswer && isStudentSelection) {
                              // Incorrect choice picked by student
                              optionStyle =
                                "bg-rose-500/15 border-rose-500/50 text-rose-800 font-semibold";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${optionStyle}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isModelAnswer ? (
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                  ) : isStudentSelection ? (
                                    <XCircle className="size-4 text-rose-600 shrink-0" />
                                  ) : (
                                    <span className="size-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                  )}
                                  <span className="truncate">{opt.text}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isStudentSelection && (
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                        isModelAnswer
                                          ? "bg-emerald-600 text-white"
                                          : "bg-rose-600 text-white"
                                      }`}
                                    >
                                      {t("questions.studentSelected")}
                                    </span>
                                  )}
                                  {isModelAnswer && !isStudentSelection && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-600 text-white">
                                      {t("questions.correctChoice")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Case 2: True / False Question */}
                    {q.type === "true/false" && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {["true", "false"].map((val) => {
                          const isModelAnswer = val === q.modelAnswer;
                          const isStudentSelection = val === studentAnswer;
                          const label =
                            val === "true" ? t("questions.trueOption") : t("questions.falseOption");

                          let cardStyle = "bg-muted/30 border-border/50 text-foreground/80";

                          if (isModelAnswer && isStudentSelection) {
                            cardStyle =
                              "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 font-semibold";
                          } else if (isModelAnswer && !isStudentSelection) {
                            cardStyle =
                              "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-medium";
                          } else if (!isModelAnswer && isStudentSelection) {
                            cardStyle =
                              "bg-rose-500/15 border-rose-500/50 text-rose-800 font-semibold";
                          }

                          return (
                            <div
                              key={val}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                {isModelAnswer ? (
                                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                ) : isStudentSelection ? (
                                  <XCircle className="size-4 text-rose-600 shrink-0" />
                                ) : (
                                  <span className="size-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                )}
                                <span className="font-bold">{label}</span>
                              </div>

                              <div>
                                {isStudentSelection && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                      isModelAnswer
                                        ? "bg-emerald-600 text-white"
                                        : "bg-rose-600 text-white"
                                    }`}
                                  >
                                    {t("questions.studentSelected")}
                                  </span>
                                )}
                                {isModelAnswer && !isStudentSelection && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-600 text-white">
                                    {t("questions.correctChoice")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Case 3: Text / Open Written Question */}
                    {q.type === "text" && (
                      <div className="space-y-3 pt-2 text-xs">
                        {/* Student Submitted Answer */}
                        <div
                          className={`p-3 rounded-xl border space-y-1 ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              {isCorrect ? (
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                              ) : (
                                <XCircle className="size-3.5 text-rose-600" />
                              )}
                              <span>{t("questions.yourAnswer")}</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase">
                              {isCorrect ? t("statusPassed") : t("statusFailed")}
                            </span>
                          </div>
                          <p className="font-medium pt-0.5">{studentAnswer}</p>
                        </div>

                        {/* Model / Correct Answer */}
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-900 space-y-1">
                          <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="size-3.5" />
                            <span>{t("questions.modelAnswer")}</span>
                          </span>
                          <p className="font-medium pt-0.5">{q.modelAnswer}</p>
                        </div>
                      </div>
                    )}

                    {/* Explanation Card if Available */}
                    {q.hasAnswerExplanation && q.answerExplanation && (
                      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1.5">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <Sparkles className="size-3.5 shrink-0" />
                          <span>{t("questions.explanation")}</span>
                        </span>
                        <div className="text-xs text-muted-foreground leading-relaxed ps-5">
                          <MarkdownViewer content={q.answerExplanation} isRtl={isAr} />
                        </div>
                      </div>
                    )}

                    {/* Teacher Hint if Available */}
                    {q.hint && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-foreground/80 space-y-1">
                        <span className="font-semibold text-amber-600 flex items-center gap-1.5">
                          <Lightbulb className="size-3.5 shrink-0" />
                          <span>{t("questions.hint")}</span>
                        </span>
                        <p className="ps-5 text-muted-foreground">{q.hint}</p>
                      </div>
                    )}
                  </DashboardCard>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Column: Exam Information & Metadata Sidebar (4 Cols) ─── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <DashboardCard className="p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <FileCheck2 className="size-4 text-primary" />
              <span>{t("sidebar.metadataTitle")}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.teacher")}</span>
                <span className="font-semibold text-foreground">{exam.teacherName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.subjectAndGrade")}</span>
                <span className="font-semibold text-foreground">
                  {[formatSubject(exam.subject), formatGrade(exam.grade)]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.category")}</span>
                <span className="font-semibold text-foreground">
                  {formatCategory(exam.category)}
                </span>
              </div>

              {exam.examType === "course-dependent" && exam.courseId ? (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.sourceCourse")}</span>
                  <Link
                    href={`/student-dashboard/courses/${exam.courseId}`}
                    className="font-semibold text-primary hover:underline flex items-center gap-1 line-clamp-1"
                  >
                    <ExternalLink className="size-3" />
                    <span>{exam.courseTitle || exam.courseId}</span>
                  </Link>
                </div>
              ) : (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.sourceCourse")}</span>
                  <span className="font-semibold text-foreground">{t("sidebar.independent")}</span>
                </div>
              )}

              {exam.venue && (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.venue")}</span>
                  <span className="font-semibold text-foreground">{formatVenue(exam.venue)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.duration")}</span>
                <span className="font-semibold text-foreground">
                  {t("kpi.durationSuffix", { count: exam.durationMinutes })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.passingPercentage")}</span>
                <span className="font-bold text-amber-600">{exam.passingPercentage}%</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">{t("sidebar.triesAllowed")}</span>
                <span className="font-semibold text-foreground">{exam.triesAllowed || 1}</span>
              </div>
            </div>
          </DashboardCard>

          {/* Performance by Section Card if Multiple Sections Exist */}
          {exam.examSections && exam.examSections.length > 0 && (
            <DashboardCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                <ListFilter className="size-4 text-primary" />
                <span>{t("sidebar.sectionsBreakdownTitle")}</span>
              </h3>

              <div className="space-y-3">
                {exam.examSections.map((sec) => {
                  const secQuestions = evaluatedQuestions.filter((q) => q.sectionId === sec.id);
                  const secCorrect = secQuestions.filter((q) => q.isCorrect).length;
                  const secTotal = secQuestions.length;
                  const secPct = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 0;

                  return (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground truncate max-w-44">
                          {sec.title}
                        </span>
                        <span className="font-bold text-primary">{secPct}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            secPct >= 60 ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${secPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t("sidebar.sectionQuestionsCount", { count: secTotal })}</span>
                        <span>
                          {secCorrect} / {secTotal} {isAr ? "صحيح" : "correct"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
}
