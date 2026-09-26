"use client";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCourses } from "@/hooks/use-my-courses";
import { useStudentExams, useStudentGeneralExams } from "@/hooks/use-student-exams";
import { useStudentWebsiteWallet } from "@/hooks/use-student-wallet";
import { BookOpen, FileCheck2, HelpCircle, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

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
  walletBalance: propWalletBalance,
  examsSolved: propExamsSolved,
  correctQuestions: propCorrectQuestions,
  wrongQuestions: propWrongQuestions,
}: StudentGeneralOverviewProps) {
  const t = useTranslations("studentDashboard.overview");
  const locale = useLocale();
  const isAr = locale === "ar";

  // 1. Fetch Enrolled Courses from live API
  const { data: myCoursesData, isLoading: isLoadingCourses } = useMyCourses();
  const liveCoursesCount = myCoursesData?.pagination?.total ?? myCoursesData?.courses?.length ?? 0;
  const displayedCoursesCount =
    propCoursesCount !== undefined ? propCoursesCount : liveCoursesCount;

  // 2. Fetch Wallet Balance from live API
  const { data: walletData, isLoading: isLoadingWallet } = useStudentWebsiteWallet();
  const liveWalletBalance = walletData?.balance !== undefined ? Number(walletData.balance) : 0;
  const displayedWalletBalance =
    propWalletBalance !== undefined ? propWalletBalance : liveWalletBalance;
  const currency = walletData?.currency_code || (isAr ? t("currency") : "EGP");

  // 3. Fetch Completed Exams from live API (both course-specific and general platform exams)
  const { data: courseExamsData, isLoading: isLoadingCourseExams } = useStudentExams({
    tab: "completed",
    per_page: 50,
  });

  const { data: generalExamsData, isLoading: isLoadingGeneralExams } = useStudentGeneralExams({
    tab: "completed",
    per_page: 50,
  });

  const isLoadingExams = isLoadingCourseExams || isLoadingGeneralExams;

  const completedCourseExams = courseExamsData?.exams ?? [];
  const completedGeneralExams = generalExamsData?.exams ?? [];
  const completedExams = [...completedCourseExams, ...completedGeneralExams];

  const courseExamsCount = courseExamsData?.tab_counts?.completed ?? completedCourseExams.length;
  const generalExamsCount = generalExamsData?.tab_counts?.completed ?? completedGeneralExams.length;
  const liveExamsCount = courseExamsCount + generalExamsCount;

  const displayedExamsSolved = propExamsSolved !== undefined ? propExamsSolved : liveExamsCount;

  // 4. Calculate Aggregate Questions Performance across completed exams
  let aggregateTotalQuestions = 0;
  let aggregateCorrectAnswers = 0;
  let aggregateScoreSum = 0;
  let examsWithScores = 0;

  completedExams.forEach((exam) => {
    if (exam.adopted_result) {
      examsWithScores += 1;
      aggregateScoreSum += Number(exam.adopted_result.percentage || 0);
    }
    // Estimate questions count from questions_count field
    const qCount = Number(exam.questions_count || 0);
    if (qCount > 0) {
      aggregateTotalQuestions += qCount;
      const passPct = Number(exam.adopted_result?.percentage || 0);
      aggregateCorrectAnswers += Math.round((passPct / 100) * qCount);
    }
  });

  const liveCorrectQuestions = aggregateCorrectAnswers;
  const liveWrongQuestions = Math.max(0, aggregateTotalQuestions - aggregateCorrectAnswers);

  const displayedCorrect =
    propCorrectQuestions !== undefined ? propCorrectQuestions : liveCorrectQuestions;
  const displayedWrong = propWrongQuestions !== undefined ? propWrongQuestions : liveWrongQuestions;

  const totalQuestions = displayedCorrect + displayedWrong;
  const correctPct = totalQuestions > 0 ? Math.round((displayedCorrect / totalQuestions) * 100) : 0;
  const wrongPct = totalQuestions > 0 ? 100 - correctPct : 0;

  const averagePerformancePct =
    examsWithScores > 0 ? Math.round(aggregateScoreSum / examsWithScores) : 0;

  const performancePercentage =
    propGeneralPerformance !== undefined
      ? propGeneralPerformance
      : averagePerformancePct > 0
        ? averagePerformancePct
        : correctPct;

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
            {isLoadingExams ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {performancePercentage}%
                </span>
              </div>
            )}
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
            {isLoadingCourses ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {displayedCoursesCount}
              </span>
            )}
          </div>
        </DashboardCard>

        {/* Card 3: Wallet Balance */}
        <Link href="/student-dashboard/wallet" className="block">
          <DashboardCard className="p-5 h-full flex flex-col justify-between gap-3 bg-linear-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t("walletBalance")}
              </span>
              <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="size-4.5" />
              </div>
            </div>
            <div className="space-y-0.5">
              {isLoadingWallet ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {displayedWalletBalance.toLocaleString("en-US")}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">{currency}</span>
                </div>
              )}
            </div>
          </DashboardCard>
        </Link>

        {/* Card 4: Number of Exams Solved */}
        <DashboardCard className="p-5 flex flex-col justify-between gap-3 bg-card hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("examsSolved")}</span>
            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <FileCheck2 className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            {isLoadingExams ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {displayedExamsSolved}
              </span>
            )}
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
            {isLoadingExams ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {totalQuestions.toLocaleString("en-US")}
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
                      {displayedCorrect} {t("correctAnswers")}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      {displayedWrong} {t("wrongAnswers")}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </DashboardCard>
      </div>
    </section>
  );
}
