"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LessonFilterTab, LessonSortOption } from "./manage-lessons-client";

export function useLessonUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const activeTab = (searchParams.get("tab") as LessonFilterTab) || "all";
  const sortBy = (searchParams.get("sort") as LessonSortOption) || "date-newest";
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

  const handleTabChange = (tab: LessonFilterTab) => {
    updateUrlParams({ tab, page: 1 });
  };

  const handleSortChange = (sortOption: LessonSortOption) => {
    updateUrlParams({ sort: sortOption, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handleResetFilters = () => {
    updateUrlParams({ search: null, tab: null, sort: null, page: 1 });
  };

  return {
    searchQuery,
    activeTab,
    sortBy,
    currentPage,
    updateUrlParams,
    handleSearchChange,
    handleTabChange,
    handleSortChange,
    handlePageChange,
    handleResetFilters,
  };
}
