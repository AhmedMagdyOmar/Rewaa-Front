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
import { useStudentTeacher } from "@/hooks/use-student-teachers";
import { Link } from "@/i18n/routing";
import { ArrowLeft, BookOpen, Sparkles, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface StudentTeacherDetailsClientProps {
  teacherId: string;
}

export function StudentTeacherDetailsClient({ teacherId }: StudentTeacherDetailsClientProps) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.teacherPage");
  const tExplore = useTranslations("studentDashboard.exploreCoursesPage");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch teacher profile
  const { data: teacher, isLoading: isTeacherLoading } = useStudentTeacher(teacherId);

  // Sort options matching IndexCourseRequest
  const sortOptions: SortOptionItem[] = React.useMemo(
    () => [
      { value: "latest", label: tExplore("sort.newest") },
      { value: "oldest", label: tExplore("sort.oldest") },
      { value: "title_asc", label: tExplore("sort.titleAsc") },
      { value: "title_desc", label: tExplore("sort.titleDesc") },
      { value: "most_enrolled", label: tExplore("sort.mostPopular") },
      { value: "price_asc", label: tExplore("sort.priceAsc") },
      { value: "price_desc", label: tExplore("sort.priceDesc") },
    ],
    [tExplore],
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
    [searchParams, pathname, router, defaultSort],
  );

  // Fetch teacher's courses
  const { data, isLoading: isCoursesLoading } = useExploreCourses({
    instructor_id: teacherId,
    search: searchQuery || undefined,
    sort: sortBy || undefined,
    educational_stage_id: gradeFilter ? Number(gradeFilter) : undefined,
    subject_id: subjectFilter ? Number(subjectFilter) : undefined,
    category: categoryFilter || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const courses = React.useMemo(() => data?.courses ?? [], [data?.courses]);
  const pagination = data?.pagination;
  const totalItems = pagination?.total ?? courses.length;
  const totalPages = (pagination?.last_page ?? Math.ceil(totalItems / itemsPerPage)) || 1;

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;

  // Derive filter options dynamically from teacher's courses
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

  // Handlers
  const handleSearchChange = (search: string) => updateUrlParams({ search, page: 1 });
  const handleSortChange = (sort: string) => updateUrlParams({ sort, page: 1 });
  const handleGradeChange = (grade: string | null) => updateUrlParams({ grade, page: 1 });
  const handleSubjectChange = (subject: string | null) => updateUrlParams({ subject, page: 1 });
  const handleCategoryChange = (category: string | null) => updateUrlParams({ category, page: 1 });
  const handlePageChange = (page: number) => updateUrlParams({ page });
  const handleResetFilters = () =>
    updateUrlParams({
      search: null,
      sort: null,
      grade: null,
      subject: null,
      category: null,
      page: 1,
    });

  const showingText = tExplore("pagination.showing", {
    start: totalItems > 0 ? (pagination?.from ?? startIndex + 1) : 0,
    end: pagination?.to ?? Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

  const isSearchEmpty =
    !isCoursesLoading &&
    Boolean(searchQuery || gradeFilter || subjectFilter || categoryFilter) &&
    courses.length === 0;
  const isInitialEmpty =
    !isCoursesLoading &&
    !searchQuery &&
    !gradeFilter &&
    !subjectFilter &&
    !categoryFilter &&
    courses.length === 0;

  // Teacher name initials
  const nameParts = teacher?.full_name?.trim().split(/\s+/).filter(Boolean) || [];
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
      : teacher?.full_name?.slice(0, 2) || "";

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-10">
      {/* ──────────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / BACK BUTTON
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href="/student-dashboard">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {teacher?.full_name || t("coursesTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("coursesSubtitle")}</p>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/student-dashboard/courses/explore">
            <BookOpen className="size-4" />
            <span className="text-xs sm:text-sm">{t("backToExplore")}</span>
          </Link>
        </Button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          2. TEACHER HERO PROFILE CARD
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/70 shadow-sm">
        {/* Decorative Top Banner with bg-primary & Whitish text/details */}
        <div className="relative h-16 sm:h-24 w-full bg-linear-to-r from-primary via-primary/95 to-primary/85 text-white overflow-hidden">
          {/* Ambient Glows and Pattern Elements */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-black/15 blur-3xl" />

          <div className="relative h-full flex items-start justify-between p-6 sm:p-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>{t("aboutTeacher")}</span>
            </span>

            {!isCoursesLoading && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/95 text-xs font-semibold">
                <BookOpen className="size-3.5" />
                <span>{t("totalCourses", { count: totalItems })}</span>
              </span>
            )}
          </div>
        </div>

        {/* Centered Teacher Avatar, Name & Bio Details */}
        <div className="relative px-6 sm:px-10 pb-8 flex flex-col items-center text-center">
          {/* Circular Avatar */}
          <div className="relative size-32 sm:size-40 rounded-full border-4 border-card bg-muted overflow-hidden shrink-0 shadow-lg ring-1 ring-border/50 -mt-16 sm:-mt-20">
            {isTeacherLoading ? (
              <Skeleton className="size-full" />
            ) : teacher?.avatar ? (
              <Image
                src={teacher.avatar}
                alt={teacher.full_name}
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : initials ? (
              <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-3xl sm:text-4xl">
                {initials}
              </div>
            ) : (
              <div className="size-full flex items-center justify-center bg-muted text-muted-foreground">
                <User className="size-16" />
              </div>
            )}
          </div>

          {/* Teacher Name */}
          <div className="mt-4 space-y-2">
            {isTeacherLoading ? (
              <Skeleton className="h-8 w-48 mx-auto" />
            ) : teacher ? (
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {teacher.full_name}
              </h2>
            ) : null}
          </div>

          {/* Bio Card / Section */}
          <div className="w-full max-w-2xl mt-4">
            {isTeacherLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            ) : teacher ? (
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {teacher.bio ? teacher.bio : t("noBio")}
              </p>
            ) : (
              <div className="text-destructive text-sm font-medium">{t("teacherNotFound")}</div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. TEACHER'S COURSES SECTION HEADER & FILTERS
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t("coursesTitle")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 ps-9">{t("coursesSubtitle")}</p>
          </div>

          {!isCoursesLoading && (
            <span className="inline-flex items-center self-start sm:self-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t("totalCourses", { count: totalItems })}
            </span>
          )}
        </div>

        {/* Filter Toolbar with Grade, Subject, Classification, Search, Sort */}
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
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onGradeChange={handleGradeChange}
          onSubjectChange={handleSubjectChange}
          onCategoryChange={handleCategoryChange}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          4. COURSES GRID / SKELETON / EMPTY STATES
      ────────────────────────────────────────────────────────────────────────────── */}
      {isCoursesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden p-4 space-y-3"
            >
              <Skeleton className="h-44 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-border/40">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : isInitialEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{t("noCourses")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {tExplore("empty.description")}
          </p>
        </div>
      ) : isSearchEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{tExplore("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {tExplore("empty.description")}
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-2">
            <span>{tExplore("clearFilters")}</span>
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
          5. PAGINATION FOOTER
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
