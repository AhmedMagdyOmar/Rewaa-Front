"use client";

import * as React from "react";
import { CourseFilters } from "./course-filters";
import { CoursePagination } from "./course-pagination";
import { DeleteCourseDialog } from "./delete-course-dialog";
import { useCourseUrlFilters } from "./manage-courses/hooks/use-course-url-filters";
import { useManageCourses } from "./manage-courses/hooks/use-manage-courses";
import { ManageCoursesHeader } from "./manage-courses/components/manage-courses-header";
import { CoursesGrid } from "./manage-courses/components/courses-grid";

export function ManageCoursesClient() {
  const filters = useCourseUrlFilters();
  const manage = useManageCourses({ filters, itemsPerPage: 9 });

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <ManageCoursesHeader />

      {/* Filter and Controls Row */}
      <CourseFilters
        isLoading={manage.isLoadingOptions}
        searchQuery={filters.searchQuery}
        activeTab={filters.activeTab}
        categoryFilter={filters.categoryFilter}
        categories={manage.categoryOptions}
        stageFilter={filters.stageFilter}
        stages={manage.stageOptions}
        sortBy={filters.sortBy}
        totalCount={manage.statusCounts.all}
        publishedCount={manage.statusCounts.published}
        draftCount={manage.statusCounts.draft}
        scheduledCount={manage.statusCounts.scheduled}
        onSearchChange={filters.handleSearchChange}
        onTabChange={filters.handleTabChange}
        onCategoryChange={filters.handleCategoryChange}
        onStageChange={filters.handleStageChange}
        onSortChange={filters.handleSortChange}
        onResetFilters={filters.handleResetFilters}
      />

      {/* Courses Grid, Skeleton Loader, or Empty State */}
      <CoursesGrid
        isLoading={manage.isLoading}
        courses={manage.courses}
        copiedId={manage.copiedId}
        onPublishToggle={manage.handlePublishToggle}
        onCopyLink={manage.handleCopyLink}
        onDeleteRequest={manage.setCourseToDelete}
      />

      {/* Pagination Controls */}
      <CoursePagination
        currentPage={manage.paginationMeta.current_page}
        totalPages={manage.paginationMeta.last_page}
        totalItems={manage.paginationMeta.total}
        startIndex={(manage.paginationMeta.current_page - 1) * manage.paginationMeta.per_page}
        itemsPerPage={manage.paginationMeta.per_page}
        onPageChange={filters.handlePageChange}
      />

      {/* Confirmation Dialog for Deletion */}
      <DeleteCourseDialog
        courseToDelete={manage.courseToDelete}
        onClose={() => manage.setCourseToDelete(null)}
        onConfirm={manage.confirmDelete}
      />
    </div>
  );
}
export default ManageCoursesClient;
