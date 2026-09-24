"use client";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { StudentAvailableCourseCard } from "@/components/dashboard/student/StudentAvailableCourseCard";
import {
  StudentCourseFilters,
  SortOptionItem,
} from "@/components/dashboard/student/StudentCourseFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExploreCourses } from "@/hooks/use-explore-courses";
import { Link } from "@/i18n/routing";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export function StudentExploreCoursesClient() {
  const t = useTranslations("studentDashboard.exploreCoursesPage");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Backend-aligned sort keys (matching IndexCourseRequest validator)
  const sortOptions: SortOptionItem[] = React.useMemo(
    () => [
      { value: "latest", label: t("sort.newest") },
      { value: "oldest", label: t("sort.oldest") },
      { value: "title_asc", label: t("sort.titleAsc") },
      { value: "title_desc", label: t("sort.titleDesc") },
      { value: "most_enrolled", label: t("sort.mostPopular") },
      { value: "price_asc", label: t("sort.priceAsc") },
      { value: "price_desc", label: t("sort.priceDesc") },
    ],
    [t],
  );

  const defaultSort = "latest";
  const itemsPerPage = 8;

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || defaultSort;
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "sort" && value === defaultSort) ||
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

  // Fetch available courses from backend (server handles filtering, sorting, pagination)
  const { data, isLoading } = useExploreCourses({
    search: searchQuery || undefined,
    sort: sortBy || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const courses = data?.courses || [];
  const pagination = data?.pagination;
  const totalItems = pagination?.total ?? courses.length;
  const totalPages = (pagination?.last_page ?? Math.ceil(totalItems / itemsPerPage)) || 1;

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;

  // Handlers
  const handleSearchChange = (search: string) => {
    updateUrlParams({ search, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handleResetFilters = () => {
    updateUrlParams({ search: null, sort: null, page: 1 });
  };

  const showingText = t("pagination.showing", {
    start: totalItems > 0 ? (pagination?.from ?? startIndex + 1) : 0,
    end: pagination?.to ?? Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

  const isSearchEmpty = !isLoading && Boolean(searchQuery) && courses.length === 0;
  const isInitialEmpty = !isLoading && !searchQuery && courses.length === 0;

  return (
    <div className="space-y-6 w-full">
      {/* ──────────────────────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <Link href="/student-dashboard/courses">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("title")}
            </h1>
            {!isLoading && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {t("totalAvailable", { count: totalItems })}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 ps-12">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            asChild
            variant="outline"
            size="default"
            className="gap-2 shadow-xs font-semibold"
          >
            <Link href="/student-dashboard/courses">
              <BookOpen className="size-4" />
              <span>{t("myCourses")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          2. FILTER & SEARCH TOOLBAR
      ────────────────────────────────────────────────────────────────────────────── */}
      <StudentCourseFilters
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOptions={sortOptions}
        defaultSort={defaultSort}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. COURSES GRID / SKELETON / EMPTY STATE
      ────────────────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden p-4 space-y-3"
            >
              <Skeleton className="h-44 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-border/40">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : isInitialEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
        </div>
      ) : isSearchEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-2">
            <span>{t("clearFilters")}</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course) => (
            <StudentAvailableCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────────
          4. PAGINATION FOOTER
      ────────────────────────────────────────────────────────────────────────────── */}
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
  );
}
