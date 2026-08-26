/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  BarChart3,
  CircleAlert,
  ExternalLink,
  FileQuestion,
  Globe,
  Globe2,
  House,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { getStoredExams, resetStoredExams, saveStoredExams } from "@/lib/exams-storage";
import { Exam } from "@/types/exam";
import { ContentFilters, SortOptionItem, TabItem } from "../common/content-filters";
import { ContentPagination } from "../common/content-pagination";
import { DeleteExamDialog } from "./delete-exam-dialog";

export type ExamFilterTab = "all" | "independent" | "course-dependent";
export type ExamSortOption = "date-newest" | "date-oldest" | "rating-high" | "rating-low";

// ─── Success-rate colour ──────────────────────────────────────────────────────
function successRateColor(rate: number) {
  if (rate >= 70) return "text-success";
  if (rate >= 50) return "text-warning";
  return "text-error";
}

export function ManageExamsClient() {
  const locale = useLocale();
  const t = useTranslations("exams");
  const tCourses = useTranslations("courses");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as ExamFilterTab) || "all";
  const sortBy = (searchParams.get("sort") as ExamSortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 10;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "tab" && value === "all") ||
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

  // Local state synchronized with LocalStorage
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setExams(getStoredExams(locale));
    setIsLoading(false);

    const handleUpdate = () => setExams(getStoredExams(locale));
    window.addEventListener("rewaa_exams_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("rewaa_exams_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [locale]);

  const [examToDelete, setExamToDelete] = React.useState<Exam | null>(null);

  // ─── Filter & Search ────────────────────────────────────────────────────────
  const filteredExams = React.useMemo(() => {
    return exams.filter((exam) => {
      // Tab Filter (all vs independent vs course-dependent)
      const isIndep = exam.examType === "independent" || (!exam.examType && !exam.courseId);
      if (activeTab === "independent" && !isIndep) return false;
      if (activeTab === "course-dependent" && isIndep) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          exam.title.toLowerCase().includes(q) ||
          (exam.subject || "").toLowerCase().includes(q) ||
          (exam.teacherName || "").toLowerCase().includes(q) ||
          (exam.courseTitle || "").toLowerCase().includes(q) ||
          (exam.grade || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exams, activeTab, searchQuery]);

  // ─── Sort ───────────────────────────────────────────────────────────────────
  const sortedExams = React.useMemo(() => {
    return [...filteredExams].sort((a, b) => {
      switch (sortBy) {
        case "rating-high":
          return (b.successRate || 0) - (a.successRate || 0);
        case "rating-low":
          return (a.successRate || 0) - (b.successRate || 0);
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date-newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredExams, sortBy]);

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const totalItems = sortedExams.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExams = sortedExams.slice(startIndex, startIndex + itemsPerPage);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateUrlParams({ search: e.target.value, page: 1 });

  const handleTabChange = (tab: ExamFilterTab) => updateUrlParams({ tab, page: 1 });

  const handleSortChange = (sort: ExamSortOption) => updateUrlParams({ sort, page: 1 });

  const handlePageChange = (page: number) => updateUrlParams({ page });

  const confirmDelete = () => {
    if (examToDelete) {
      const updated = exams.filter((e) => e.id !== examToDelete.id);
      setExams(updated);
      saveStoredExams(locale, updated);
      setExamToDelete(null);
    }
  };

  const handleResetData = () => {
    const reset = resetStoredExams(locale);
    setExams(reset);
  };

  const handleResetFilters = () =>
    updateUrlParams({ search: null, tab: null, sort: null, page: 1 });

  // ─── Format helpers ─────────────────────────────────────────────────────────
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
    const key = cat as Parameters<typeof t.has>[0];
    return t.has(`category.${key}` as Parameters<typeof t.has>[0])
      ? t(`category.${key}` as Parameters<typeof t>[0])
      : cat;
  };

  // ─── Tabs & sort options ────────────────────────────────────────────────────
  const tabs: TabItem<ExamFilterTab>[] = [
    { value: "all", label: t("tabs.all"), count: exams.length },
    {
      value: "independent",
      label: t("tabs.independent"),
      count: exams.filter((e) => e.examType === "independent" || (!e.examType && !e.courseId))
        .length,
    },
    {
      value: "course-dependent",
      label: t("tabs.courseLinked"),
      count: exams.filter((e) => !(e.examType === "independent" || (!e.examType && !e.courseId)))
        .length,
    },
  ];

  const sortOptions: SortOptionItem<ExamSortOption>[] = [
    { value: "date-newest", label: t("sort.newest") },
    { value: "date-oldest", label: t("sort.oldest") },
    { value: "rating-high", label: t("sort.ratingHigh") },
    { value: "rating-low", label: t("sort.ratingLow") },
  ];

  const showingText = t("pagination.showing", {
    start: Math.min(startIndex + 1, totalItems),
    end: Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

  // ─── Venue icon helper ──────────────────────────────────────────────────────
  function VenueIcon({ venue }: { venue?: string }) {
    if (venue === "online") return <Globe className="h-3.5 w-3.5 shrink-0" />;
    if (venue === "center") return <House className="h-3.5 w-3.5 shrink-0" />;
    return <Globe2 className="h-3.5 w-3.5 shrink-0" />;
  }

  // ─── Skeleton rows ──────────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr className="border-b border-border/50">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("manageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("manageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="default"
            onClick={handleResetData}
            className="gap-2 shadow-xs font-semibold"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t("resetExams")}</span>
          </Button>
          <Button asChild size="default" className="gap-2 shadow-sm font-semibold">
            <Link href={`/${locale}/dashboard/exams/new`}>
              <Plus className="h-4 w-4" />
              <span>{t("addNewExam")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────────────── */}
      <ContentFilters<ExamFilterTab, ExamSortOption>
        searchQuery={searchQuery}
        searchPlaceholder={t("searchPlaceholder")}
        activeTab={activeTab}
        tabs={tabs}
        sortBy={sortBy}
        sortOptions={sortOptions}
        clearFiltersLabel={t("clearFilters")}
        onSearchChange={handleSearchChange}
        onTabChange={handleTabChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Table header */}
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                {[
                  t("table.columns.title"),
                  t("table.columns.subjectGrade"),
                  t("table.columns.category"),
                  t("table.columns.typeVenue"),
                  t("table.columns.questions"),
                  t("table.columns.students"),
                  t("table.columns.successRate"),
                  t("table.columns.actions"),
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedExams.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <h3 className="text-base font-semibold text-foreground">
                        {t("empty.title")}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {t("empty.description")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExams.map((exam, idx) => {
                  const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                  const subjectStr = formatSubject(exam.subject);
                  const gradeStr = formatGrade(exam.grade);

                  return (
                    <tr
                      key={exam.id}
                      className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                    >
                      {/* ── Title ────────────────────────────────────────── */}
                      <td className="px-4 py-3 min-w-60 max-w-90">
                        <Link
                          href={`/${locale}/dashboard/exams/${exam.id}`}
                          className="group block"
                          title={exam.title}
                        >
                          <p className="text-sm font-bold text-foreground hover:text-primary transition-colors leading-relaxed">
                            {exam.title}
                          </p>
                        </Link>
                      </td>

                      {/* ── Subject / Grade ───────────────────────────────── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground/90">
                            {subjectStr}
                          </span>
                          <span className="text-xs font-medium text-foreground/90">{gradeStr}</span>
                        </div>
                      </td>

                      {/* ── Category ─────────────────────────────────────── */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap`}
                        >
                          {formatCategory(exam.category)}
                        </span>
                      </td>

                      {/* ── Type & Venue ──────────────────────────────────── */}
                      <td className="px-4 py-3 min-w-44">
                        {exam.examType === "independent" ? (
                          <div className="flex flex-row gap-1">
                            <VenueIcon venue={exam.venue} />
                            <span className="flex items-center gap-1.5 text-xs font-medium text-primary-dark/80">
                              {t("table.independent")}
                            </span>
                            {exam.venue && (
                              <span className="flex items-center gap-1 text-xs">
                                - {formatVenue(exam.venue)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {exam.courseId ? (
                              <Link
                                href={`/${locale}/dashboard/courses/${exam.courseId}/edit`}
                                className="flex items-start gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2 line-clamp-1"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                {exam.courseTitle || exam.courseId}
                              </Link>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* ── Questions ─────────────────────────────────────── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">
                          {t("table.questionsCount", { count: exam.numberOfQuestions })}
                        </span>
                      </td>

                      {/* ── Students ──────────────────────────────────────── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">
                          {t("table.studentsCount", { count: exam.numberOfStudents })}
                        </span>
                      </td>

                      {/* ── Success Rate ──────────────────────────────────── */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold whitespace-nowrap ${successRateColor(exam.successRate)}`}
                        >
                          {exam.successRate}%
                        </span>
                      </td>

                      {/* ── Actions ───────────────────────────────────────── */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full data-[state=open]:bg-accent"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">{t("table.columns.actions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/exams/${exam.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <BarChart3 className="h-4 w-4" />
                                <span>{t("actions.viewStats")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/exams/${exam.id}/complaints`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <CircleAlert className="h-4 w-4" />
                                <span>{t("actions.viewComplaints")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/exams/${exam.id}/edit`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                                <span>{t("actions.edit")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                              onClick={() => setExamToDelete(exam)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{t("actions.delete")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination ───────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-border/60 bg-muted/20">
          <ContentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            showingText={showingText}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <DeleteExamDialog
        examToDelete={examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
