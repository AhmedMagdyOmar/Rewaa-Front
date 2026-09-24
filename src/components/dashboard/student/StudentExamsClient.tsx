/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentExams } from "@/hooks/use-student-exams";
import { Link } from "@/i18n/routing";
import type { BackendStudentExam } from "@/types/api-contracts";
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileQuestion,
  Globe,
  Globe2,
  House,
  Search,
  Timer,
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export type StudentExamTab = "required" | "completed";
export type StudentExamSortOption =
  | "latest"
  | "oldest"
  | "title_asc"
  | "title_desc"
  | "duration_desc"
  | "duration_asc"
  | "score_desc"
  | "score_asc";

function formatDate(iso?: string | null, locale?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function StudentExamsClient() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.examsPage");
  const tCourses = useTranslations("courses");
  const tExams = useTranslations("exams");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as StudentExamTab) || "required";
  const sortBy = (searchParams.get("sort") as StudentExamSortOption) || "latest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 10;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "tab" && value === "required") ||
          (key === "sort" && value === "latest") ||
          (key === "page" && value === 1)
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // Debounced search state
  const [searchTerm, setSearchTerm] = React.useState(searchQuery);
  React.useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        updateUrlParams({ search: searchTerm.trim() ? searchTerm : null, page: 1 });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, searchQuery, updateUrlParams]);

  // Fetch student exams from backend via React Query
  const { data, isLoading } = useStudentExams({
    search: searchQuery.trim() || undefined,
    tab: activeTab,
    sort: sortBy,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const exams = data?.exams || [];
  const tabCounts = data?.tab_counts || { required: 0, completed: 0 };
  const pagination = data?.pagination || {
    current_page: 1,
    last_page: 1,
    per_page: itemsPerPage,
    total: 0,
  };

  const totalPages = pagination.last_page || 1;
  const totalItems = pagination.total || 0;
  const startIndex = (pagination.current_page - 1) * pagination.per_page;

  // Format helpers
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

  const getLocalizedString = (field?: Record<string, string> | null) => {
    if (!field) return "";
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTabChange = (tab: StudentExamTab) => updateUrlParams({ tab, page: 1 });
  const handleSortChange = (sort: StudentExamSortOption) => updateUrlParams({ sort, page: 1 });
  const handlePageChange = (page: number) => updateUrlParams({ page });
  const handleResetFilters = () => {
    setSearchTerm("");
    updateUrlParams({ search: null, sort: null, page: 1 });
  };

  // Venue icon helper
  function VenueIcon({ venue }: { venue?: string }) {
    if (venue === "online") return <Globe className="size-3.5 shrink-0" />;
    if (venue === "onsite" || venue === "center") return <House className="size-3.5 shrink-0" />;
    return <Globe2 className="size-3.5 shrink-0" />;
  }

  const isRequiredTab = activeTab === "required";

  // Sort dropdown options
  const sortOptions: { value: StudentExamSortOption; label: string }[] = isRequiredTab
    ? [
        { value: "latest", label: t("sort.newest") },
        { value: "oldest", label: t("sort.oldest") },
        { value: "title_asc", label: t("sort.titleAsc") },
        { value: "title_desc", label: t("sort.titleDesc") },
        { value: "duration_desc", label: t("sort.durationDesc") },
        { value: "duration_asc", label: t("sort.durationAsc") },
      ]
    : [
        { value: "latest", label: t("sort.newest") },
        { value: "oldest", label: t("sort.oldest") },
        { value: "score_desc", label: t("sort.scoreDesc") },
        { value: "score_asc", label: t("sort.scoreAsc") },
        { value: "title_asc", label: t("sort.titleAsc") },
        { value: "title_desc", label: t("sort.titleDesc") },
        { value: "duration_desc", label: t("sort.durationDesc") },
        { value: "duration_asc", label: t("sort.durationAsc") },
      ];

  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];
  const isFilterActive = searchQuery.trim() !== "" || sortBy !== "latest";

  const showingText = t("pagination.showing", {
    start: totalItems > 0 ? startIndex + 1 : 0,
    end: Math.min(startIndex + pagination.per_page, totalItems),
    total: totalItems,
  });

  return (
    <div className="space-y-6 w-full">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("title")}
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {isRequiredTab
                ? t("totalRequired", { count: tabCounts.required })
                : t("totalCompleted", { count: tabCounts.completed })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <Button
          asChild
          variant="outline"
          className="gap-2 font-semibold self-start sm:self-auto rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
        >
          <Link href="/student-dashboard/exams/general">
            <FileQuestion className="h-4 w-4" />
            <span>{t("viewGeneralExams")}</span>
          </Link>
        </Button>
      </div>

      {/* ── Filter Bar & Tabs ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        {/* Search Box & Tab Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-55">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={handleSearchChange}
              className="ps-9 bg-background"
            />
          </div>

          {/* Two Tab Selectors: Required vs Completed */}
          <div className="flex items-center p-1 bg-muted rounded-lg border border-border/40 text-xs font-medium self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange("required")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "required"
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileQuestion className="size-3.5 shrink-0" />
              <span>{t("tabs.required")}</span>
              <span className="opacity-80">({tabCounts.required})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("completed")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "completed"
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{t("tabs.completed")}</span>
              <span className="opacity-80">({tabCounts.completed})</span>
            </button>
          </div>
        </div>

        {/* Sort & Reset Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5"
            >
              <X className="h-3.5 w-3.5 me-1.5" />
              {t("clearFilters")}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 text-xs sm:text-sm">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{currentSortObj?.label || sortBy}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-52">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={sortBy === opt.value ? "font-semibold bg-accent/60" : ""}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-2 border-b border-border/40"
                >
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : isRequiredTab ? (
            /* ─────────────────────────────────────────────────────────────────
               REQUIRED EXAMS TABLE
               ───────────────────────────────────────────────────────────────── */
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.title")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.subjectGrade")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.sourceCourse")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.category")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.questionsDuration")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.passingGrade")}
                  </th>
                  <th className="px-4 py-3.5 text-end text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <FileQuestion className="size-12 text-muted-foreground/40 mb-3" />
                        <h3 className="text-base font-semibold text-foreground">
                          {searchQuery.trim() ? t("empty.filteredTitle") : t("empty.requiredTitle")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          {searchQuery.trim()
                            ? t("empty.filteredDescription")
                            : t("empty.requiredDescription")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam: BackendStudentExam, idx: number) => {
                    const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                    const titleStr = getLocalizedString(exam.title);
                    const subjectStr = getLocalizedString(exam.subject?.name);
                    const stageStr = getLocalizedString(exam.educational_stage?.name);
                    const courseTitleStr = getLocalizedString(exam.course?.title);
                    const instructorName = exam.instructor?.full_name;

                    return (
                      <tr
                        key={exam.id}
                        className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                      >
                        {/* Title & Teacher */}
                        <td className="px-4 py-3.5 min-w-56 max-w-80">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2">
                              {titleStr}
                            </p>
                            {instructorName && (
                              <p className="text-xs text-muted-foreground">{instructorName}</p>
                            )}
                          </div>
                        </td>

                        {/* Subject & Grade */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">
                              {subjectStr || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">{stageStr || "-"}</span>
                          </div>
                        </td>

                        {/* Source Course */}
                        <td className="px-4 py-3.5 min-w-44">
                          {exam.scope === "course" && exam.course ? (
                            <Link
                              href={`/student-dashboard/courses/${exam.course.id}`}
                              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 line-clamp-1 group"
                            >
                              <BookOpen className="size-3.5 shrink-0" />
                              <span className="truncate">{courseTitleStr || exam.course.id}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <VenueIcon venue={exam.delivery_mode} />
                              <span>{t("table.independent")}</span>
                              {exam.delivery_mode && (
                                <span className="text-muted-foreground/80">
                                  ({formatVenue(exam.delivery_mode)})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/80">
                            {formatCategory(exam.classification)}
                          </span>
                        </td>

                        {/* Questions & Duration */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <FileQuestion className="size-3.5 shrink-0 text-muted-foreground" />
                              {t("table.questionsCount", { count: exam.questions_count })}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Timer className="size-3.5 shrink-0" />
                              {t("table.durationMinutes", { count: exam.duration_minutes })}
                            </span>
                          </div>
                        </td>

                        {/* Passing Grade */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-600">
                              {t("table.passingPercent", { percent: exam.passing_percentage })}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-end whitespace-nowrap">
                          <Button
                            asChild
                            size="sm"
                            className="rounded-lg text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-xs"
                          >
                            <Link href={`/student-dashboard/exams/${exam.id}`}>
                              <span>
                                {exam.action === "resume"
                                  ? tExams("actions.resume") || t("table.actions.takeExam")
                                  : t("table.actions.takeExam")}
                              </span>
                              <ArrowRight className="size-3.5 rtl:rotate-180" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* ─────────────────────────────────────────────────────────────────
               COMPLETED EXAMS TABLE
               ───────────────────────────────────────────────────────────────── */
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.title")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.subjectGrade")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.sourceCourse")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.score")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.status")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.completedDate")}
                  </th>
                  <th className="px-4 py-3.5 text-end text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {t("table.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <CheckCircle2 className="size-12 text-muted-foreground/40 mb-3" />
                        <h3 className="text-base font-semibold text-foreground">
                          {searchQuery.trim()
                            ? t("empty.filteredTitle")
                            : t("empty.completedTitle")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          {searchQuery.trim()
                            ? t("empty.filteredDescription")
                            : t("empty.completedDescription")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam: BackendStudentExam, idx: number) => {
                    const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                    const titleStr = getLocalizedString(exam.title);
                    const subjectStr = getLocalizedString(exam.subject?.name);
                    const stageStr = getLocalizedString(exam.educational_stage?.name);
                    const courseTitleStr = getLocalizedString(exam.course?.title);
                    const instructorName = exam.instructor?.full_name;

                    const adoptedResult = exam.adopted_result;
                    const score = adoptedResult?.score ?? 0;
                    const maxScore = adoptedResult?.max_score ?? 0;
                    const percentage = adoptedResult?.percentage ?? 0;
                    const passed = adoptedResult?.is_passed ?? exam.result_status === "passed";
                    const isPendingReview = exam.result_status === "pending_review";
                    const completedAt = adoptedResult?.completed_at;

                    return (
                      <tr
                        key={exam.id}
                        className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                      >
                        {/* Title & Teacher */}
                        <td className="px-4 py-3.5 min-w-56 max-w-80">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                              {titleStr}
                            </p>
                            {instructorName && (
                              <p className="text-xs text-muted-foreground">{instructorName}</p>
                            )}
                          </div>
                        </td>

                        {/* Subject & Grade */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">
                              {subjectStr || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">{stageStr || "-"}</span>
                          </div>
                        </td>

                        {/* Source Course */}
                        <td className="px-4 py-3.5 min-w-44">
                          {exam.scope === "course" && exam.course ? (
                            <Link
                              href={`/student-dashboard/courses/${exam.course.id}`}
                              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 line-clamp-1"
                            >
                              <BookOpen className="size-3.5 shrink-0" />
                              <span className="truncate">{courseTitleStr || exam.course.id}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <VenueIcon venue={exam.delivery_mode} />
                              <span>{t("table.independent")}</span>
                              {exam.delivery_mode && (
                                <span className="text-muted-foreground/80">
                                  ({formatVenue(exam.delivery_mode)})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            {isPendingReview ? (
                              <span className="text-xs font-semibold text-amber-600">
                                {tExams("status.pendingReview") || "قيد التصحيح"}
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`text-sm font-bold ${
                                    passed ? "text-emerald-600" : "text-rose-600"
                                  }`}
                                >
                                  {t("table.scoreDisplay", {
                                    score,
                                    totalScore: maxScore,
                                    percent: percentage,
                                  })}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {t("table.columns.passingGrade")}: {exam.passing_percentage}%
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isPendingReview ? (
                            <Badge className="bg-amber-500/15 border border-amber-500/30 text-amber-700 text-xs font-semibold gap-1">
                              <Clock className="size-3" />
                              <span>{tExams("status.pendingReview") || "قيد المراجعة"}</span>
                            </Badge>
                          ) : passed ? (
                            <Badge className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs font-semibold gap-1">
                              <CheckCircle2 className="size-3" />
                              <span>{t("table.statusPassed")}</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-semibold gap-1">
                              <XCircle className="size-3" />
                              <span>{t("table.statusFailed")}</span>
                            </Badge>
                          )}
                        </td>

                        {/* Completed Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground/70" />
                            <span>{formatDate(completedAt, locale)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="rounded-lg text-xs font-semibold gap-1.5 h-8"
                            >
                              <Link href={`/student-dashboard/exams/${exam.id}`}>
                                <FileCheck2 className="size-3.5" />
                                <span>{t("table.actions.viewResult")}</span>
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Table Footer & Pagination ─────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-border/60 bg-muted/20">
          <ContentPagination
            currentPage={pagination.current_page}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={pagination.per_page}
            showingText={showingText}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
