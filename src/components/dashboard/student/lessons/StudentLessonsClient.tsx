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
import { getStoredLessons } from "@/lib/lessons-storage";
import { getPassedExams } from "@/lib/student-course-progress";
import { Lesson } from "@/types/course";
import { ArrowUpDown, BookOpen, FileText, Filter, Search, Video, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { StudentLessonCard } from "./StudentLessonCard";

export type StudentLessonSortOption = "date-newest" | "date-oldest" | "title-asc" | "title-desc";

export function StudentLessonsClient() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.lessonsPage");
  const tSubjects = useTranslations("courses.new.subjects");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const selectedType = searchParams.get("type") || "all";
  const selectedSubject = searchParams.get("subject") || "all";
  const sortBy = (searchParams.get("sort") as StudentLessonSortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 8;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "type" && value === "all") ||
          (key === "subject" && value === "all") ||
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

  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [passedExamIds, setPassedExamIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(() => {
    const allStored = getStoredLessons(locale);
    // Filter to ONLY independent, published lessons
    const independentPublished = allStored.filter((l) => {
      // Must be independent
      const isIndependent = !l.courseId && l.lessonCategory !== "course-dependent";
      // Must be published (not draft and not scheduled in future)
      const isPublished = l.publishStatus === "published" || (!l.publishStatus && !!l.title);
      return isIndependent && isPublished;
    });

    setLessons(independentPublished);
    setPassedExamIds(getPassedExams());
    setIsLoading(false);
  }, [locale]);

  React.useEffect(() => {
    loadData();
    const handlePassedUpdate = () => setPassedExamIds(getPassedExams());
    window.addEventListener("rewaa_lessons_updated", loadData);
    window.addEventListener("rewaa_student_passed_exams_updated", handlePassedUpdate);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("rewaa_lessons_updated", loadData);
      window.removeEventListener("rewaa_student_passed_exams_updated", handlePassedUpdate);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  // Extract available subjects from independent lessons
  const availableSubjects = React.useMemo(() => {
    const subjects = new Set<string>();
    lessons.forEach((l) => {
      if (l.subject) subjects.add(l.subject);
    });
    return Array.from(subjects);
  }, [lessons]);

  // Filtering
  const filteredLessons = React.useMemo(() => {
    return lessons.filter((lesson) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = lesson.title?.toLowerCase().includes(q);
        const matchesTeacher = lesson.teacherName?.toLowerCase().includes(q);
        const matchesSubject = lesson.subject?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTeacher && !matchesSubject) return false;
      }

      // Type filter
      if (selectedType === "video" && lesson.type === "text") return false;
      if (selectedType === "text" && lesson.type !== "text") return false;

      // Subject filter
      if (selectedSubject !== "all" && lesson.subject !== selectedSubject) return false;

      return true;
    });
  }, [lessons, searchQuery, selectedType, selectedSubject]);

  // Sorting
  const sortedLessons = React.useMemo(() => {
    return [...filteredLessons].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title, locale);
        case "title-desc":
          return b.title.localeCompare(a.title, locale);
        case "date-oldest":
          return a.id.localeCompare(b.id);
        case "date-newest":
        default:
          return b.id.localeCompare(a.id);
      }
    });
  }, [filteredLessons, sortBy, locale]);

  // Pagination
  const totalItems = sortedLessons.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedLessons = sortedLessons.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrlParams({ search: e.target.value, page: 1 });
  };

  const handleTypeChange = (type: string) => {
    updateUrlParams({ type, page: 1 });
  };

  const handleSubjectChange = (subject: string) => {
    updateUrlParams({ subject, page: 1 });
  };

  const handleSortChange = (sort: StudentLessonSortOption) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handleResetFilters = () => {
    updateUrlParams({ search: null, type: null, subject: null, sort: null, page: 1 });
  };

  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedType !== "all" ||
    selectedSubject !== "all" ||
    sortBy !== "date-newest";

  const sortOptions: { value: StudentLessonSortOption; label: string }[] = [
    { value: "date-newest", label: t("sort.newest") },
    { value: "date-oldest", label: t("sort.oldest") },
    { value: "title-asc", label: t("sort.titleAsc") },
    { value: "title-desc", label: t("sort.titleDesc") },
  ];

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
              {t("totalAvailable", { count: lessons.length })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        {/* Search */}
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

        {/* Filter Badges / Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 bg-muted rounded-lg border border-border/40 text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => handleTypeChange("all")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                selectedType === "all"
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("allTypes")}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("video")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === "video"
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="size-3.5" />
              <span>{t("videoLessons")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("text")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === "text"
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-3.5" />
              <span>{t("textLessons")}</span>
            </button>
          </div>

          {/* Subject Dropdown */}
          {availableSubjects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-medium bg-background"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>
                    {selectedSubject === "all"
                      ? t("allSubjects")
                      : tSubjects.has(selectedSubject as Parameters<typeof tSubjects.has>[0])
                        ? tSubjects(selectedSubject as Parameters<typeof tSubjects>[0])
                        : selectedSubject}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
                <DropdownMenuItem onClick={() => handleSubjectChange("all")}>
                  {t("allSubjects")}
                </DropdownMenuItem>
                {availableSubjects.map((sub) => (
                  <DropdownMenuItem key={sub} onClick={() => handleSubjectChange(sub)}>
                    {tSubjects.has(sub as Parameters<typeof tSubjects.has>[0])
                      ? tSubjects(sub as Parameters<typeof tSubjects>[0])
                      : sub}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-medium bg-background"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>
                  {sortOptions.find((o) => o.value === sortBy)?.label || t("sort.newest")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
              {sortOptions.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset button */}
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
        </div>
      </div>

      {/* ── Content Grid ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <div className="space-y-2 p-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full mt-3 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedLessons.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border/70 p-8">
          <BookOpen className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-bold text-foreground">{t("empty.title")}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
            {t("empty.description")}
          </p>
          {isFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 text-xs"
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedLessons.map((lesson) => (
              <StudentLessonCard
                key={lesson.id}
                lesson={lesson}
                isExamPassed={
                  lesson.isLinkedToExam && lesson.linkedExamId
                    ? passedExamIds.includes(lesson.linkedExamId)
                    : false
                }
              />
            ))}
          </div>

          {/* Pagination */}
          <ContentPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => updateUrlParams({ page })}
            showingText={showingText}
          />
        </div>
      )}
    </div>
  );
}
