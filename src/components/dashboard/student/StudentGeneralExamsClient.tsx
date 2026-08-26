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
import { Link } from "@/i18n/routing";
import { getStoredExams } from "@/lib/exams-storage";
import { getPassedExams } from "@/lib/student-course-progress";
import { Exam } from "@/types/exam";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  FileQuestion,
  Globe,
  Globe2,
  HelpCircle,
  House,
  RotateCcw,
  Search,
  Timer,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export type GeneralExamSortOption =
  | "date-newest"
  | "date-oldest"
  | "title-asc"
  | "title-desc"
  | "duration-asc"
  | "duration-desc";

export function StudentGeneralExamsClient() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.generalExamsPage");
  const tExams = useTranslations("studentDashboard.examsPage");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");
  const tGeneralExamTypes = useTranslations("exams");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const sortBy = (searchParams.get("sort") as GeneralExamSortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 8;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "sort" && value === "date-newest") ||
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

  const [exams, setExams] = React.useState<Exam[]>([]);
  const [passedExamIds, setPassedExamIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(() => {
    const stored = getStoredExams(locale);
    // Filter to ONLY independent exams
    const independentExams = stored.filter((e) => e.examType === "independent");
    setExams(independentExams);
    setPassedExamIds(getPassedExams());
    setIsLoading(false);
  }, [locale]);

  React.useEffect(() => {
    loadData();
    window.addEventListener("rewaa_exams_updated", loadData);
    window.addEventListener("rewaa_student_passed_exams_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("rewaa_exams_updated", loadData);
      window.removeEventListener("rewaa_student_passed_exams_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

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
    const key = cat as Parameters<typeof tGeneralExamTypes.has>[0];
    return tGeneralExamTypes.has(`category.${key}` as Parameters<typeof tGeneralExamTypes.has>[0])
      ? tGeneralExamTypes(`category.${key}` as Parameters<typeof tGeneralExamTypes>[0])
      : cat;
  };

  function VenueIcon({ venue }: { venue?: string }) {
    if (venue === "online") return <Globe className="size-3.5 shrink-0" />;
    if (venue === "center") return <House className="size-3.5 shrink-0" />;
    return <Globe2 className="size-3.5 shrink-0" />;
  }

  // Filtering
  const filteredExams = React.useMemo(() => {
    return exams.filter((exam) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = exam.title?.toLowerCase().includes(q);
        const matchesTeacher = exam.teacherName?.toLowerCase().includes(q);
        const matchesSubject = exam.subject?.toLowerCase().includes(q);
        const matchesGrade = exam.grade?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTeacher && !matchesSubject && !matchesGrade) return false;
      }
      return true;
    });
  }, [exams, searchQuery]);

  // Sorting
  const sortedExams = React.useMemo(() => {
    return [...filteredExams].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title, locale);
        case "title-desc":
          return b.title.localeCompare(a.title, locale);
        case "duration-asc":
          return a.durationMinutes - b.durationMinutes;
        case "duration-desc":
          return b.durationMinutes - a.durationMinutes;
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date-newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredExams, sortBy, locale]);

  // Pagination
  const totalItems = sortedExams.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedExams = sortedExams.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrlParams({ search: e.target.value, page: 1 });
  };

  const handleSortChange = (sort: GeneralExamSortOption) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handleResetFilters = () => {
    updateUrlParams({ search: null, sort: null, page: 1 });
  };

  const isFilterActive = searchQuery.trim() !== "" || sortBy !== "date-newest";

  const sortOptions: { value: GeneralExamSortOption; label: string }[] = [
    { value: "date-newest", label: tExams("sort.newest") },
    { value: "date-oldest", label: tExams("sort.oldest") },
    { value: "title-asc", label: tExams("sort.titleAsc") },
    { value: "title-desc", label: tExams("sort.titleDesc") },
    { value: "duration-desc", label: tExams("sort.durationDesc") },
    { value: "duration-asc", label: tExams("sort.durationAsc") },
  ];

  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  const showingText = tExams("pagination.showing", {
    start: totalItems > 0 ? startIndex + 1 : 0,
    end: Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

  return (
    <div className="space-y-6 w-full">
      {/* ── Top Header with Standard Back Button ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <Link href="/student-dashboard/exams">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("title")}
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {t("totalAvailable", { count: exams.length })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-55">
          <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={tExams("searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearchChange}
            className="ps-9 bg-background"
          />
        </div>

        {/* Sort & Reset Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5"
            >
              <X className="h-3.5 w-3.5 me-1.5" />
              {tExams("clearFilters")}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-medium bg-background"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{currentSortObj?.label || sortBy}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
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
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.title")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.subjectGrade")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.sourceCourse")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.category")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.questionsDuration")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.passingGrade")}
                  </th>
                  <th className="px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.status")}
                  </th>
                  <th className="px-4 py-3.5 text-end text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {tExams("table.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedExams.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <FileQuestion className="size-12 text-muted-foreground/40 mb-3" />
                        <h3 className="text-base font-semibold text-foreground">
                          {searchQuery.trim() ? tExams("empty.filteredTitle") : t("empty.title")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          {searchQuery.trim()
                            ? tExams("empty.filteredDescription")
                            : t("empty.description")}
                        </p>
                        {isFilterActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-4 text-xs"
                          >
                            {tExams("clearFilters")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedExams.map((exam, idx) => {
                    const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                    const isPassed = passedExamIds.includes(exam.id);
                    const subjectStr = formatSubject(exam.subject);
                    const gradeStr = formatGrade(exam.grade);
                    const totalQuestions =
                      exam.examSections && exam.examSections.length > 0
                        ? exam.examSections.reduce((acc, es) => acc + es.questions.length, 0)
                        : exam.numberOfQuestions;

                    return (
                      <tr
                        key={exam.id}
                        className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                      >
                        {/* Title & Teacher */}
                        <td className="px-4 py-3.5 min-w-56 max-w-80">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2">
                              {exam.title}
                            </p>
                            {exam.teacherName && (
                              <p className="text-xs text-muted-foreground">{exam.teacherName}</p>
                            )}
                          </div>
                        </td>

                        {/* Subject & Grade */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">
                              {subjectStr || "—"}
                            </span>
                            {gradeStr && (
                              <span className="text-xs text-muted-foreground">{gradeStr}</span>
                            )}
                          </div>
                        </td>

                        {/* Source / Scope */}
                        <td className="px-4 py-3.5 min-w-44">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <VenueIcon venue={exam.venue} />
                            <span>{tExams("table.independent")}</span>
                            {exam.venue && (
                              <span className="text-muted-foreground/80">
                                ({formatVenue(exam.venue)})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/80">
                            {formatCategory(exam.category)}
                          </span>
                        </td>

                        {/* Questions & Duration */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" />
                              {tExams("table.questionsCount", { count: totalQuestions })}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Timer className="size-3.5 shrink-0" />
                              {tExams("table.durationMinutes", { count: exam.durationMinutes })}
                            </span>
                          </div>
                        </td>

                        {/* Passing Grade */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-600">
                              {tExams("table.passingPercent", { percent: exam.passingPercentage })}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isPassed ? (
                            <Badge className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs font-semibold gap-1">
                              <CheckCircle2 className="size-3" />
                              <span>{tExams("table.statusPassed")}</span>
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-end whitespace-nowrap">
                          <Button
                            asChild
                            variant={isPassed ? "outline" : "default"}
                            size="sm"
                            className="rounded-lg text-xs font-bold gap-1.5 shadow-xs"
                          >
                            <Link href={`/student-dashboard/exams/${exam.id}`}>
                              {isPassed ? (
                                <>
                                  <RotateCcw className="size-3.5" />
                                  <span>{tExams("table.actions.retakeExam")}</span>
                                </>
                              ) : (
                                <>
                                  <span>{tExams("table.actions.takeExam")}</span>
                                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                                </>
                              )}
                            </Link>
                          </Button>
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
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            showingText={showingText}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
