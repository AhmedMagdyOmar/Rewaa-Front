"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CourseVenueFilter, FilterTab, SortOption } from "../../course-filters";

export function useCourseUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as FilterTab) || "all";
  const venueFilter = (searchParams.get("venue") as CourseVenueFilter) || "all";
  const stageFilter = searchParams.get("stage") || "all";
  const subjectFilter = searchParams.get("subject") || "all";
  const instructorFilter = searchParams.get("instructor") || "all";
  const sortBy = (searchParams.get("sort") as SortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;

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
          (key === "stage" && value === "all") ||
          (key === "subject" && value === "all") ||
          (key === "instructor" && value === "all") ||
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrlParams({ search: e.target.value, page: 1 });
  };

  const handleTabChange = (tab: FilterTab) => {
    updateUrlParams({ tab, page: 1 });
  };

  const handleVenueChange = (venue: string) => {
    updateUrlParams({ venue: venue === "all" ? null : venue, page: 1 });
  };

  const handleStageChange = (stageId: string) => {
    updateUrlParams({ stage: stageId === "all" ? null : stageId, page: 1 });
  };

  const handleSubjectChange = (subjectId: string) => {
    updateUrlParams({ subject: subjectId === "all" ? null : subjectId, page: 1 });
  };

  const handleInstructorChange = (instructorId: string) => {
    updateUrlParams({ instructor: instructorId === "all" ? null : instructorId, page: 1 });
  };

  const handleSortChange = (sort: SortOption) => {
    updateUrlParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handleResetFilters = () => {
    updateUrlParams({
      search: null,
      tab: null,
      venue: null,
      stage: null,
      subject: null,
      instructor: null,
      sort: null,
      page: 1,
    });
  };

  return {
    searchQuery,
    activeTab,
    venueFilter,
    stageFilter,
    subjectFilter,
    instructorFilter,
    sortBy,
    currentPage,
    updateUrlParams,
    handleSearchChange,
    handleTabChange,
    handleVenueChange,
    handleStageChange,
    handleSubjectChange,
    handleInstructorChange,
    handleSortChange,
    handlePageChange,
    handleResetFilters,
  };
}
