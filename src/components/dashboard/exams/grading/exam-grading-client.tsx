/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Pencil,
  RotateCcw,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGradeExamAttempt, useProviderExamAttempt } from "@/hooks/use-exams";
import { getErrorMessage } from "@/lib/api-utils";
import { BackendExamAttemptQuestion } from "@/types/api-contracts";

interface ExamGradingClientProps {
  examId: string;
  attemptId: string;
}

export function ExamGradingClient({ examId, attemptId }: ExamGradingClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const t = useTranslations("exams.grading");
  const tSubmissions = useTranslations("exams.submissions");

  const { data: attempt, isLoading, isError, refetch } = useProviderExamAttempt(attemptId);
  const { mutate: gradeAttempt, isPending: isSubmitting } = useGradeExamAttempt(attemptId);

  // State mapping question_id -> string (input value)
  const [essayGrades, setEssayGrades] = React.useState<Record<number, string>>({});
  const [validationErrors, setValidationErrors] = React.useState<Record<number, string>>({});

  // Initialize grades from attempt data
  React.useEffect(() => {
    if (attempt?.questions) {
      const initialGrades: Record<number, string> = {};
      attempt.questions.forEach((q: BackendExamAttemptQuestion) => {
        if (q.type === "essay") {
          initialGrades[q.id] =
            q.awarded_score !== null && q.awarded_score !== undefined
              ? String(q.awarded_score)
              : "";
        }
      });
      setEssayGrades(initialGrades);
    }
  }, [attempt]);

  // Questions categorization
  const essayQuestions = React.useMemo(() => {
    return (attempt?.questions || []).filter((q: BackendExamAttemptQuestion) => q.type === "essay");
  }, [attempt?.questions]);

  const objectiveQuestions = React.useMemo(() => {
    return (attempt?.questions || []).filter((q: BackendExamAttemptQuestion) => q.type !== "essay");
  }, [attempt?.questions]);

  // Calculations
  const objectiveScore = React.useMemo(() => {
    return objectiveQuestions.reduce((sum: number, q: BackendExamAttemptQuestion) => {
      return sum + (q.awarded_score || 0);
    }, 0);
  }, [objectiveQuestions]);

  const currentEssayScore = React.useMemo(() => {
    return Object.entries(essayGrades).reduce((sum: number, [, val]) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [essayGrades]);

  const maxScore = attempt?.max_score || 100;
  const currentTotalScore = Math.min(maxScore, objectiveScore + currentEssayScore);
  const currentPercentage =
    maxScore > 0 ? Math.round((currentTotalScore / maxScore) * 100 * 100) / 100 : 0;
  const passingPercentage = attempt?.passing_percentage || attempt?.exam?.passing_percentage || 60;
  const isPassing = currentPercentage >= passingPercentage;

  const handleScoreChange = (questionId: number, maxQuestionScore: number, value: string) => {
    setEssayGrades((prev) => ({ ...prev, [questionId]: value }));

    const num = parseFloat(value);
    if (value.trim() === "") {
      setValidationErrors((prev) => ({ ...prev, [questionId]: t("question.scoreRequired") }));
    } else if (isNaN(num)) {
      setValidationErrors((prev) => ({ ...prev, [questionId]: t("question.scoreRequired") }));
    } else if (num < 0) {
      setValidationErrors((prev) => ({ ...prev, [questionId]: t("question.scoreNegative") }));
    } else if (num > maxQuestionScore) {
      setValidationErrors((prev) => ({
        ...prev,
        [questionId]: t("question.scoreExceedsMax", { max: maxQuestionScore }),
      }));
    } else {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleSetPreset = (questionId: number, maxQuestionScore: number, ratio: number) => {
    const calculated = maxQuestionScore * ratio;
    const scoreStr = calculated % 1 === 0 ? String(calculated) : calculated.toFixed(1);
    handleScoreChange(questionId, maxQuestionScore, scoreStr);
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    // Validate all essay questions
    const errors: Record<number, string> = {};
    let hasError = false;

    essayQuestions.forEach((q: BackendExamAttemptQuestion) => {
      const val = essayGrades[q.id];
      const num = parseFloat(val ?? "");
      if (val === undefined || val === "" || isNaN(num)) {
        errors[q.id] = t("question.scoreRequired");
        hasError = true;
      } else if (num < 0) {
        errors[q.id] = t("question.scoreNegative");
        hasError = true;
      } else if (num > q.score) {
        errors[q.id] = t("question.scoreExceedsMax", { max: q.score });
        hasError = true;
      }
    });

    if (hasError) {
      setValidationErrors(errors);
      toast.error(t("errorToast"));
      return;
    }

    const payload = {
      answers: essayQuestions.map((q: BackendExamAttemptQuestion) => ({
        question_id: q.id,
        awarded_score: parseFloat(essayGrades[q.id]),
      })),
    };

    gradeAttempt(payload, {
      onSuccess: () => {
        toast.success(t("successToast"));
        router.push(`/${locale}/dashboard/exams/${examId}/submissions`);
      },
      onError: (err: unknown) => {
        const msg = getErrorMessage(err) || t("errorToast");
        toast.error(msg);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="size-12 text-destructive" />
        <h2 className="text-lg font-bold">{t("failedLoad")}</h2>
        <Button onClick={() => refetch()}>{t("tryAgain")}</Button>
      </div>
    );
  }

  const examTitle = isAr
    ? attempt.exam.title.ar || attempt.exam.title.en
    : attempt.exam.title.en || attempt.exam.title.ar;

  const studentName = attempt.student?.full_name || t("defaultStudent");
  const isAlreadyGraded = attempt.status === "graded";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full pb-28"
    >
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/exams/${examId}/submissions`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className={`size-3.5 ${isAr ? "rotate-180" : ""}`} />
            <span>{t("backToSubmissions")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Pencil className="size-6 text-primary" />
              <span>{t("pageTitle")}</span>
            </h1>
            {attempt.status === "pending_review" ? (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs font-bold">
                <Sparkles className="size-3 me-1 text-amber-600 animate-pulse" />
                {tSubmissions("status.pendingReview")}
              </Badge>
            ) : (
              <Badge
                className={`text-xs font-bold ${
                  attempt.is_passed
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                }`}
              >
                {attempt.is_passed ? (
                  <CheckCircle2 className="size-3 me-1 text-emerald-600" />
                ) : (
                  <XCircle className="size-3 me-1 text-rose-600" />
                )}
                {tSubmissions("status.graded")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {examTitle} • {t("attemptNumber", { number: attempt.attempt_number })}
          </p>
        </div>

        {isAlreadyGraded && (
          <div className="bg-muted/60 border border-border/60 rounded-xl px-3.5 py-2 text-xs text-muted-foreground max-w-sm">
            {t("alreadyGradedNotice")}
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Student Info Card */}
        <Card className="p-4 rounded-xl border-border/60 shadow-2xs flex items-center gap-3.5">
          <div className="relative size-12 rounded-full overflow-hidden border border-border/80 bg-muted shrink-0">
            {attempt.student?.avatar ? (
              <Image src={attempt.student.avatar} alt={studentName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-base">
                {studentName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground truncate">{studentName}</h3>
            {attempt.student?.email && (
              <p className="text-xs text-muted-foreground truncate">{attempt.student.email}</p>
            )}
            {attempt.student?.phone && (
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {attempt.student.phone_code ? `+${attempt.student.phone_code} ` : ""}
                {attempt.student.phone}
              </p>
            )}
          </div>
        </Card>

        {/* 2. Attempt Metadata Card */}
        <Card className="p-4 rounded-xl border-border/60 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {t("submittedAt")}
            </span>
            <span className="font-semibold text-foreground">
              {attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {t("timeSpent")}
            </span>
            <span className="font-semibold text-foreground">
              {(() => {
                if (attempt.elapsed_seconds !== null && attempt.elapsed_seconds !== undefined) {
                  const totalSec = attempt.elapsed_seconds;
                  const mins = Math.floor(totalSec / 60);
                  const secs = totalSec % 60;
                  if (mins > 0 && secs > 0) {
                    return t("duration.minutesAndSeconds", { minutes: mins, seconds: secs });
                  }
                  if (mins > 0) {
                    return t("duration.minutes", { count: mins });
                  }
                  return t("duration.seconds", { count: secs });
                }
                if (attempt.duration_minutes) {
                  return t("duration.minutes", { count: attempt.duration_minutes });
                }
                return "--";
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-border/40 pt-1.5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Award className="size-3.5" />
              {t("passingScore")}
            </span>
            <span className="font-bold text-foreground">{passingPercentage}%</span>
          </div>
        </Card>

        {/* 3. Live Score Breakdown Card */}
        <Card className="p-4 rounded-xl border-primary/20 bg-primary/5 shadow-2xs flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Sparkles className="size-3.5" />
              {t("liveScoreCalculation")}
            </span>
            <Badge
              className={`text-[10px] font-bold ${
                isPassing
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
              }`}
            >
              {isPassing ? t("passed") : t("failed")}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {t("objectiveScore")}: <b className="text-foreground">{objectiveScore}</b> +{" "}
              {t("essayScore")}: <b className="text-foreground">{currentEssayScore}</b>
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-primary/20 pt-1.5">
            <span className="text-xs font-semibold text-foreground">{t("totalScore")}:</span>
            <span className="text-lg font-extrabold text-foreground">
              {currentTotalScore}{" "}
              <span className="text-xs text-muted-foreground">
                / {maxScore} ({currentPercentage}%)
              </span>
            </span>
          </div>
        </Card>
      </div>

      {/* ── ESSAY QUESTIONS GRADING SECTION ── */}
      {essayQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Pencil className="size-5 text-amber-500" />
                <span>{t("sections.essayGrading")}</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {essayQuestions.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "يرجى قراءة إجابة الطالب وتحديد الدرجة المناسبة لكل سؤال مقالي أدناه."
                  : "Review student essay submissions and award appropriate scores for each question."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {essayQuestions.map((q: BackendExamAttemptQuestion, index: number) => {
              const questionTitle = isAr ? q.title.ar || q.title.en : q.title.en || q.title.ar;
              const questionBody = isAr ? q.body.ar || q.body.en : q.body.en || q.body.ar;
              const modelAnswer = isAr
                ? q.model_answer?.ar || q.model_answer?.en
                : q.model_answer?.en || q.model_answer?.ar;
              const studentAnswer =
                typeof q.submitted_answer === "string" ? q.submitted_answer : "";
              const currentScore = essayGrades[q.id] ?? "";
              const error = validationErrors[q.id];

              return (
                <Card
                  key={q.id}
                  className={`p-5 rounded-xl border transition-all ${
                    error
                      ? "border-destructive/60 bg-destructive/5"
                      : "border-border/70 bg-card hover:border-border"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Question Content & Student Answer */}
                    <div className="space-y-3.5 flex-1">
                      {/* Question Header */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center size-6 rounded-md bg-amber-500/10 text-amber-600 text-xs font-bold">
                          {index + 1}
                        </span>
                        <Badge variant="outline" className="text-[11px] font-semibold bg-muted/60">
                          {t("question.essayBadge")}
                        </Badge>
                        <Badge variant="secondary" className="text-[11px] font-mono">
                          {t("question.maxScore", { score: q.score })}
                        </Badge>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">{questionTitle}</h4>
                        {questionBody && questionBody !== questionTitle && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {questionBody}
                          </p>
                        )}
                      </div>

                      {/* Student Submitted Answer */}
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <User className="size-3.5 text-primary" />
                          {t("question.studentAnswer")}
                        </span>
                        {studentAnswer ? (
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans bg-background/80 p-3 rounded-lg border border-border/40">
                            {studentAnswer}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {t("question.noAnswerSubmitted")}
                          </p>
                        )}
                      </div>

                      {/* Model Answer / Rubric (if exists) */}
                      {modelAnswer && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1.5">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <BookOpen className="size-3.5" />
                            {t("question.modelAnswer")}
                          </span>
                          <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {modelAnswer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Score Input & Quick Preset Buttons */}
                    <div className="w-full md:w-64 shrink-0 bg-muted/40 p-4 rounded-xl border border-border/60 space-y-3">
                      <label className="text-xs font-bold text-foreground block">
                        {t("question.awardScore")}
                      </label>

                      <div className="relative">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          dir="ltr"
                          max={q.score}
                          placeholder={t("question.scorePlaceholder", { max: q.score })}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(q.id, q.score, e.target.value)}
                          className={`bg-background font-bold text-sm text-end ${
                            error ? "border-destructive focus-visible:ring-destructive" : ""
                          }`}
                        />
                        <span className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          / {q.score}
                        </span>
                      </div>

                      {error && (
                        <p className="text-[11px] font-semibold text-destructive">{error}</p>
                      )}

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => handleSetPreset(q.id, q.score, 0)}
                          className="flex-1 text-[11px] h-7 cursor-pointer"
                        >
                          {t("question.presets.zero")}
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => handleSetPreset(q.id, q.score, 0.5)}
                          className="flex-1 text-[11px] h-7 cursor-pointer"
                        >
                          {t("question.presets.half")}
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => handleSetPreset(q.id, q.score, 1)}
                          className="flex-1 text-[11px] h-7 cursor-pointer"
                        >
                          {t("question.presets.full")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── OBJECTIVE QUESTIONS REVIEW SECTION ── */}
      {objectiveQuestions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span>{t("sections.objectiveReview")}</span>
              <Badge variant="outline" className="text-xs font-mono">
                {objectiveQuestions.length}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "تم تصحيح هذه الأسئلة تلقائياً بواسطة النظام بناءً على الإجابة الصحيحة المحددة."
                : "These objective questions were graded automatically based on correct system answers."}
            </p>
          </div>

          <div className="space-y-3">
            {objectiveQuestions.map((q: BackendExamAttemptQuestion, index: number) => {
              const questionTitle = isAr ? q.title.ar || q.title.en : q.title.en || q.title.ar;
              const isCorrect = q.is_correct === true;

              return (
                <Card
                  key={q.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isCorrect
                      ? "border-emerald-500/20 bg-emerald-500/2"
                      : "border-rose-500/20 bg-rose-500/2"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center size-5 rounded-md text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {q.type === "multiple_choice"
                            ? t("question.mcqBadge")
                            : t("question.tfBadge")}
                        </Badge>
                        <span className="text-xs font-bold text-foreground">{questionTitle}</span>
                      </div>

                      {/* Options / Choice Selected */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => {
                            const optText = isAr
                              ? opt.text.ar || opt.text.en
                              : opt.text.en || opt.text.ar;
                            const isSelected = String(q.submitted_answer) === String(opt.id);
                            const isAnswerCorrect = opt.is_correct === true;

                            return (
                              <div
                                key={opt.id}
                                className={`text-xs p-2.5 rounded-lg border flex items-center justify-between ${
                                  isSelected && isAnswerCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 font-semibold"
                                    : isSelected && !isAnswerCorrect
                                      ? "bg-rose-500/10 border-rose-500/40 text-rose-700 font-semibold"
                                      : isAnswerCorrect
                                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                                        : "bg-background border-border/40 text-muted-foreground"
                                }`}
                              >
                                <span>{optText}</span>
                                {isSelected && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {t("question.studentAnswer").replace(":", "")}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Awarded Score */}
                    <div className="text-end shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          isCorrect ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {q.awarded_score || 0} / {q.score}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border/60 py-3 px-4 md:px-8 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/dashboard/exams/${examId}/submissions`}>
              <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                {t("cancelReturn")}
              </Button>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t("totalScore")}:</span>
              <span className="font-extrabold text-foreground text-sm">
                {currentTotalScore} / {maxScore} ({currentPercentage}%)
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="size-4 me-2 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              <>
                <Check className="size-4 me-2" />
                {t("submitGrades")}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
