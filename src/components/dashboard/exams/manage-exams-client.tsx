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
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { useDeleteExam, useProviderExams } from "@/hooks/use-exams";
import type { BackendExam } from "@/types/api-contracts";
import { ContentFilters, SortOptionItem, TabItem } from "../common/content-filters";
import { ContentPagination } from "../common/content-pagination";
import { DeleteExamDialog } from "./delete-exam-dialog";

const emptySubscribe = () => () => {};

export type ExamFilterTab = "all" | "published" | "draft" | "scheduled";
export type ExamSortOption = "latest" | "oldest";

export function ManageExamsClient() {
  const locale = useLocale();
  const t = useTranslations("exams");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as ExamFilterTab) || "all";
  const sortBy = (searchParams.get("sort") as ExamSortOption) || "latest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 12;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "tab" && value === "all") ||
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

  // Live Query from backend
  const {
    data: examsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useProviderExams({
    search: searchQuery || undefined,
    status: activeTab !== "all" ? activeTab : undefined,
    sort: sortBy,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const deleteExamMutation = useDeleteExam();
  const [examToDelete, setExamToDelete] = React.useState<BackendExam | null>(null);

  const exams: BackendExam[] = examsResponse?.exams || [];
  const statusCounts = examsResponse?.status_counts || {
    all: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
  };
  const pagination = examsResponse?.pagination;
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateUrlParams({ search: e.target.value, page: 1 });

  const handleTabChange = (tab: ExamFilterTab) => updateUrlParams({ tab, page: 1 });

  const handleSortChange = (sort: ExamSortOption) => updateUrlParams({ sort, page: 1 });

  const handlePageChange = (page: number) => updateUrlParams({ page });

  const confirmDelete = async () => {
    if (examToDelete) {
      try {
        await deleteExamMutation.mutateAsync(examToDelete.id);
        toast.success(locale === "ar" ? "تم حذف الامتحان بنجاح" : "Exam deleted successfully");
        setExamToDelete(null);
      } catch {
        toast.error(locale === "ar" ? "فشل في حذف الامتحان" : "Failed to delete exam");
      }
    }
  };

  const handleResetFilters = () =>
    updateUrlParams({ search: null, tab: null, sort: null, page: 1 });

  // ─── Format helpers ─────────────────────────────────────────────────────────
  const formatGrade = (exam: BackendExam) => {
    return exam.educational_stage?.name?.[locale] || exam.educational_stage?.name?.ar || "";
  };

  const formatSubject = (exam: BackendExam) => {
    return exam.subject?.name?.[locale] || exam.subject?.name?.ar || "";
  };

  const formatCategory = (cat: string) => {
    const key = cat as Parameters<typeof t.has>[0];
    return t.has(`category.${key}` as Parameters<typeof t.has>[0])
      ? t(`category.${key}` as Parameters<typeof t>[0])
      : cat;
  };

  // ─── Tabs & sort options ────────────────────────────────────────────────────
  const tabs: TabItem<ExamFilterTab>[] = [
    { value: "all", label: t("tabs.all"), count: statusCounts.all },
    { value: "published", label: "المنشورة", count: statusCounts.published },
    { value: "draft", label: "المسودة", count: statusCounts.draft },
    { value: "scheduled", label: "المجدولة", count: statusCounts.scheduled },
  ];

  const sortOptions: SortOptionItem<ExamSortOption>[] = [
    { value: "latest", label: t("sort.newest") },
    { value: "oldest", label: t("sort.oldest") },
  ];

  const showingText = t("pagination.showing", {
    start: Math.min(startIndex + 1, totalItems),
    end: Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

  // ─── Venue icon helper ──────────────────────────────────────────────────────
  function VenueIcon({ venue }: { venue?: string }) {
    if (venue === "online") return <Globe className="h-3.5 w-3.5 shrink-0" />;
    if (venue === "onsite" || venue === "center") return <House className="h-3.5 w-3.5 shrink-0" />;
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isMounted && isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isMounted && isFetching ? "animate-spin" : ""}`} />
            <span>{locale === "ar" ? "تحديث" : "Refresh"}</span>
          </Button>

          <Button asChild size="default" className="gap-2 shadow-xs font-semibold shrink-0">
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
        defaultTab="all"
        defaultSort="latest"
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
                  t("table.columns.status"),
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
              ) : exams.length === 0 ? (
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
                exams.map((exam, idx) => {
                  const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                  const subjectStr = formatSubject(exam);
                  const gradeStr = formatGrade(exam);
                  const examTitle = exam.title[locale] || exam.title.ar || "";

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
                          title={examTitle}
                        >
                          <p className="text-sm font-bold text-foreground hover:text-primary transition-colors leading-relaxed">
                            {examTitle}
                          </p>
                          {exam.instructor && (
                            <p className="text-[11px] text-muted-foreground">
                              {exam.instructor.full_name}
                            </p>
                          )}
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
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-muted/60`}
                        >
                          {exam.classification_label || formatCategory(exam.classification)}
                        </span>
                      </td>

                      {/* ── Type & Venue ──────────────────────────────────── */}
                      <td className="px-4 py-3 min-w-44">
                        {exam.is_standalone ? (
                          <div className="flex flex-row gap-1 items-center">
                            <VenueIcon venue={exam.delivery_mode} />
                            <span className="text-xs font-medium text-primary-dark/80">
                              {t("table.independent")}
                            </span>
                            {exam.delivery_mode_label && (
                              <span className="text-xs text-muted-foreground">
                                - {exam.delivery_mode_label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {exam.course ? (
                              <Link
                                href={`/${locale}/dashboard/courses/${exam.course_id}/edit`}
                                className="flex items-start gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2 line-clamp-1"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                                {exam.course.title[locale] || exam.course.title.ar}
                              </Link>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* ── Questions ─────────────────────────────────────── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">
                          {t("table.questionsCount", { count: exam.questions_count || 0 })}
                        </span>
                      </td>

                      {/* ── Students ──────────────────────────────────────── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">
                          {t("table.studentsCount", { count: exam.students_count || 0 })}
                        </span>
                      </td>

                      {/* ── Status Badge ──────────────────────────────────── */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full ${
                            exam.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : exam.status === "scheduled"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {exam.status_label || exam.status}
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
