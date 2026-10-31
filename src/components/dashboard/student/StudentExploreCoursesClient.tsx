"use client";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { StudentAvailableCourseCard } from "@/components/dashboard/student/StudentAvailableCourseCard";
import {
  StudentCourseFilters,
  SortOptionItem,
} from "@/components/dashboard/student/StudentCourseFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicCourseCategories } from "@/hooks/use-courses";
import { useExploreCourses } from "@/hooks/use-explore-courses";
import { Link } from "@/i18n/routing";
import { ArrowLeft, BookOpen, KeyRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { StudentRedeemCodeDialog } from "./courses/StudentRedeemCodeDialog";

export function StudentExploreCoursesClient() {
  const locale = useLocale();
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
  const gradeFilter = searchParams.get("grade") || null;
  const subjectFilter = searchParams.get("subject") || null;
  const categoryFilter = searchParams.get("category") || null;
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          value === "all" ||
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
    educational_stage_id: gradeFilter ? Number(gradeFilter) : undefined,
    subject_id: subjectFilter ? Number(subjectFilter) : undefined,
    category: categoryFilter || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const { data: categoriesData } = usePublicCourseCategories();

  const courses = React.useMemo(() => data?.courses ?? [], [data?.courses]);
  const pagination = data?.pagination;
  const totalItems = pagination?.total ?? courses.length;
  const totalPages = (pagination?.last_page ?? Math.ceil(totalItems / itemsPerPage)) || 1;

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;

  // Derive available filter options dynamically from current courses / metadata
  const gradeOptions = React.useMemo(() => {
    const map = new Map<string | number, string>();
    courses.forEach((c) => {
      if (c.educational_stage) {
        const name =
          c.educational_stage.name?.[locale] ??
          c.educational_stage.name?.ar ??
          c.educational_stage.name?.en ??
          `Grade ${c.educational_stage.id}`;
        map.set(c.educational_stage.id, name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [courses, locale]);

  const subjectOptions = React.useMemo(() => {
    const map = new Map<string | number, string>();
    courses.forEach((c) => {
      if (c.subject) {
        const name =
          c.subject.name?.[locale] ??
          c.subject.name?.ar ??
          c.subject.name?.en ??
          `Subject ${c.subject.id}`;
        map.set(c.subject.id, name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [courses, locale]);

  const categoryOptions = React.useMemo(() => {
    const list = categoriesData?.categories ?? [];
    return list.map((cat) => ({
      id: cat.code,
      name: cat.name?.[locale] ?? cat.name?.ar ?? cat.name?.en ?? cat.name_label ?? cat.code,
    }));
  }, [categoriesData?.categories, locale]);

  // Handlers
  const handleSearchChange = (search: string) => {
    updateUrlParams({ search, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handleGradeChange = (grade: string | null) => {
    updateUrlParams({ grade, page: 1 });
  };

  const handleSubjectChange = (subject: string | null) => {
    updateUrlParams({ subject, page: 1 });
  };

  const handleCategoryChange = (category: string | null) => {
    updateUrlParams({ category, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handleResetFilters = () => {
    updateUrlParams({
      search: null,
      sort: null,
      grade: null,
      subject: null,
      category: null,
      page: 1,
    });
  };

  const showingText = t("pagination.showing", {
    start: totalItems > 0 ? (pagination?.from ?? startIndex + 1) : 0,
    end: pagination?.to ?? Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

  const isSearchEmpty = !isLoading && Boolean(searchQuery) && courses.length === 0;
  const isInitialEmpty = !isLoading && !searchQuery && courses.length === 0;

  const tRedeem = useTranslations("studentDashboard.activationCodeRedemption");
  const [redeemDialogOpen, setRedeemDialogOpen] = React.useState(false);

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

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="default"
            onClick={() => setRedeemDialogOpen(true)}
            className="gap-2 border-border/80 font-semibold"
          >
            <KeyRound className="size-4 text-primary" />
            <span>{tRedeem("button")}</span>
          </Button>

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

      <StudentRedeemCodeDialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen} />

      {/* ──────────────────────────────────────────────────────────────────────────────
          2. FILTER & SEARCH TOOLBAR
      ────────────────────────────────────────────────────────────────────────────── */}
      <StudentCourseFilters
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOptions={sortOptions}
        defaultSort={defaultSort}
        selectedGradeId={gradeFilter}
        selectedSubjectId={subjectFilter}
        selectedCategory={categoryFilter}
        grades={gradeOptions}
        subjects={subjectOptions}
        categories={categoryOptions}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onGradeChange={handleGradeChange}
        onSubjectChange={handleSubjectChange}
        onCategoryChange={handleCategoryChange}
        onResetFilters={handleResetFilters}
      />

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. COURSES GRID / SKELETON / EMPTY STATE
      ────────────────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-2xl bg-card border border-border/70 shadow-xs overflow-hidden text-right h-full"
            >
              <div className="aspect-[16/9] w-full bg-muted animate-pulse" />
              <div className="p-4 pb-3 space-y-2.5">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-2/3 rounded" />
              </div>
              <div className="p-4 pt-0 mt-auto">
                <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-2.5 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="mt-3.5 h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isInitialEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
        </div>
      ) : isSearchEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="mt-4 gap-2 rounded-xl"
          >
            <span>{t("clearFilters")}</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
