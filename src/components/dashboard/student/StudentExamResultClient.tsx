/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Textarea } from "@/components/ui/textarea";
import {
  useStartExamAttempt,
  useStudentAttempt,
  useStudentExam,
  useStudentExamResult,
  useSubmitExamAttempt,
  useSubmitExamComplaint,
} from "@/hooks/use-student-exams";
import { Link } from "@/i18n/routing";
import type { BackendStudentAttemptQuestion } from "@/types/api-contracts";
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
  ListFilter,
  Loader2,
  MessageSquareWarning,
  RotateCcw,
  Send,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { DashboardCard } from "../overview/dashboard-card";
import { StudentExamIntroView } from "./StudentExamIntroView";
import { StudentExamTakingView } from "./StudentExamTakingView";

interface StudentExamResultClientProps {
  examId: string;
}

export type QuestionFilterType = "all" | "correct" | "incorrect";

export function StudentExamResultClient({ examId }: StudentExamResultClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("studentDashboard.examResultPage");
  const tExams = useTranslations("exams");
  const tDetails = useTranslations("exams.details");
  const tCourses = useTranslations("courses");

  // React Query Hooks
  const { data: exam, isLoading: isExamLoading, error: examError } = useStudentExam(examId);

  // Active attempt query (if student is currently in an active or just-completed attempt)
  const [activeAttemptId, setActiveAttemptId] = React.useState<number | null>(null);
  const { data: activeAttempt, isLoading: isAttemptLoading } = useStudentAttempt(
    activeAttemptId || undefined,
  );

  // Result query (best / latest completed result from backend)
  const isCompletedExam =
    exam?.result_status === "passed" ||
    exam?.result_status === "failed" ||
    exam?.result_status === "pending_review";

  const { data: resultAttempt, isLoading: isResultLoading } = useStudentExamResult(
    isCompletedExam && !activeAttemptId ? examId : undefined,
  );

  // Mutations
  const startAttemptMutation = useStartExamAttempt();
  const submitAttemptMutation = useSubmitExamAttempt();
  const submitComplaintMutation = useSubmitExamComplaint();

  // Local UI State
  const [filterType, setFilterType] = React.useState<QuestionFilterType>("all");
  const [activeMode, setActiveMode] = React.useState<"intro" | "taking" | "review" | null>(null);

  // Complaint Dialog State
  const [complaintOpen, setComplaintOpen] = React.useState(false);
  const [complaintText, setComplaintText] = React.useState("");
  const [complaintSuccess, setComplaintSuccess] = React.useState(false);

  // Determine initial active mode once queries resolve
  React.useEffect(() => {
    if (!exam || activeMode !== null) return;

    if (exam.current_attempt_id) {
      setActiveAttemptId(exam.current_attempt_id);
      setActiveMode("taking");
    } else if (
      exam.result_status === "passed" ||
      exam.result_status === "failed" ||
      exam.result_status === "pending_review" ||
      exam.action === "view_result"
    ) {
      setActiveMode("review");
    } else {
      setActiveMode("intro");
    }
  }, [exam, activeMode]);

  // Current display attempt for Review Mode
  const displayAttempt = activeAttempt?.status !== "in_progress" ? activeAttempt : resultAttempt;

  // Start exam handler
  const handleStartExam = async () => {
    if (!exam) return;
    try {
      const resp = await startAttemptMutation.mutateAsync({
        examId: exam.id,
        courseId: exam.course?.id || undefined,
      });
      setActiveAttemptId(resp.id);
      setActiveMode("taking");
    } catch (err) {
      console.error("Failed to start exam attempt", err);
    }
  };

  // Submit exam handler
  const handleSubmitExam = async (answers: Array<{ question_id: number; answer?: unknown }>) => {
    const attemptIdToSubmit = activeAttemptId || exam?.current_attempt_id;
    if (!attemptIdToSubmit) return;

    try {
      const resp = await submitAttemptMutation.mutateAsync({
        attemptId: attemptIdToSubmit,
        payload: { answers },
        courseId: exam?.course?.id || undefined,
        examId: exam?.id,
      });
      setActiveAttemptId(resp.id);
      setActiveMode("review");
    } catch (err) {
      console.error("Failed to submit exam attempt", err);
    }
  };

  // Retake exam handler
  const handleRetakeExam = async () => {
    if (!exam) return;
    handleStartExam();
  };

  // Complaint submission handler
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam || !complaintText.trim()) return;

    try {
      await submitComplaintMutation.mutateAsync({
        examId: exam.id,
        body: complaintText.trim(),
      });
      setComplaintSuccess(true);
      setComplaintText("");
      setTimeout(() => {
        setComplaintOpen(false);
        setComplaintSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to submit complaint", err);
    }
  };

  // Helper translations for localized strings
  const getLocalizedString = (field?: Record<string, string> | null) => {
    if (!field) return "";
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const formatVenue = (v?: string | null) => {
    if (v === "online") return tCourses("venue.online");
    if (v === "center") return tCourses("venue.center");
    return tCourses("venue.all");
  };

  const formatCategory = (cat?: string | null) => {
    if (!cat) return "";
    const key = cat as Parameters<typeof tExams.has>[0];
    return tExams.has(`category.${key}` as Parameters<typeof tExams.has>[0])
      ? tExams(`category.${key}` as Parameters<typeof tExams>[0])
      : cat;
  };

  // Loading state
  const isGlobalLoading =
    isExamLoading ||
    (activeMode === "taking" && isAttemptLoading) ||
    (activeMode === "review" && !displayAttempt && isResultLoading);

  if (isGlobalLoading) {
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

  if (examError || !exam) {
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
  if (
    activeMode === "intro" ||
    (exam.result_status === "not_started" && activeMode !== "taking" && activeMode !== "review")
  ) {
    return (
      <StudentExamIntroView
        exam={exam}
        onStartExam={handleStartExam}
        isStarting={startAttemptMutation.isPending}
      />
    );
  }

  // ── Mode 2: Active Exam Taking Workspace ────────────────────────────────────
  if (activeMode === "taking" && activeAttempt) {
    return (
      <StudentExamTakingView
        attempt={activeAttempt}
        onSubmitExam={handleSubmitExam}
        isSubmitting={submitAttemptMutation.isPending}
      />
    );
  }

  // ── Mode 3: Completed Exam Results & Review ─────────────────────────────────
  const reviewQuestions = displayAttempt?.questions || [];
  const isPendingReview =
    displayAttempt?.status === "pending_review" ||
    (!displayAttempt && exam.result_status === "pending_review");

  const correctCount =
    displayAttempt?.result_summary?.correct_answers_count ??
    reviewQuestions.filter((q) => q.is_correct === true).length;
  const wrongCount =
    displayAttempt?.result_summary?.incorrect_answers_count ??
    reviewQuestions.filter((q) => q.is_correct === false).length;
  const totalScore = displayAttempt?.max_score ?? exam.adopted_result?.max_score ?? 100;
  const earnedScore = displayAttempt?.score ?? exam.adopted_result?.score ?? null;
  const percentage = displayAttempt?.percentage ?? exam.adopted_result?.percentage ?? null;
  const passingPercentage = displayAttempt?.passing_percentage ?? exam.passing_percentage ?? 60;
  const isPassed = isPendingReview
    ? null
    : (displayAttempt?.is_passed ??
      exam.adopted_result?.is_passed ??
      (percentage !== null ? percentage >= passingPercentage : false));

  const completedDateStr = displayAttempt?.submitted_at
    ? new Date(displayAttempt.submitted_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : exam.adopted_result?.completed_at
      ? new Date(exam.adopted_result.completed_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

  // Filtered Questions by Correct / Incorrect
  const filteredQuestions = reviewQuestions.filter((q) => {
    if (filterType === "correct") return q.is_correct === true;
    if (filterType === "incorrect") return q.is_correct === false;
    return true;
  });

  const canRetry = Boolean(
    displayAttempt?.can_retry || ((exam.remaining_attempts ?? 0) > 0 && exam.can_start),
  );

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. Top Header Row with Back Button & Actions ─────────────── */}
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
                {getLocalizedString(exam.title)}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs font-bold gap-1 px-2.5 py-0.5 ${
                  isPendingReview
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                    : isPassed
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400"
                }`}
              >
                {isPendingReview ? (
                  <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                ) : isPassed ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>
                  {isPendingReview
                    ? t("statusPendingReview")
                    : isPassed
                      ? t("statusPassed")
                      : t("statusFailed")}
                </span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>
                {[
                  getLocalizedString(exam.subject?.name),
                  getLocalizedString(exam.educational_stage?.name),
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
              {exam.instructor?.full_name && (
                <>
                  <span>•</span>
                  <span className="font-medium text-foreground">{exam.instructor.full_name}</span>
                </>
              )}
              <span>•</span>
              <span>{t("completedOn", { date: completedDateStr })}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Course Link, Retake & Complaint */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Complaint Dialog */}
          <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-medium gap-1.5 h-9"
              >
                <MessageSquareWarning className="size-3.5 text-amber-600" />
                <span>{isAr ? "تقديم شكوى / اعتراض" : "Submit Complaint"}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isAr ? "تقديم اعتراض على الامتحان" : "Submit Exam Complaint"}
                </DialogTitle>
                <DialogDescription>
                  {isAr
                    ? "إذا كان لديك ملاحظة على صياغة سؤال أو نتيجة تصحيح، يرجى كتابتها بالتفصيل وسيتم مراجعتها من قبل المعلم والإدارة."
                    : "If you have notes or feedback regarding questions or grading, describe it below to be reviewed by the instructor."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitComplaint} className="space-y-4 pt-2">
                <Textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder={
                    isAr
                      ? "اكتب تفاصيل الاعتراض أو رقم السؤال..."
                      : "Describe your inquiry or question number..."
                  }
                  className="min-h-28 text-xs resize-none"
                  required
                />
                {complaintSuccess && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 p-2.5 rounded-lg">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>
                      {isAr
                        ? "تم إرسال الشكوى بنجاح وسيتم الرد عليك."
                        : "Complaint submitted successfully."}
                    </span>
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setComplaintOpen(false)}
                    disabled={submitComplaintMutation.isPending}
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!complaintText.trim() || submitComplaintMutation.isPending}
                    className="gap-1.5"
                  >
                    {submitComplaintMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-3.5 rtl:rotate-180" />
                    )}
                    <span>{isAr ? "إرسال" : "Submit"}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {exam.course?.id && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold gap-1.5 h-9"
            >
              <Link href={`/student-dashboard/courses/${exam.course.id}`}>
                <BookOpen className="size-3.5" />
                <span>{t("sidebar.courseButton")}</span>
              </Link>
            </Button>
          )}

          {canRetry && (
            <Button
              onClick={handleRetakeExam}
              disabled={startAttemptMutation.isPending}
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              {startAttemptMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5 rtl:rotate-180" />
              )}
              <span>{t("sidebar.retakeButton")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Hero Results Banner Card ──────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-xs ${
          isPendingReview
            ? "bg-linear-to-br from-amber-500/10 via-card to-background border-amber-500/30"
            : isPassed
              ? "bg-linear-to-br from-emerald-500/10 via-card to-background border-emerald-500/30"
              : "bg-linear-to-br from-rose-500/10 via-card to-background border-rose-500/30"
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Hero Title & Description */}
          <div className="space-y-2 text-center md:text-start max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-background/80 backdrop-blur-xs border shadow-2xs">
              <Sparkles
                className={`size-3.5 ${isPendingReview ? "text-amber-600" : isPassed ? "text-emerald-600" : "text-rose-600"}`}
              />
              <span>
                {t("attemptInfo", {
                  current: displayAttempt?.attempt_number || exam.attempts_used || 1,
                  max: exam.max_attempts || 1,
                })}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              {isPendingReview
                ? t("hero.pendingTitle")
                : isPassed
                  ? t("hero.passedTitle")
                  : t("hero.failedTitle")}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isPendingReview
                ? t("hero.pendingSubtitle")
                : isPassed
                  ? t("hero.passedSubtitle")
                  : t("hero.failedSubtitle")}
            </p>
          </div>

          {/* Right Hero Score Badge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border/80 shadow-xs min-w-56 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("kpi.totalScore")}
            </span>

            <div className="flex items-baseline gap-1 text-3xl sm:text-4xl font-black text-foreground">
              {isPendingReview ? (
                <span className="text-amber-600 dark:text-amber-400 text-2xl font-bold">
                  {t("statusPendingReview")}
                </span>
              ) : (
                <>
                  <span
                    className={
                      isPassed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {earnedScore ?? 0}
                  </span>
                  <span className="text-xl text-muted-foreground font-semibold">
                    / {totalScore}
                  </span>
                </>
              )}
            </div>

            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">
              {isPendingReview ? (
                <span>
                  {t("kpi.passingGrade")}: {passingPercentage}%
                </span>
              ) : (
                <>
                  <span>{percentage !== null ? Math.round(percentage) : 0}%</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({t("kpi.passingGrade")}: {passingPercentage}%)
                  </span>
                </>
              )}
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
            <p className="text-2xl font-black text-foreground">{passingPercentage}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isPendingReview
                ? t("statusPendingReview")
                : isPassed
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
              {displayAttempt?.elapsed_seconds
                ? `${Math.ceil(displayAttempt.elapsed_seconds / 60)} ${isAr ? "دقيقة" : "min"}`
                : t("kpi.durationSuffix", { count: exam.duration_minutes })}
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
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {correctCount}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                / {reviewQuestions.length}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("kpi.correctCount", { count: correctCount })}
            </p>
          </div>
        </DashboardCard>

        {/* Metric 4: Wrong Questions Count */}
        <DashboardCard className="p-4 flex flex-col justify-between gap-3 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("filters.incorrect", { count: wrongCount })}
            </span>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <XCircle className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {wrongCount}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                / {reviewQuestions.length}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("kpi.wrongCount", { count: wrongCount })}
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
                {t("filters.all", { count: reviewQuestions.length })}
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
                {t("filters.correct", { count: correctCount })}
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
                {t("filters.incorrect", { count: wrongCount })}
              </button>
            </div>
          </div>

          {/* Questions Stream */}
          {filteredQuestions.length === 0 ? (
            <DashboardCard className="p-12 text-center text-sm text-muted-foreground border-dashed">
              <FileCheck2 className="size-10 text-muted-foreground/40 mx-auto mb-2" />
              <p>{t("questions.noQuestionsFound")}</p>
            </DashboardCard>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q: BackendStudentAttemptQuestion, index: number) => {
                const isCorrect = q.is_correct === true;
                const isIncorrect = q.is_correct === false;
                const isQuestionPending = q.is_correct === null || q.is_correct === undefined;
                const points = q.score || 5;
                const earnedPoints = q.awarded_score ?? (isCorrect ? points : 0);

                const questionTitle = getLocalizedString(q.title);
                const questionBody = getLocalizedString(q.body);
                const questionExplanation = getLocalizedString(q.explanation);
                const modelAnswer = getLocalizedString(q.model_answer);

                const hasRevealedAnswers =
                  q.options?.some(
                    (opt) => opt.is_correct !== null && opt.is_correct !== undefined,
                  ) ||
                  q.correct_answer !== null ||
                  Boolean(modelAnswer);

                return (
                  <DashboardCard
                    key={q.id}
                    className={`p-5 space-y-4 border transition-all ${
                      isCorrect
                        ? "border-emerald-500/30 bg-card hover:border-emerald-500/50"
                        : isIncorrect
                          ? "border-rose-500/30 bg-card hover:border-rose-500/50"
                          : "border-amber-500/30 bg-card hover:border-amber-500/50"
                    }`}
                  >
                    {/* Question Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Correct / Incorrect / Pending Indicator Badge */}
                        <div
                          className={`size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : isIncorrect
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {isCorrect ? (
                            <Check className="size-3.5" />
                          ) : isIncorrect ? (
                            <X className="size-3.5" />
                          ) : (
                            <Clock className="size-3.5" />
                          )}
                        </div>

                        <span className="text-xs font-bold text-foreground">
                          {t("questions.questionNumber", { number: index + 1 })}
                        </span>

                        {questionTitle && (
                          <span className="text-xs font-medium text-muted-foreground">
                            • {questionTitle}
                          </span>
                        )}

                        <Badge variant="secondary" className="text-[10px]">
                          {q.type === "multiple_choice"
                            ? tDetails("questions.type.mcq")
                            : q.type === "true_false"
                              ? tDetails("questions.type.true/false")
                              : tDetails("questions.type.text")}
                        </Badge>
                      </div>

                      {/* Earned Points Badge */}
                      <div className="self-end sm:self-auto">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                              : isIncorrect
                                ? "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400"
                                : "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                          }`}
                        >
                          {isQuestionPending
                            ? `${points} ${isAr ? "درجة" : "pts"}`
                            : t("questions.earnedPoints", {
                                earned: earnedPoints,
                                total: points,
                              })}
                        </Badge>
                      </div>
                    </div>

                    {/* Question Statement / Markdown Content */}
                    <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      <MarkdownViewer content={questionBody} isRtl={isAr} />
                    </div>

                    {/* ── Question Answer Review Component ─────────────────────── */}
                    {/* Case 1: Multiple Choice Question */}
                    {q.type === "multiple_choice" && q.options && q.options.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const optText = getLocalizedString(opt.text);
                            const isStudentSelection =
                              Number(q.submitted_answer) === Number(opt.id);
                            const isCorrectOpt = opt.is_correct === true;

                            let optionStyle = "bg-muted/30 border-border/50 text-foreground/80";

                            if (isStudentSelection) {
                              if (hasRevealedAnswers) {
                                optionStyle = isCorrectOpt
                                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-semibold"
                                  : "bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300 font-semibold";
                              } else {
                                optionStyle = isCorrect
                                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-semibold"
                                  : isIncorrect
                                    ? "bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300 font-semibold"
                                    : "bg-primary/10 border-primary/40 text-primary font-semibold";
                              }
                            } else if (hasRevealedAnswers && isCorrectOpt) {
                              optionStyle =
                                "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${optionStyle}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isStudentSelection ? (
                                    isCorrect ? (
                                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : isIncorrect ? (
                                      <XCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                    ) : (
                                      <span className="size-4 rounded-full bg-primary/20 border border-primary shrink-0" />
                                    )
                                  ) : hasRevealedAnswers && isCorrectOpt ? (
                                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <span className="size-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                  )}
                                  <span className="truncate">{optText}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isStudentSelection && (
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                        isCorrect
                                          ? "bg-emerald-600 text-white"
                                          : isIncorrect
                                            ? "bg-rose-600 text-white"
                                            : "bg-primary text-white"
                                      }`}
                                    >
                                      {t("questions.studentSelected")}
                                    </span>
                                  )}
                                  {hasRevealedAnswers && isCorrectOpt && !isStudentSelection && (
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
                    {q.type === "true_false" && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {[true, false].map((val) => {
                          const isCorrectVal =
                            q.correct_answer !== null && q.correct_answer !== undefined
                              ? Boolean(q.correct_answer) === val
                              : false;
                          const isStudentSelection =
                            q.submitted_answer !== null && q.submitted_answer !== undefined
                              ? Boolean(q.submitted_answer) === val
                              : false;
                          const label = val
                            ? t("questions.trueOption")
                            : t("questions.falseOption");

                          let cardStyle = "bg-muted/30 border-border/50 text-foreground/80";

                          if (isStudentSelection) {
                            if (hasRevealedAnswers) {
                              cardStyle = isCorrectVal
                                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-semibold"
                                : "bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300 font-semibold";
                            } else {
                              cardStyle = isCorrect
                                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-semibold"
                                : isIncorrect
                                  ? "bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300 font-semibold"
                                  : "bg-primary/10 border-primary/40 text-primary font-semibold";
                            }
                          } else if (hasRevealedAnswers && isCorrectVal) {
                            cardStyle =
                              "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium";
                          }

                          return (
                            <div
                              key={String(val)}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                {isStudentSelection ? (
                                  isCorrect ? (
                                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : isIncorrect ? (
                                    <XCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                  ) : (
                                    <span className="size-4 rounded-full bg-primary/20 border border-primary shrink-0" />
                                  )
                                ) : hasRevealedAnswers && isCorrectVal ? (
                                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="size-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                )}
                                <span className="font-bold">{label}</span>
                              </div>

                              <div>
                                {isStudentSelection && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                      isCorrect
                                        ? "bg-emerald-600 text-white"
                                        : isIncorrect
                                          ? "bg-rose-600 text-white"
                                          : "bg-primary text-white"
                                    }`}
                                  >
                                    {t("questions.studentSelected")}
                                  </span>
                                )}
                                {hasRevealedAnswers && isCorrectVal && !isStudentSelection && (
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

                    {/* Case 3: Essay / Written Question */}
                    {q.type === "essay" && (
                      <div className="space-y-3 pt-2 text-xs">
                        {/* Student Submitted Answer */}
                        <div
                          className={`p-3 rounded-xl border space-y-1 ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                              : isIncorrect
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              {isCorrect ? (
                                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : isIncorrect ? (
                                <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
                              ) : (
                                <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                              )}
                              <span>{t("questions.yourAnswer")}</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase">
                              {isQuestionPending
                                ? t("statusPendingReview")
                                : isCorrect
                                  ? t("statusPassed")
                                  : t("statusFailed")}
                            </span>
                          </div>
                          <p className="font-medium pt-0.5">
                            {typeof q.submitted_answer === "string" ? q.submitted_answer : "-"}
                          </p>
                        </div>

                        {/* Model Answer if provided by backend */}
                        {modelAnswer && (
                          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              <span>{t("questions.modelAnswer")}</span>
                            </span>
                            <p className="font-medium pt-0.5">{modelAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation Card if Available */}
                    {questionExplanation && (
                      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1.5">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <Sparkles className="size-3.5 shrink-0" />
                          <span>{t("questions.explanation")}</span>
                        </span>
                        <div className="text-xs text-muted-foreground leading-relaxed ps-5">
                          <MarkdownViewer content={questionExplanation} isRtl={isAr} />
                        </div>
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
              {exam.instructor?.full_name && (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.teacher")}</span>
                  <span className="font-semibold text-foreground">{exam.instructor.full_name}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.subjectAndGrade")}</span>
                <span className="font-semibold text-foreground">
                  {[
                    getLocalizedString(exam.subject?.name),
                    getLocalizedString(exam.educational_stage?.name),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>

              {exam.classification && (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.category")}</span>
                  <span className="font-semibold text-foreground">
                    {formatCategory(exam.classification)}
                  </span>
                </div>
              )}

              {exam.course ? (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.sourceCourse")}</span>
                  <Link
                    href={`/student-dashboard/courses/${exam.course.id}`}
                    className="font-semibold text-primary hover:underline flex items-center gap-1 line-clamp-1"
                  >
                    <ExternalLink className="size-3" />
                    <span>{getLocalizedString(exam.course.title)}</span>
                  </Link>
                </div>
              ) : (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.sourceCourse")}</span>
                  <span className="font-semibold text-foreground">{t("sidebar.independent")}</span>
                </div>
              )}

              {exam.delivery_mode && (
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("sidebar.venue")}</span>
                  <span className="font-semibold text-foreground">
                    {formatVenue(exam.delivery_mode)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.duration")}</span>
                <span className="font-semibold text-foreground">
                  {t("kpi.durationSuffix", { count: exam.duration_minutes })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("sidebar.passingPercentage")}</span>
                <span className="font-bold text-amber-600">{passingPercentage}%</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">{t("sidebar.triesAllowed")}</span>
                <span className="font-semibold text-foreground">{exam.max_attempts || 1}</span>
              </div>
            </div>
          </DashboardCard>

          {/* Performance by Section Card */}
          {displayAttempt?.section_performance && displayAttempt.section_performance.length > 0 && (
            <DashboardCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                <ListFilter className="size-4 text-primary" />
                <span>{t("sidebar.sectionsBreakdownTitle")}</span>
              </h3>

              <div className="space-y-3">
                {displayAttempt.section_performance.map((sec, idx) => {
                  const secTitle =
                    getLocalizedString(sec.title) || `${isAr ? "القسم" : "Section"} ${idx + 1}`;
                  const secPct = Math.round(sec.percentage);

                  return (
                    <div
                      key={sec.exam_section_id || idx}
                      className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground truncate max-w-44">
                          {secTitle}
                        </span>
                        <span className="font-bold text-primary">{secPct}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            secPct >= passingPercentage ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${secPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {t("sidebar.sectionQuestionsCount", { count: sec.questions_count })}
                        </span>
                        <span>
                          {sec.correct_answers_count} / {sec.questions_count}{" "}
                          {isAr ? "صحيح" : "correct"}
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
