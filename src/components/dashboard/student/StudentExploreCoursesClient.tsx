"use client";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { CourseCard } from "@/components/dashboard/courses/course-card";
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
import { getStoredCourses } from "@/lib/courses-storage";
import { getEnrolledCourseIds } from "@/lib/student-enrollment-storage";
import { Course } from "@/types/course";
import { ArrowLeft, ArrowUpDown, BookOpen, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export type ExploreCourseSortOption =
  | "date-newest"
  | "date-oldest"
  | "title-asc"
  | "title-desc"
  | "students-desc"
  | "price-asc"
  | "price-desc";

export function StudentExploreCoursesClient() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.exploreCoursesPage");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const sortBy = (searchParams.get("sort") as ExploreCourseSortOption) || "date-newest";
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

  // Load published courses and enrolled IDs
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = () => {
      const allCourses = getStoredCourses(locale);
      setCourses(allCourses.filter((c) => !c.isDraft));
      setEnrolledIds(getEnrolledCourseIds());
      setIsLoading(false);
    };

    loadData();
    window.addEventListener("rewaa_courses_updated", loadData);
    window.addEventListener("rewaa_student_enrollment_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("rewaa_courses_updated", loadData);
      window.removeEventListener("rewaa_student_enrollment_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [locale]);

  // Set of enrolled course IDs
  const enrolledCourseIds = React.useMemo(() => {
    return new Set(enrolledIds);
  }, [enrolledIds]);

  // Available courses: ONLY courses that the student is NOT enrolled in
  const availableCourses = React.useMemo(() => {
    return courses.filter((course) => !enrolledCourseIds.has(course.id));
  }, [courses, enrolledCourseIds]);

  // Filter Logic (Search by course title, subject, grade, teacher name)
  const filteredCourses = React.useMemo(() => {
    if (!searchQuery.trim()) return availableCourses;
    const query = searchQuery.toLowerCase().trim();

    return availableCourses.filter((course) => {
      const matchesTitle = course.title.toLowerCase().includes(query);
      const matchesSubject = course.subject?.toLowerCase().includes(query);
      const matchesGrade = course.grade?.toLowerCase().includes(query);
      const matchesTeacher = course.teacherName?.toLowerCase().includes(query);
      return matchesTitle || matchesSubject || matchesGrade || matchesTeacher;
    });
  }, [availableCourses, searchQuery]);

  // Sort Logic
  const sortedCourses = React.useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title, locale);
        case "title-desc":
          return b.title.localeCompare(a.title, locale);
        case "date-newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "students-desc":
          return b.numberOfParticipants - a.numberOfParticipants;
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [filteredCourses, sortBy, locale]);

  // Pagination Logic (8 items per page)
  const totalItems = sortedCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedCourses = sortedCourses.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrlParams({ search: e.target.value, page: 1 });
  };

  const handleSortChange = (sort: ExploreCourseSortOption) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handleResetFilters = () => {
    updateUrlParams({ search: null, sort: null, page: 1 });
  };

  const sortOptions: { value: ExploreCourseSortOption; label: string }[] = [
    { value: "date-newest", label: t("sort.newest") },
    { value: "date-oldest", label: t("sort.oldest") },
    { value: "title-asc", label: t("sort.titleAsc") },
    { value: "title-desc", label: t("sort.titleDesc") },
    { value: "students-desc", label: t("sort.studentsDesc") },
    { value: "price-asc", label: t("sort.priceAsc") },
    { value: "price-desc", label: t("sort.priceDesc") },
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
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {t("totalAvailable", { count: availableCourses.length })}
            </span>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
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
      ) : paginatedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
          {isFilterActive && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-2">
              <X className="size-3.5" />
              <span>{t("clearFilters")}</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginatedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              mode="student"
              isEnrolled={enrolledCourseIds.has(course.id)}
              enrollHref={`/student-dashboard/courses/${course.id}`}
            />
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
