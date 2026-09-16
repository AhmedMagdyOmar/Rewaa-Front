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
      <ManageCoursesHeader onRefresh={manage.handleRefreshData} isFetching={manage.isFetching} />

      {/* Filter and Controls Row */}
      <CourseFilters
        isLoading={manage.isLoadingOptions}
        searchQuery={filters.searchQuery}
        activeTab={filters.activeTab}
        venueFilter={filters.venueFilter}
        stageFilter={filters.stageFilter}
        subjectFilter={filters.subjectFilter}
        instructorFilter={filters.instructorFilter}
        stages={manage.stageOptions}
        subjects={manage.subjectOptions}
        instructors={manage.instructorOptions}
        sortBy={filters.sortBy}
        totalCount={manage.statusCounts.all}
        publishedCount={manage.statusCounts.published}
        draftCount={manage.statusCounts.draft}
        scheduledCount={manage.statusCounts.scheduled}
        onSearchChange={filters.handleSearchChange}
        onTabChange={filters.handleTabChange}
        onVenueChange={filters.handleVenueChange}
        onStageChange={filters.handleStageChange}
        onSubjectChange={filters.handleSubjectChange}
        onInstructorChange={filters.handleInstructorChange}
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
