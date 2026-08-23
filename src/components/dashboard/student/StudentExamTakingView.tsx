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
} from "@/components/ui/dialog";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Exam, Question } from "@/types/exam";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  Lightbulb,
  ListFilter,
  Send,
  SkipForward,
  Timer,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { DashboardCard } from "../overview/dashboard-card";

interface FlattenedQuestion {
  question: Question;
  globalIndex: number;
  sectionTitle: string;
  sectionId: string;
}

interface StudentExamTakingViewProps {
  exam: Exam;
  onSubmitExam: (answers: Record<string, string>) => void;
}

export function StudentExamTakingView({ exam, onSubmitExam }: StudentExamTakingViewProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("studentDashboard.examTakingPage");
  const tDetails = useTranslations("exams.details");

  // Flatten all questions from sections
  const flatQuestions: FlattenedQuestion[] = React.useMemo(() => {
    if (!exam.examSections || exam.examSections.length === 0) return [];
    const res: FlattenedQuestion[] = [];
    let idx = 0;
    exam.examSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        res.push({
          question: q,
          globalIndex: idx,
          sectionTitle: sec.title,
          sectionId: sec.id,
        });
        idx++;
      });
    });
    return res;
  }, [exam.examSections]);

  const totalQuestionsCount = flatQuestions.length;

  // Active state
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = React.useState<string[]>([]);
  const [showHint, setShowHint] = React.useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Timer: Duration in minutes converted to seconds
  const initialSeconds = React.useMemo(() => {
    return Math.max(60, (exam.durationMinutes || 30) * 60);
  }, [exam.durationMinutes]);

  const [secondsRemaining, setSecondsRemaining] = React.useState(initialSeconds);

  // Countdown timer effect
  React.useEffect(() => {
    if (secondsRemaining <= 0) {
      // Auto-submit when time reaches 0
      onSubmitExam(answers);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSubmitExam(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, answers, onSubmitExam]);

  // Current Question
  const currentItem = flatQuestions[currentIndex] || flatQuestions[0];
  const currentQ = currentItem?.question;

  // Reset hint state when navigating questions
  React.useEffect(() => {
    setShowHint(false);
  }, [currentIndex]);

  // Handlers
  const handleSelectAnswer = (ans: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: ans,
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId],
    );
  };

  const handleNext = () => {
    if (currentIndex < totalQuestionsCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalQuestionsCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    if (idx >= 0 && idx < totalQuestionsCount) {
      setCurrentIndex(idx);
    }
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitExam(answers);
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }, 400);
  };

  // Timer format (HH:MM:SS or MM:SS)
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(mins)}:${pad(secs)}`;
  };

  const isLowTime = secondsRemaining <= 120; // less than 2 minutes
  const answeredQuestionsCount = Object.keys(answers).filter(
    (k) => answers[k]?.trim() !== "",
  ).length;
  const unansweredCount = totalQuestionsCount - answeredQuestionsCount;

  if (!currentQ) return null;

  const currentAnswer = answers[currentQ.id] || "";
  const isFlagged = flaggedIds.includes(currentQ.id);

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. Sticky Top Timer & Progress Bar ─────────────────────────────── */}
      <div className="sticky top-20 z-30 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Exam Title & Current Progress */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {currentIndex + 1} / {totalQuestionsCount}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground line-clamp-1">{exam.title}</h2>
              <p className="text-xs text-muted-foreground">
                {t("timerBar.answeredCount", {
                  answered: answeredQuestionsCount,
                  total: totalQuestionsCount,
                })}
              </p>
            </div>
          </div>

          {/* Center / Right: Time Countdown & Submit CTA */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold shadow-2xs transition-colors ${
                isLowTime
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-700 animate-pulse"
                  : "bg-muted border-border/60 text-foreground"
              }`}
            >
              <Timer className={`size-4 ${isLowTime ? "text-rose-600" : "text-primary"}`} />
              <span dir="ltr">{formatTime(secondsRemaining)}</span>
            </div>

            <Button
              onClick={() => setIsSubmitModalOpen(true)}
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
            >
              <Send className="size-3.5 rtl:rotate-180" />
              <span>{t("timerBar.submitExam")}</span>
            </Button>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{
              width: `${Math.round(((currentIndex + 1) / totalQuestionsCount) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* ── 2. Main 2-Column Grid (8 Cols Active Question / 4 Cols Navigator) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left (8 Cols): Current Active Question ──────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          <DashboardCard className="p-6 space-y-6">
            {/* Header: Question Number, Section, Points, Flag Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary">
                  {t("question.questionBadge", {
                    number: currentIndex + 1,
                    total: totalQuestionsCount,
                  })}
                </span>

                {currentItem.sectionTitle && (
                  <span className="text-xs font-medium text-muted-foreground">
                    • {currentItem.sectionTitle}
                  </span>
                )}

                <Badge variant="secondary" className="text-[10px]">
                  {tDetails(`questions.type.${currentQ.type}` as Parameters<typeof tDetails>[0])}
                </Badge>
              </div>

              {/* Points & Flag Button */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Badge
                  variant="outline"
                  className="text-xs font-bold text-primary border-primary/30"
                >
                  {t("question.points", { points: currentQ.grade || 5 })}
                </Badge>

                <Button
                  type="button"
                  variant={isFlagged ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer ${
                    isFlagged
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Flag className={`size-3.5 ${isFlagged ? "fill-current" : ""}`} />
                  <span>{isFlagged ? t("question.flagged") : t("question.flagQuestion")}</span>
                </Button>
              </div>
            </div>

            {/* Question Body / Statement (Supports Markdown and Math) */}
            <div className="space-y-3">
              <div className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                <MarkdownViewer content={currentQ.questionContent} isRtl={isAr} />
              </div>
            </div>

            {/* ── Option Selectors ─────────────────────────────────────────── */}
            {/* 1. Multiple Choice (MCQ) Options */}
            {currentQ.type === "mcq" && currentQ.options && currentQ.options.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("question.typeMcqPrompt")}
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer === opt.id;
                    const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectAnswer(opt.id)}
                        className={`w-full p-3.5 rounded-xl border text-start flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-xs text-foreground font-bold ring-2 ring-primary/20"
                            : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground/90"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-muted border border-border text-muted-foreground"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-xs sm:text-sm">{opt.text}</span>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. True / False Options */}
            {currentQ.type === "true/false" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("question.typeTrueFalsePrompt")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { val: "true", label: t("question.trueOption") },
                    { val: "false", label: t("question.falseOption") },
                  ].map(({ val, label }) => {
                    const isSelected = currentAnswer === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectAnswer(val)}
                        className={`p-4 rounded-xl border text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-bold ring-2 ring-primary/20 shadow-xs"
                            : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div
                          className={`size-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-bold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Text Input Answer */}
            {currentQ.type === "text" && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("question.typeTextPrompt")}
                </p>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder={t("question.textPlaceholder")}
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs resize-y"
                />
              </div>
            )}

            {/* Teacher Hint Toggle (if available) */}
            {currentQ.hint && (
              <div className="pt-2">
                {showHint ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700 flex items-center gap-1.5">
                        <Lightbulb className="size-3.5" />
                        <span>{t("question.hintTitle")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowHint(false)}
                        className="text-[11px] text-muted-foreground hover:underline cursor-pointer"
                      >
                        {t("question.hideHint")}
                      </button>
                    </div>
                    <p className="text-muted-foreground ps-5">{currentQ.hint}</p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 gap-1.5 h-8 px-2 cursor-pointer"
                  >
                    <Lightbulb className="size-3.5" />
                    <span>{t("question.viewHint")}</span>
                  </Button>
                )}
              </div>
            )}

            {/* ── Actions Footer Toolbar ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border/60">
              {/* Previous Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9 cursor-pointer"
              >
                <ArrowLeft className="size-3.5 rtl:rotate-180" />
                <span>{t("actions.previous")}</span>
              </Button>

              <div className="flex items-center gap-2">
                {/* Skip Question Button */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1 sm:flex-none rounded-xl text-xs font-semibold gap-1.5 h-9 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <SkipForward className="size-3.5 rtl:rotate-180" />
                  <span>{t("actions.skip")}</span>
                </Button>

                {/* Confirm & Next or Submit */}
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-none rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
                >
                  <span>
                    {currentIndex === totalQuestionsCount - 1
                      ? t("actions.finishAndReview")
                      : t("actions.next")}
                  </span>
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* ── Right (4 Cols): Question Navigator Sidebar ───────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <DashboardCard className="p-5 space-y-4 sticky top-44">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ListFilter className="size-4 text-primary" />
                  <span>{t("sidebar.title")}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("sidebar.subtitle")}</p>
              </div>
              <Badge variant="outline" className="text-xs font-bold font-mono">
                {answeredQuestionsCount} / {totalQuestionsCount}
              </Badge>
            </div>

            {/* Questions Grid Navigator */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {flatQuestions.map((item, idx) => {
                const qId = item.question.id;
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(answers[qId] && answers[qId].trim() !== "");
                const isFlaggedQ = flaggedIds.includes(qId);

                let badgeStyle =
                  "bg-muted/40 border-border/60 text-muted-foreground hover:border-primary/50 hover:bg-muted";

                if (isCurrent) {
                  badgeStyle =
                    "bg-primary text-white font-black ring-2 ring-primary ring-offset-2 border-primary shadow-xs";
                } else if (isFlaggedQ) {
                  badgeStyle =
                    "bg-amber-500/20 border-amber-500 text-amber-700 font-bold hover:bg-amber-500/30";
                } else if (isAnswered) {
                  badgeStyle =
                    "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 font-bold hover:bg-emerald-500/25";
                }

                return (
                  <button
                    key={qId}
                    type="button"
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-10 rounded-xl border text-xs flex flex-col items-center justify-center transition-all cursor-pointer relative ${badgeStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlaggedQ && !isCurrent && (
                      <span className="size-1.5 rounded-full bg-amber-600 absolute top-1.5 inset-e-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("sidebar.legend.answered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-muted border border-border shrink-0" />
                <span>{t("sidebar.legend.unanswered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>{t("sidebar.legend.flagged")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary shrink-0" />
                <span>{t("sidebar.legend.current")}</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* ── 3. Submission Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <span>{t("submitDialog.title")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("submitDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{t("intro.totalQuestions")}:</span>
              <span className="font-bold text-foreground">{totalQuestionsCount}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{t("sidebar.legend.answered")}:</span>
              <span className="font-bold text-emerald-600">{answeredQuestionsCount}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">{t("sidebar.legend.unanswered")}:</span>
              <span className="font-bold text-rose-600">{unansweredCount}</span>
            </div>

            {unansweredCount > 0 ? (
              <p className="text-xs font-semibold text-rose-600 bg-rose-500/10 p-2.5 rounded-lg">
                {t("submitDialog.warningUnanswered", { count: unansweredCount })}
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 p-2.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{t("submitDialog.allAnswered")}</span>
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold"
            >
              {t("submitDialog.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-xs"
            >
              <Send className="size-3.5 rtl:rotate-180" />
              <span>
                {isSubmitting ? t("submitDialog.submitting") : t("submitDialog.confirmSubmit")}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
