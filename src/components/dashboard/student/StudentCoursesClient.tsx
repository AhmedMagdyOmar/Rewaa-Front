"use client";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCourses } from "@/hooks/use-my-courses";
import { Link } from "@/i18n/routing";
import { BookOpen, Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { StudentCourseFilters, SortOptionItem } from "./StudentCourseFilters";
import { StudentEnrolledCourseCard } from "./StudentEnrolledCourseCard";

export function StudentCoursesClient() {
  const t = useTranslations("studentDashboard.coursesPage");
  const tEnrolled = useTranslations("studentDashboard.enrolledCourses");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Supported sort options from backend IndexCourseRequest / StudentCourseService
  const sortOptions: SortOptionItem[] = React.useMemo(
    () => [
      { value: "latest", label: t("sort.newest") },
      { value: "oldest", label: t("sort.oldest") },
      { value: "title_asc", label: t("sort.titleAsc") },
      { value: "title_desc", label: t("sort.titleDesc") },
      { value: "progress_desc", label: t("sort.progressHigh") },
      { value: "progress_asc", label: t("sort.progressLow") },
    ],
    [t],
  );

  const defaultSort = "latest";

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || defaultSort;
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 4;

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

  // Fetch data using TanStack Query
  const { data, isLoading } = useMyCourses({
    search: searchQuery || undefined,
    sort: sortBy || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const courses = data?.courses || [];
  const pagination = data?.pagination;
  const totalItems = pagination?.total ?? courses.length;
  const totalPages = pagination?.last_page ?? (Math.ceil(totalItems / itemsPerPage) || 1);
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

  const isInitialEmpty = !isLoading && !searchQuery && courses.length === 0;
  const isSearchEmpty = !isLoading && Boolean(searchQuery) && courses.length === 0;

  return (
    <div className="space-y-6 w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("title")}
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {t("totalEnrolled", { count: totalItems })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button asChild size="default" className="gap-2 shadow-xs font-semibold">
            <Link href="/student-dashboard/courses/explore">
              <Compass className="size-4" />
              <span>{t("exploreAll")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters (Search & Sort) */}
      <StudentCourseFilters
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOptions={sortOptions}
        defaultSort={defaultSort}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* Courses List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 p-4 sm:p-5 rounded-2xl bg-card border border-border/60"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <Skeleton className="aspect-video sm:aspect-4/3 w-full sm:w-36 md:w-44 h-auto sm:h-28 rounded-xl" />
                <div className="space-y-3 flex-1 w-full">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded-xl self-end md:self-center" />
            </div>
          ))}
        </div>
      ) : isInitialEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{tEnrolled("title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{tEnrolled("empty")}</p>
        </div>
      ) : isSearchEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course, idx) => (
            <StudentEnrolledCourseCard
              key={course.course_id ?? course.enrollment_id ?? course.id ?? `course-${idx}`}
              course={course}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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
