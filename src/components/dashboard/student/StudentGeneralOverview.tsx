"use client";

import { BookOpen, FileCheck2, HelpCircle, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { getEnrolledCourseIds } from "@/lib/student-enrollment-storage";
import React from "react";

interface StudentGeneralOverviewProps {
  generalPerformance?: number;
  coursesCount?: number;
  walletBalance?: number;
  examsSolved?: number;
  correctQuestions?: number;
  wrongQuestions?: number;
}

export function StudentGeneralOverview({
  generalPerformance: propGeneralPerformance,
  coursesCount: propCoursesCount,
  walletBalance = 350,
  examsSolved = 12,
  correctQuestions = 140,
  wrongQuestions = 20,
}: StudentGeneralOverviewProps) {
  const t = useTranslations("studentDashboard.overview");

  const [activeCoursesCount, setActiveCoursesCount] = React.useState(2);

  React.useEffect(() => {
    const updateCount = () => {
      const ids = getEnrolledCourseIds();
      setActiveCoursesCount(ids.length);
    };
    updateCount();
    window.addEventListener("rewaa_student_enrollment_updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("rewaa_student_enrollment_updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  const displayedCoursesCount =
    propCoursesCount !== undefined ? propCoursesCount : activeCoursesCount;

  const totalQuestions = correctQuestions + wrongQuestions;
  const correctPct = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  const wrongPct = 100 - correctPct;

  const performancePercentage =
    propGeneralPerformance !== undefined
      ? propGeneralPerformance
      : correctPct > 0
        ? correctPct
        : 88;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: General Performance / المستوى العام */}
        <DashboardCard className="p-5 flex flex-col justify-between gap-3 bg-card hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("generalPerformance")}
            </span>
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {performancePercentage}%
              </span>
            </div>
          </div>
        </DashboardCard>

        {/* Card 2: Number of Courses Enrolled In */}
        <DashboardCard className="p-5 flex flex-col justify-between gap-3 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("coursesEnrolled")}
            </span>
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {displayedCoursesCount}
            </span>
          </div>
        </DashboardCard>

        {/* Card 3: Wallet Balance */}
        <DashboardCard className="p-5 flex flex-col justify-between gap-3 bg-linear-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("walletBalance")}</span>
            <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {walletBalance.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-600">{t("currency")}</span>
            </div>
          </div>
        </DashboardCard>

        {/* Card 4: Number of Exams Solved */}
        <DashboardCard className="p-5 flex flex-col justify-between gap-3 bg-card hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("examsSolved")}</span>
            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <FileCheck2 className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{examsSolved}</span>
          </div>
        </DashboardCard>

        {/* Card 5: Number of Questions Solved (Correct & Wrong Breakdown) */}
        <DashboardCard className="p-5 flex flex-col justify-between gap-3 bg-card sm:col-span-2 lg:col-span-1 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("questionsSolved")}
            </span>
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <HelpCircle className="size-4.5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {totalQuestions.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-muted-foreground">{correctPct}%</span>
            </div>

            {/* Dual Segment Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-rose-500/20 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${correctPct}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${wrongPct}%` }}
              />
            </div>

            {/* Breakdown labels */}
            <div className="flex items-center justify-between text-[11px] pt-0.5 font-medium">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {correctQuestions} {t("correctAnswers")}
                </span>
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>
                  {wrongQuestions} {t("wrongAnswers")}
                </span>
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </section>
  );
}
