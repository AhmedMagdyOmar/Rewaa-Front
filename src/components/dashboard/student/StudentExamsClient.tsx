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
import { getEnrolledCourseIds } from "@/lib/student-enrollment-storage";
import { Exam } from "@/types/exam";
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
  HelpCircle,
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
  | "date-newest"
  | "date-oldest"
  | "title-asc"
  | "title-desc"
  | "duration-desc"
  | "duration-asc"
  | "score-desc"
  | "score-asc";

export interface StudentCompletedExamRecord {
  exam: Exam;
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  completedAt: string;
}

function formatDate(iso: string, locale: string) {
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
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");
  const tExams = useTranslations("exams");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as StudentExamTab) || "required";
  const sortBy = (searchParams.get("sort") as StudentExamSortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 8;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "tab" && value === "required") ||
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

  // Stored state
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = React.useState<string[]>([]);
  const [passedExamIds, setPassedExamIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(() => {
    setExams(getStoredExams(locale));
    setEnrolledCourseIds(getEnrolledCourseIds());
    setPassedExamIds(getPassedExams());
    setIsLoading(false);
  }, [locale]);

  React.useEffect(() => {
    loadData();
    window.addEventListener("rewaa_exams_updated", loadData);
    window.addEventListener("rewaa_courses_updated", loadData);
    window.addEventListener("rewaa_student_enrollment_updated", loadData);
    window.addEventListener("rewaa_student_passed_exams_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("rewaa_exams_updated", loadData);
      window.removeEventListener("rewaa_courses_updated", loadData);
      window.removeEventListener("rewaa_student_enrollment_updated", loadData);
      window.removeEventListener("rewaa_student_passed_exams_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

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

  // Compute available exams for the student
  const relevantExams = React.useMemo(() => {
    const enrolledSet = new Set(enrolledCourseIds);
    return exams.filter((exam) => {
      // Either independent (available to all students) or belongs to an enrolled course
      if (exam.examType === "independent") return true;
      if (exam.courseId && enrolledSet.has(exam.courseId)) return true;
      return false;
    });
  }, [exams, enrolledCourseIds]);

  // Compute total exam points from sections or default
  const getExamMaxScore = (exam: Exam): number => {
    let sum = 0;
    if (exam.examSections && exam.examSections.length > 0) {
      exam.examSections.forEach((sec) => {
        sec.questions.forEach((q) => {
          sum += q.grade || 5;
        });
      });
    }
    return sum > 0 ? sum : Math.max(20, exam.numberOfQuestions * 2);
  };

  // Build required exams list (published exams not yet completed/passed)
  const requiredExams = React.useMemo(() => {
    const passedSet = new Set(passedExamIds);
    return relevantExams.filter((exam) => !passedSet.has(exam.id));
  }, [relevantExams, passedExamIds]);

  // Build completed exams list with deterministic scores/dates
  const completedExamsList: StudentCompletedExamRecord[] = React.useMemo(() => {
    const passedSet = new Set(passedExamIds);
    // Include all passed exams from relevant exams
    const completed = relevantExams.filter((exam) => passedSet.has(exam.id));

    return completed.map((exam, index) => {
      const maxScore = getExamMaxScore(exam);
      // Generate realistic score percentage based on passing percentage and deterministic index
      const basePercentage = Math.min(
        100,
        Math.max(exam.passingPercentage, 75 + ((index * 7) % 25)),
      );
      const score = Math.round((basePercentage / 100) * maxScore);
      const percentage = Math.round((score / maxScore) * 100);
      const passed = percentage >= exam.passingPercentage;
      const completedAt = exam.createdAt || "2026-08-10T12:00:00Z";

      return {
        exam,
        score,
        totalScore: maxScore,
        percentage,
        passed,
        attemptNumber: 1,
        completedAt,
      };
    });
  }, [relevantExams, passedExamIds]);

  // Filter required exams
  const filteredRequiredExams = React.useMemo(() => {
    if (!searchQuery.trim()) return requiredExams;
    const q = searchQuery.toLowerCase().trim();
    return requiredExams.filter((exam) => {
      return (
        exam.title.toLowerCase().includes(q) ||
        (exam.subject || "").toLowerCase().includes(q) ||
        (exam.teacherName || "").toLowerCase().includes(q) ||
        (exam.courseTitle || "").toLowerCase().includes(q) ||
        (exam.grade || "").toLowerCase().includes(q)
      );
    });
  }, [requiredExams, searchQuery]);

  // Filter completed exams
  const filteredCompletedExams = React.useMemo(() => {
    if (!searchQuery.trim()) return completedExamsList;
    const q = searchQuery.toLowerCase().trim();
    return completedExamsList.filter(({ exam }) => {
      return (
        exam.title.toLowerCase().includes(q) ||
        (exam.subject || "").toLowerCase().includes(q) ||
        (exam.teacherName || "").toLowerCase().includes(q) ||
        (exam.courseTitle || "").toLowerCase().includes(q) ||
        (exam.grade || "").toLowerCase().includes(q)
      );
    });
  }, [completedExamsList, searchQuery]);

  // Sort required exams
  const sortedRequiredExams = React.useMemo(() => {
    return [...filteredRequiredExams].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title, locale);
        case "title-desc":
          return b.title.localeCompare(a.title, locale);
        case "duration-desc":
          return b.durationMinutes - a.durationMinutes;
        case "duration-asc":
          return a.durationMinutes - b.durationMinutes;
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date-newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredRequiredExams, sortBy, locale]);

  // Sort completed exams
  const sortedCompletedExams = React.useMemo(() => {
    return [...filteredCompletedExams].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.exam.title.localeCompare(b.exam.title, locale);
        case "title-desc":
          return b.exam.title.localeCompare(a.exam.title, locale);
        case "score-desc":
          return b.percentage - a.percentage;
        case "score-asc":
          return a.percentage - b.percentage;
        case "duration-desc":
          return b.exam.durationMinutes - a.exam.durationMinutes;
        case "duration-asc":
          return a.exam.durationMinutes - b.exam.durationMinutes;
        case "date-oldest":
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        case "date-newest":
        default:
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    });
  }, [filteredCompletedExams, sortBy, locale]);

  // Active dataset & pagination calculation
  const isRequiredTab = activeTab === "required";
  const totalItems = isRequiredTab ? sortedRequiredExams.length : sortedCompletedExams.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;

  const paginatedRequiredExams = sortedRequiredExams.slice(startIndex, startIndex + itemsPerPage);
  const paginatedCompletedExams = sortedCompletedExams.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateUrlParams({ search: e.target.value, page: 1 });

  const handleTabChange = (tab: StudentExamTab) => updateUrlParams({ tab, page: 1 });

  const handleSortChange = (sort: StudentExamSortOption) => updateUrlParams({ sort, page: 1 });

  const handlePageChange = (page: number) => updateUrlParams({ page });

  const handleResetFilters = () => updateUrlParams({ search: null, sort: null, page: 1 });

  // Venue icon helper
  function VenueIcon({ venue }: { venue?: string }) {
    if (venue === "online") return <Globe className="size-3.5 shrink-0" />;
    if (venue === "center") return <House className="size-3.5 shrink-0" />;
    return <Globe2 className="size-3.5 shrink-0" />;
  }

  // Sort dropdown options
  const sortOptions: { value: StudentExamSortOption; label: string }[] = isRequiredTab
    ? [
        { value: "date-newest", label: t("sort.newest") },
        { value: "date-oldest", label: t("sort.oldest") },
        { value: "title-asc", label: t("sort.titleAsc") },
        { value: "title-desc", label: t("sort.titleDesc") },
        { value: "duration-desc", label: t("sort.durationDesc") },
        { value: "duration-asc", label: t("sort.durationAsc") },
      ]
    : [
        { value: "date-newest", label: t("sort.newest") },
        { value: "date-oldest", label: t("sort.oldest") },
        { value: "score-desc", label: t("sort.scoreDesc") },
        { value: "score-asc", label: t("sort.scoreAsc") },
        { value: "title-asc", label: t("sort.titleAsc") },
        { value: "title-desc", label: t("sort.titleDesc") },
        { value: "duration-desc", label: t("sort.durationDesc") },
        { value: "duration-asc", label: t("sort.durationAsc") },
      ];

  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];
  const isFilterActive = searchQuery.trim() !== "" || sortBy !== "date-newest";

  const showingText = t("pagination.showing", {
    start: totalItems > 0 ? startIndex + 1 : 0,
    end: Math.min(startIndex + itemsPerPage, totalItems),
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
                ? t("totalRequired", { count: requiredExams.length })
                : t("totalCompleted", { count: completedExamsList.length })}
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
              value={searchQuery}
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
              <span className="opacity-80">({requiredExams.length})</span>
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
              <span className="opacity-80">({completedExamsList.length})</span>
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
                {paginatedRequiredExams.length === 0 ? (
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
                  paginatedRequiredExams.map((exam, idx) => {
                    const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                    const subjectStr = formatSubject(exam.subject);
                    const gradeStr = formatGrade(exam.grade);

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
                              {subjectStr}
                            </span>
                            <span className="text-xs text-muted-foreground">{gradeStr}</span>
                          </div>
                        </td>

                        {/* Source Course */}
                        <td className="px-4 py-3.5 min-w-44">
                          {exam.examType === "course-dependent" && exam.courseId ? (
                            <Link
                              href={`/student-dashboard/courses/${exam.courseId}`}
                              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 line-clamp-1 group"
                            >
                              <BookOpen className="size-3.5 shrink-0" />
                              <span className="truncate">{exam.courseTitle || exam.courseId}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <VenueIcon venue={exam.venue} />
                              <span>{t("table.independent")}</span>
                              {exam.venue && (
                                <span className="text-muted-foreground/80">
                                  ({formatVenue(exam.venue)})
                                </span>
                              )}
                            </div>
                          )}
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
                              {t("table.questionsCount", { count: exam.numberOfQuestions })}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Timer className="size-3.5 shrink-0" />
                              {t("table.durationMinutes", { count: exam.durationMinutes })}
                            </span>
                          </div>
                        </td>

                        {/* Passing Grade */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-600">
                              {t("table.passingPercent", { percent: exam.passingPercentage })}
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
                              <span>{t("table.actions.takeExam")}</span>
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
                {paginatedCompletedExams.length === 0 ? (
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
                  paginatedCompletedExams.map(
                    ({ exam, score, totalScore, percentage, passed, completedAt }, idx) => {
                      const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                      const subjectStr = formatSubject(exam.subject);
                      const gradeStr = formatGrade(exam.grade);

                      return (
                        <tr
                          key={exam.id}
                          className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                        >
                          {/* Title & Teacher */}
                          <td className="px-4 py-3.5 min-w-56 max-w-80">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
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
                                {subjectStr}
                              </span>
                              <span className="text-xs text-muted-foreground">{gradeStr}</span>
                            </div>
                          </td>

                          {/* Source Course */}
                          <td className="px-4 py-3.5 min-w-44">
                            {exam.examType === "course-dependent" && exam.courseId ? (
                              <Link
                                href={`/student-dashboard/courses/${exam.courseId}`}
                                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 line-clamp-1"
                              >
                                <BookOpen className="size-3.5 shrink-0" />
                                <span className="truncate">
                                  {exam.courseTitle || exam.courseId}
                                </span>
                              </Link>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <VenueIcon venue={exam.venue} />
                                <span>{t("table.independent")}</span>
                                {exam.venue && (
                                  <span className="text-muted-foreground/80">
                                    ({formatVenue(exam.venue)})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Score */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-sm font-bold ${
                                  passed ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {t("table.scoreDisplay", {
                                  score,
                                  totalScore,
                                  percent: percentage,
                                })}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {t("table.columns.passingGrade")}: {exam.passingPercentage}%
                              </span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {passed ? (
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
                    },
                  )
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
