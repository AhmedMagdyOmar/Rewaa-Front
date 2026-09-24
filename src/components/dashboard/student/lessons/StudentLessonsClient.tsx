/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentStandaloneLessons } from "@/hooks/use-student-lesson";
import type { BackendStudentLessonDetail } from "@/types/api-contracts";
import { ArrowUpDown, BookOpen, FileText, Filter, Search, Video, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { StudentLessonCard } from "./StudentLessonCard";

export type StudentLessonSortOption = "latest" | "oldest" | "title_asc" | "title_desc";

export function StudentLessonsClient() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.lessonsPage");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const activeTab = (searchParams.get("tab") as "all" | "completed" | "incomplete") || "all";
  const searchQuery = searchParams.get("search") || "";
  const selectedType = searchParams.get("type") || "all";
  const selectedSubject = searchParams.get("subject") || "all";
  const sortBy = (searchParams.get("sort") as StudentLessonSortOption) || "latest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 8;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "tab" && value === "all") ||
          (key === "type" && value === "all") ||
          (key === "subject" && value === "all") ||
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

  // Local state for search debouncing
  const [searchTerm, setSearchTerm] = React.useState(searchQuery);

  React.useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        updateUrlParams({ search: searchTerm, page: 1 });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, searchQuery, updateUrlParams]);

  // Query Backend for Standalone Lessons
  const { data, isLoading, isError, refetch } = useStudentStandaloneLessons({
    tab: activeTab,
    search: searchQuery || undefined,
    type: selectedType !== "all" ? selectedType : undefined,
    subject_id: selectedSubject !== "all" ? selectedSubject : undefined,
    sort: sortBy,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const lessons: BackendStudentLessonDetail[] = React.useMemo(
    () => data?.lessons || [],
    [data?.lessons],
  );
  const tabCounts = data?.tab_counts || { all: 0, completed: 0, incomplete: 0 };
  const pagination = data?.pagination;
  const totalPages = pagination?.last_page || 1;
  const totalLessons = pagination?.total || 0;

  // Derive subjects list dynamically from available lessons
  const availableSubjects = React.useMemo(() => {
    const map = new Map<number, string>();
    lessons.forEach((l) => {
      if (l.subject?.id && l.subject.name) {
        const name = l.subject.name[locale] || l.subject.name.ar || l.subject.name.en || "";
        if (name) map.set(l.subject.id, name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id: String(id), name }));
  }, [lessons, locale]);

  const activeFiltersCount =
    (selectedType !== "all" ? 1 : 0) +
    (selectedSubject !== "all" ? 1 : 0) +
    (sortBy !== "latest" ? 1 : 0);

  const clearAllFilters = () => {
    updateUrlParams({
      search: null,
      type: null,
      subject: null,
      sort: null,
      page: 1,
    });
    setSearchTerm("");
  };

  const getSortLabel = (sort: StudentLessonSortOption) => {
    switch (sort) {
      case "latest":
        return t("sort.newest");
      case "oldest":
        return t("sort.oldest");
      case "title_asc":
        return t("sort.titleAsc");
      case "title_desc":
        return t("sort.titleDesc");
      default:
        return t("sort.label");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title") || "Independent Lessons"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("description") || "Browse and study standalone lessons and educational resources."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-px">
        <button
          type="button"
          onClick={() => updateUrlParams({ tab: "all", page: 1 })}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>{t("tabs.all") || "All Lessons"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-muted font-normal">
            {tabCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => updateUrlParams({ tab: "completed", page: 1 })}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "completed"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>{t("tabs.completed") || "Completed"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-600 font-normal">
            {tabCounts.completed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => updateUrlParams({ tab: "incomplete", page: 1 })}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "incomplete"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>{t("tabs.incomplete") || "In Progress"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 font-normal">
            {tabCounts.incomplete}
          </span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("filters.searchPlaceholder") || "Search lessons..."}
            className="ps-9 pe-9 h-10 rounded-xl bg-card border-border/60"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                updateUrlParams({ search: null, page: 1 });
              }}
              className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter / Sort Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedType !== "all" ? "default" : "outline"}
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-xs font-medium"
              >
                {selectedType === "video_and_text" ? (
                  <Video className="size-3.5" />
                ) : selectedType === "text_only" ? (
                  <FileText className="size-3.5" />
                ) : (
                  <Filter className="size-3.5" />
                )}
                <span>
                  {selectedType === "video_and_text"
                    ? t("card.videoText")
                    : selectedType === "text_only"
                      ? t("card.textOnly")
                      : t("filters.allTypes")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
              <DropdownMenuItem onClick={() => updateUrlParams({ type: "all", page: 1 })}>
                {t("filters.allTypes")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateUrlParams({ type: "video_and_text", page: 1 })}
              >
                <Video className="size-3.5 me-2" />
                {t("card.videoText")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateUrlParams({ type: "text_only", page: 1 })}>
                <FileText className="size-3.5 me-2" />
                {t("card.textOnly")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Subject Filter (if subjects available) */}
          {availableSubjects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedSubject !== "all" ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl text-xs font-medium"
                >
                  <BookOpen className="size-3.5" />
                  <span>
                    {availableSubjects.find((s) => s.id === selectedSubject)?.name ||
                      t("filters.allSubjects")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"} className="w-48">
                <DropdownMenuItem onClick={() => updateUrlParams({ subject: "all", page: 1 })}>
                  {t("filters.allSubjects")}
                </DropdownMenuItem>
                {availableSubjects.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => updateUrlParams({ subject: s.id, page: 1 })}
                  >
                    {s.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Sort By */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-xs font-medium"
              >
                <ArrowUpDown className="size-3.5" />
                <span>{getSortLabel(sortBy)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
              <DropdownMenuItem onClick={() => updateUrlParams({ sort: "latest", page: 1 })}>
                {t("sort.newest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateUrlParams({ sort: "oldest", page: 1 })}>
                {t("sort.oldest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateUrlParams({ sort: "title_asc", page: 1 })}>
                {t("sort.titleAsc")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateUrlParams({ sort: "title_desc", page: 1 })}>
                {t("sort.titleDesc")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filters */}
          {(activeFiltersCount > 0 || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5 me-1" />
              <span>{t("filters.clear")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border/60 p-4 space-y-3 overflow-hidden shadow-xs"
            >
              <Skeleton className="w-full aspect-video rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="pt-2 border-t border-border/40">
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/20 max-w-md mx-auto space-y-3">
          <p className="text-sm text-destructive font-medium">
            {t("error.loadFailed") || "Failed to load lessons from server."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            {t("error.retry") || "Retry"}
          </Button>
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-2xl border border-border/60 p-8 space-y-4 max-w-lg mx-auto">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <BookOpen className="size-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              {t("empty.title") || "No lessons found"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {searchQuery || activeFiltersCount > 0
                ? t("empty.filtersDescription") ||
                  "Try adjusting your filters or search query to find lessons."
                : t("empty.description") ||
                  "There are no standalone lessons published at the moment."}
            </p>
          </div>
          {(searchQuery || activeFiltersCount > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="rounded-xl text-xs"
            >
              {t("filters.clear")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lessons.map((lesson) => (
              <StudentLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-border/40">
              <ContentPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalLessons}
                startIndex={(currentPage - 1) * itemsPerPage}
                itemsPerPage={itemsPerPage}
                showingText={
                  isAr
                    ? `عرض ${Math.min((currentPage - 1) * itemsPerPage + 1, totalLessons)} - ${Math.min(currentPage * itemsPerPage, totalLessons)} من ${totalLessons} درس`
                    : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalLessons)} - ${Math.min(currentPage * itemsPerPage, totalLessons)} of ${totalLessons} lessons`
                }
                onPageChange={(page) => updateUrlParams({ page })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
