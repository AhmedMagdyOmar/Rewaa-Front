/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ArrowLeft,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Pencil,
  Percent,
  RefreshCw,
  Search,
  Sliders,
  TrendingDown,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  LabelList,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneLink } from "@/components/ui/phone-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentPagination } from "../../common/content-pagination";
import { DashboardCard } from "../../overview/dashboard-card";

import { getStoredExams } from "@/lib/exams-storage";
import { generateExamStats } from "@/lib/mockExamStatsData";
import { Exam, QuestionDifficulty } from "@/types/exam";
import { ExamStatsData, ScoreDistributionBand } from "@/types/exam-stats";

interface ExamStatsClientProps {
  examId: string;
}

export type ResultFilterTab = "all" | "passed" | "failed";
export type StudentResultSortOption =
  | "score-desc"
  | "score-asc"
  | "name-asc"
  | "name-desc"
  | "newest";

export function ExamStatsClient({ examId }: ExamStatsClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("exams");
  const tStats = useTranslations("exams.stats");
  const tKpi = useTranslations("exams.stats.kpi");
  const tCharts = useTranslations("exams.stats.charts");
  const tDiff = useTranslations("exams.stats.difficulty");
  const tTable = useTranslations("exams.stats.studentResults");
  const tDetails = useTranslations("exams.details");

  const [exam, setExam] = React.useState<Exam | null>(null);
  const [stats, setStats] = React.useState<ExamStatsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = React.useState<Date>(new Date());
  const [timeAgoText, setTimeAgoText] = React.useState<string>("");

  // Filters & Search for Student Results
  const [searchQuery, setSearchQuery] = React.useState("");
  const [resultFilter, setResultFilter] = React.useState<ResultFilterTab>("all");
  const [sortBy, setSortBy] = React.useState<StudentResultSortOption>("score-desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Load Exam and Stats
  const loadData = React.useCallback(
    (showRefreshAnimation = false) => {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      }
      const stored = getStoredExams(locale);
      const found = stored.find((e) => e.id === examId);
      if (found) {
        setExam(found);
        const generated = generateExamStats(found, locale as "ar" | "en");
        setStats(generated);
        setLastUpdatedTime(new Date());
      }
      setIsLoading(false);
      if (showRefreshAnimation) {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }
    },
    [examId, locale],
  );

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute time ago text dynamically
  React.useEffect(() => {
    const updateAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdatedTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) {
        setTimeAgoText(tStats("justNow"));
      } else if (diffMins < 60) {
        setTimeAgoText(tStats("minutesAgo", { count: diffMins }));
      } else {
        setTimeAgoText(tStats("hoursAgo", { count: diffHours }));
      }
    };

    updateAgo();
    const interval = setInterval(updateAgo, 30000); // every 30s
    return () => clearInterval(interval);
  }, [lastUpdatedTime, tStats]);

  // Filtered & Sorted Student Results
  const filteredResults = React.useMemo(() => {
    if (!stats) return [];
    return stats.studentResults.filter((item) => {
      if (resultFilter === "passed" && !item.passed) return false;
      if (resultFilter === "failed" && item.passed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.fullName.toLowerCase().includes(q);
        const matchesPhone = item.phoneNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [stats, resultFilter, searchQuery]);

  const sortedResults = React.useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      switch (sortBy) {
        case "score-desc":
          return b.percentage - a.percentage;
        case "score-asc":
          return a.percentage - b.percentage;
        case "name-asc":
          return a.fullName.localeCompare(b.fullName, locale);
        case "name-desc":
          return b.fullName.localeCompare(a.fullName, locale);
        case "newest":
        default:
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
    });
  }, [filteredResults, sortBy, locale]);

  // Pagination
  const totalItems = sortedResults.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + itemsPerPage);

  const isFilterActive = searchQuery.trim() !== "" || resultFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setResultFilter("all");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!exam || !stats) {
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

  const sortOptions: { value: StudentResultSortOption; label: string }[] = [
    { value: "score-desc", label: tTable("sortScoreDesc") },
    { value: "score-asc", label: tTable("sortScoreAsc") },
    { value: "name-asc", label: tTable("sortNameAsc") },
    { value: "name-desc", label: tTable("sortNameDesc") },
    { value: "newest", label: tTable("sortNewest") },
  ];
  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || "";

  // Difficulty color styles
  const difficultyConfig: Record<
    QuestionDifficulty,
    { label: string; dotColor: string; textColor: string; bgColor: string }
  > = {
    easy: {
      label: tDiff("easy"),
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    medium: {
      label: tDiff("medium"),
      dotColor: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
    hard: {
      label: tDiff("hard"),
      dotColor: "bg-rose-500",
      textColor: "text-rose-600",
      bgColor: "bg-rose-500/10 border-rose-500/20",
    },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. HEADER ROW ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back button + Title & Subtitle */}
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard/exams`}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {exam.title}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{tStats("subtitle")}</p>
          </div>
        </div>

        {/* Right: Last Updated Info + Refresh Button + Edit Exam Button */}
        <div className="flex items-center gap-4 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{tStats("lastUpdatedAt")}</span>
            <span className="font-semibold text-foreground">{timeAgoText}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full text-foreground/80 hover:text-primary hover:bg-muted cursor-pointer transition-colors shadow-2xs"
              onClick={() => loadData(true)}
              title={tStats("refresh")}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              <span className="sr-only">{tStats("refresh")}</span>
            </Button>
          </div>

          <Button asChild size="sm" variant="outline" className="gap-1.5 font-semibold shadow-2xs">
            <Link href={`/${locale}/dashboard/exams/${exam.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              <span>{tDetails("editExam")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. 5 KEY STAT CARDS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat 1: Total Students */}
        <DashboardCard className="p-4 gap-2 relative overflow-hidden bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {tKpi("numberOfStudents")}
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {stats.totalStudents.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            <span>
              {tKpi("deltaFromLastMonth", { delta: `+${stats.studentsDeltaPercentage}` })}
            </span>
          </div>
        </DashboardCard>

        {/* Stat 2: Average Percentage */}
        <DashboardCard className="p-4 gap-2 relative overflow-hidden bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {tKpi("averagePercentage")}
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {stats.averagePercentage}%
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            <span>{tKpi("deltaFromLastMonth", { delta: `+${stats.avgDeltaPercentage}` })}</span>
          </div>
        </DashboardCard>

        {/* Stat 3: Pass Rate */}
        <DashboardCard className="p-4 gap-2 relative overflow-hidden bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{tKpi("passRate")}</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            {stats.passRate}%
          </div>
          <div className="text-[11px] font-medium text-muted-foreground truncate">
            {tKpi("passedStudentsCount", { count: stats.passedStudentsCount })}
          </div>
        </DashboardCard>

        {/* Stat 4: Highest Percentage */}
        <DashboardCard className="p-4 gap-2 relative overflow-hidden bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {tKpi("highestPercentage")}
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600">
            {stats.highestPercentage}%
          </div>
          <div className="text-[11px] font-medium text-muted-foreground truncate">
            {tKpi("highestScorersCount", { count: stats.highestScorersCount })}
          </div>
        </DashboardCard>

        {/* Stat 5: Lowest Percentage */}
        <DashboardCard className="p-4 gap-2 relative overflow-hidden bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {tKpi("lowestPercentage")}
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-600">
            {stats.lowestPercentage}%
          </div>
          <div className="text-[11px] font-medium text-muted-foreground truncate">
            {tKpi("lowestScorersCount", { count: stats.lowestScorersCount })}
          </div>
        </DashboardCard>
      </div>

      {/* ── 3. 2-COLUMN SECTION (2/3 & 1/3) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Column (2/3 width = 8 cols): Horizontal Bar Chart */}
        <DashboardCard className="lg:col-span-6 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="size-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">{tCharts("examStatistics")}</h2>
                <p className="text-xs text-muted-foreground">{tCharts("distributionSubtitle")}</p>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-primary" />
                <span className="text-muted-foreground">{tCharts("passingRange")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-rose-500" />
                <span className="text-muted-foreground">{tCharts("failingRange")}</span>
              </div>
            </div>
          </div>

          {/* Recharts Horizontal Bar Chart */}
          <div className="h-64 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={stats.scoreDistribution}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 40,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  className="stroke-border/50"
                />
                <XAxis
                  type="number"
                  reversed={isAr}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey="range"
                  orientation={isAr ? "right" : "left"}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  className="text-xs font-semibold fill-foreground"
                />
                <Tooltip
                  cursor={{ fill: "var(--color-border)", opacity: 0.15 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ScoreDistributionBand;
                      return (
                        <div
                          className="rounded-lg border border-border bg-popover p-3 shadow-md text-xs space-y-1"
                          dir={isAr ? "rtl" : "ltr"}
                        >
                          <div className="font-bold text-popover-foreground">{data.range}</div>
                          <div className="flex items-center justify-between gap-4 text-muted-foreground">
                            <span>{tCharts("studentsCount")}:</span>
                            <span className="font-bold text-foreground">{data.count}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              data.isPassing
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            }`}
                          >
                            {data.isPassing ? tCharts("passingRange") : tCharts("failingRange")}
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {stats.scoreDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isPassing
                          ? "var(--color-primary, #2563eb)"
                          : "var(--color-error, #e11d48)"
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    className="fill-foreground text-xs font-bold"
                    formatter={(val: unknown) => `${val ?? ""}`}
                  />
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Right Column (1/3 width = 4 cols): Analysis by difficulty */}
        <DashboardCard className="lg:col-span-4 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sliders className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">{tDiff("title")}</h2>
              <p className="text-xs text-muted-foreground">{tDiff("subtitle")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 justify-center py-2 flex-1">
            {stats.difficultyStats.map((item) => {
              const config = difficultyConfig[item.difficulty];
              return (
                <div
                  key={item.difficulty}
                  className={`p-4 rounded-xl border flex flex-col gap-2 transition-colors bg-neutral-50`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${config.dotColor}`} />
                      <span className="text-sm font-bold text-foreground">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {tDiff("questionsCount", { count: item.questionCount })}
                      </span>
                      <span className={`text-base font-bold ${config.textColor}`}>
                        {item.successRate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      </div>

      {/* ── 4. DETAILED STUDENT RESULTS COMPONENT ──────────────────────────────── */}
      <div className="space-y-4">
        {/* Header & Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserCheck className="size-5 text-primary" />
              <span>{tTable("title")}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{tTable("subtitle")}</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-2xs">
          {/* Search Box & Status Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-56">
              <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={tTable("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="ps-9 bg-background"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center p-1 bg-muted rounded-lg border border-border/40 text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => {
                  setResultFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  resultFilter === "all"
                    ? "bg-primary text-white shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tTable("allResults")} ({stats.studentResults.length})
              </button>
              <button
                onClick={() => {
                  setResultFilter("passed");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  resultFilter === "passed"
                    ? "bg-primary text-white shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tTable("passedOnly")} ({stats.studentResults.filter((s) => s.passed).length})
              </button>
              <button
                onClick={() => {
                  setResultFilter("failed");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  resultFilter === "failed"
                    ? "bg-primary text-white shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tTable("failedOnly")} ({stats.studentResults.filter((s) => !s.passed).length})
              </button>
            </div>
          </div>

          {/* Sort & Reset Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground text-xs h-9 px-2.5"
              >
                {tTable("resetFilters")}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>{currentSortLabel}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"} className="w-48">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setCurrentPage(1);
                    }}
                    className={sortBy === opt.value ? "font-bold text-primary" : ""}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-start whitespace-nowrap">
                    {tTable("columns.studentName")}
                  </th>
                  <th className="px-4 py-3 text-start whitespace-nowrap">
                    {tTable("columns.phoneNumber")}
                  </th>
                  <th className="px-4 py-3 text-start whitespace-nowrap">
                    {tTable("columns.gpa")}
                  </th>
                  <th className="px-4 py-3 text-start whitespace-nowrap">
                    {tTable("columns.triesCount")}
                  </th>
                  <th className="px-4 py-3 text-start whitespace-nowrap">
                    {tTable("columns.scoreRatio")}
                  </th>
                  <th className="px-4 py-3 text-start whitespace-nowrap">
                    {tTable("columns.result")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
                        <h3 className="text-sm font-semibold text-foreground">
                          {tTable("emptyTitle")}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                          {tTable("emptyDescription")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((result, idx) => {
                    const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                    return (
                      <tr
                        key={result.id}
                        className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                      >
                        {/* 1. Student Full Name with 32x32 Avatar */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="relative size-8 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0">
                              <Image
                                src={
                                  result.image ||
                                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                                }
                                alt={result.fullName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="font-semibold text-foreground text-xs">
                              {result.fullName}
                            </span>
                          </div>
                        </td>

                        {/* 2. Phone Number */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                          <PhoneLink phone={result.phoneNumber} className="hover:text-emerald-600">
                            {result.phoneNumber}
                          </PhoneLink>
                        </td>

                        {/* 3. Cumulative GPA */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-foreground/90">
                          {result.gpa}
                        </td>

                        {/* 4. Number of Tries */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                            {tTable("tries", { count: result.triesCount })}
                          </span>
                        </td>

                        {/* 5. Total Student Degree / Total Exam (e.g. 25/30) */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>
                              {result.score} / {result.totalScore}
                            </span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              ({result.percentage}%)
                            </span>
                          </div>
                        </td>

                        {/* 6. Result: Passed / Failed */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${
                              result.passed
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            }`}
                          >
                            {result.passed ? (
                              <CheckCircle2 className="size-3 me-1 text-emerald-600" />
                            ) : (
                              <XCircle className="size-3 me-1 text-rose-600" />
                            )}
                            <span>
                              {result.passed ? tTable("resultPassed") : tTable("resultFailed")}
                            </span>
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-4 py-3 border-t border-border/60 bg-muted/20">
            <ContentPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              showingText={t("pagination.showing", {
                start: Math.min(startIndex + 1, totalItems),
                end: Math.min(startIndex + itemsPerPage, totalItems),
                total: totalItems,
              })}
              onPageChange={(page: number) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
