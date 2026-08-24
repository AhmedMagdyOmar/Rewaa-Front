/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Barcode, BookOpen, Plus, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredCourses, saveStoredCourses, resetStoredCourses } from "@/lib/courses-storage";
import { Course } from "@/types/course";
import { CourseCard } from "./course-card";
import { CourseFilters, CourseVenueFilter, FilterTab, SortOption } from "./course-filters";
import { CoursePagination } from "./course-pagination";
import { DeleteCourseDialog } from "./delete-course-dialog";

export function ManageCoursesClient() {
  const locale = useLocale();
  const t = useTranslations("courses");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as FilterTab) || "all";
  const venueFilter = (searchParams.get("venue") as CourseVenueFilter) || "all";
  const sortBy = (searchParams.get("sort") as SortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 8;

  // Helper function to update URL search parameters
  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "tab" && value === "all") ||
          (key === "venue" && value === "all") ||
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

  // Local state initialized & synchronized with LocalStorage
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setCourses(getStoredCourses(locale));
    setIsLoading(false);

    const handleStorageUpdate = () => {
      setCourses(getStoredCourses(locale));
    };

    window.addEventListener("rewaa_courses_updated", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    return () => {
      window.removeEventListener("rewaa_courses_updated", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [locale]);

  // Dialog state for course deletion
  const [courseToDelete, setCourseToDelete] = React.useState<Course | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Filter & Search Logic
  const filteredCourses = React.useMemo(() => {
    return courses.filter((course) => {
      const isScheduled =
        course.publishStatus === "scheduled" ||
        (!course.publishStatus && Boolean(course.scheduledPublishDate));
      const isPublished =
        course.publishStatus === "published" ||
        (!course.publishStatus && !course.isDraft && !isScheduled);

      if (activeTab === "published" && !isPublished) return false;
      if (activeTab === "draft" && isPublished) return false;

      // Venue Filter
      if (venueFilter === "center" && course.venue !== "center" && course.venue !== "all") {
        return false;
      }
      if (venueFilter === "online" && course.venue !== "online" && course.venue !== "all") {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesSubject = course.subject.toLowerCase().includes(query);
        const matchesGrade = course.grade.toLowerCase().includes(query);
        const matchesTeacher = course.teacherName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubject && !matchesGrade && !matchesTeacher) {
          return false;
        }
      }

      return true;
    });
  }, [courses, activeTab, venueFilter, searchQuery]);

  // Sort Logic
  const sortedCourses = React.useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      switch (sortBy) {
        case "sales-desc":
          return (b.numberOfParticipants || 0) - (a.numberOfParticipants || 0);
        case "sales-asc":
          return (a.numberOfParticipants || 0) - (b.numberOfParticipants || 0);
        case "date-newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [filteredCourses, sortBy]);

  // Pagination Logic
  const totalItems = sortedCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = sortedCourses.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrlParams({ search: e.target.value, page: 1 });
  };

  const handleTabChange = (tab: FilterTab) => {
    updateUrlParams({ tab, page: 1 });
  };

  const handleVenueChange = (venue: string) => {
    updateUrlParams({ venue: venue === "all" ? null : venue, page: 1 });
  };

  const handleSortChange = (sort: SortOption) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handlePublishToggle = (courseId: string) => {
    const updated = courses.map((c) =>
      c.id === courseId
        ? {
            ...c,
            isDraft: false,
            publishStatus: "published" as const,
            scheduledPublishDate: undefined,
            scheduledEndDate: undefined,
          }
        : c,
    );
    setCourses(updated);
    saveStoredCourses(locale, updated);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      const updated = courses.filter((c) => c.id !== courseToDelete.id);
      setCourses(updated);
      saveStoredCourses(locale, updated);
      setCourseToDelete(null);
    }
  };

  const handleResetData = () => {
    const reset = resetStoredCourses(locale);
    setCourses(reset);
  };

  const handleCopyLink = (courseId: string) => {
    const link = `${window.location.origin}/${locale}/dashboard/courses/${courseId}/edit`;
    navigator.clipboard.writeText(link);
    setCopiedId(courseId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    updateUrlParams({ search: null, tab: null, venue: null, sort: null, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
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
            <span>{t("resetCourses")}</span>
          </Button>
          <Button
            asChild
            variant="outline"
            size="default"
            className="gap-2 shadow-xs font-semibold"
          >
            <Link href={`/${locale}/dashboard/courses/codes`}>
              <Barcode className="h-4 w-4" />
              <span>{t("activationCodes")}</span>
            </Link>
          </Button>
          <Button asChild size="default" className="gap-2 shadow-sm font-semibold">
            <Link href={`/${locale}/dashboard/courses/new`}>
              <Plus className="h-4 w-4" />
              <span>{t("addNewCourse")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Controls Row */}
      <CourseFilters
        searchQuery={searchQuery}
        activeTab={activeTab}
        venueFilter={venueFilter}
        sortBy={sortBy}
        totalCount={courses.length}
        publishedCount={
          courses.filter((c) => {
            const isScheduled =
              c.publishStatus === "scheduled" ||
              (!c.publishStatus && Boolean(c.scheduledPublishDate));
            return (
              c.publishStatus === "published" || (!c.publishStatus && !c.isDraft && !isScheduled)
            );
          }).length
        }
        draftCount={
          courses.filter((c) => {
            const isScheduled =
              c.publishStatus === "scheduled" ||
              (!c.publishStatus && Boolean(c.scheduledPublishDate));
            const isPublished =
              c.publishStatus === "published" || (!c.publishStatus && !c.isDraft && !isScheduled);
            return !isPublished;
          }).length
        }
        onSearchChange={handleSearchChange}
        onTabChange={handleTabChange}
        onVenueChange={handleVenueChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* Courses Grid or Skeleton Loader */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              copiedId={copiedId}
              onPublishToggle={handlePublishToggle}
              onCopyLink={handleCopyLink}
              onDeleteRequest={setCourseToDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <CoursePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

      {/* Confirmation Dialog for Deletion */}
      <DeleteCourseDialog
        courseToDelete={courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
