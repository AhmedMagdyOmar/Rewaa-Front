"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { BackendStudentExam } from "@/types/api-contracts";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileQuestion,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardCard } from "../overview/dashboard-card";

interface StudentExamIntroViewProps {
  exam: BackendStudentExam;
  onStartExam: () => void;
  isStarting?: boolean;
}

export function StudentExamIntroView({
  exam,
  onStartExam,
  isStarting = false,
}: StudentExamIntroViewProps) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.examTakingPage.intro");
  const tGlobal = useTranslations("studentDashboard.examResultPage");
  const tCourses = useTranslations("courses");
  const tExams = useTranslations("exams");

  const getLocalizedString = (field?: Record<string, string> | null) => {
    if (!field) return "";
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const titleStr = getLocalizedString(exam.title);
  const stageStr = getLocalizedString(exam.educational_stage?.name);
  const subjectStr = getLocalizedString(exam.subject?.name);
  const courseTitleStr = getLocalizedString(exam.course?.title);
  const teacherName = exam.instructor?.full_name;

  const formatCategory = (cat: string) => {
    const key = cat as Parameters<typeof tExams.has>[0];
    return tExams.has(`category.${key}` as Parameters<typeof tExams.has>[0])
      ? tExams(`category.${key}` as Parameters<typeof tExams>[0])
      : cat;
  };

  const formatVenue = (v?: string) => {
    if (v === "online") return tCourses("venue.online");
    if (v === "onsite" || v === "center") return tCourses("venue.center");
    return tCourses("venue.all");
  };

  const canStart = exam.can_start !== false;

  return (
    <div className="space-y-6 pb-12 w-full max-w-5xl mx-auto">
      {/* ── 1. Top Header with Standard Round Back Button ──────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href="/student-dashboard/exams">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {titleStr}
              </h1>
              <Badge variant="secondary" className="text-xs font-semibold">
                {formatCategory(exam.classification)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>{[subjectStr, stageStr].filter(Boolean).join(" • ")}</span>
              {teacherName && (
                <>
                  <span>•</span>
                  <span className="font-medium text-foreground">{teacherName}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Hero Card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-background p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary mb-1">
              <Sparkles className="size-3.5" />
              <span>{t("title")}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">{t("title")}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Button
            onClick={onStartExam}
            disabled={!canStart || isStarting}
            size="lg"
            className="rounded-xl font-bold gap-2 text-sm sm:text-base h-12 px-6 bg-primary hover:bg-primary/90 text-white shadow-md self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            {isStarting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4 fill-current rtl:rotate-180" />
            )}
            <span>
              {exam.action === "resume"
                ? tExams("actions.resume") || t("startExamButton")
                : t("startExamButton")}
            </span>
          </Button>
        </div>
      </div>

      {/* ── 3. Grid: Details & Guidelines ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Important Guidelines (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          <DashboardCard className="p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              <span>{t("guidelinesTitle")}</span>
            </h3>

            <div className="space-y-3.5 text-xs text-foreground/90">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <Timer className="size-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t("guidelineTimer")}</p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <RotateCcw className="size-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t("guidelineSkipping")}</p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t("guidelineAutoSubmit")}</p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t("guidelineSubmission")}</p>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Right: Key Exam Metrics (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          <DashboardCard className="p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <FileCheck2 className="size-4 text-primary" />
              <span>{t("detailsTitle")}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileQuestion className="size-3.5 text-primary" />
                  {t("totalQuestions")}
                </span>
                <span className="font-bold text-foreground">
                  {t("questionsCount", { count: exam.questions_count })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-blue-600" />
                  {t("duration")}
                </span>
                <span className="font-bold text-foreground">
                  {t("durationMinutes", { count: exam.duration_minutes })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Award className="size-3.5 text-amber-600" />
                  {t("passingScore")}
                </span>
                <span className="font-bold text-amber-600">
                  {t("passingPercentage", { percent: exam.passing_percentage })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <RotateCcw className="size-3.5 text-purple-600" />
                  {t("triesAllowed")}
                </span>
                <span className="font-semibold text-foreground">
                  {t("triesCount", { count: exam.max_attempts || 1 })}
                </span>
              </div>

              {courseTitleStr && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="size-3.5 text-primary" />
                    {tGlobal("sidebar.sourceCourse")}
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-40">
                    {courseTitleStr}
                  </span>
                </div>
              )}

              {exam.delivery_mode && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground">{t("venue")}</span>
                  <span className="font-semibold text-foreground">
                    {formatVenue(exam.delivery_mode)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                onClick={onStartExam}
                disabled={!canStart || isStarting}
                className="w-full rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Play className="size-3.5 fill-current rtl:rotate-180" />
                )}
                <span>
                  {exam.action === "resume"
                    ? tExams("actions.resume") || t("startExamButton")
                    : t("startExamButton")}
                </span>
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
