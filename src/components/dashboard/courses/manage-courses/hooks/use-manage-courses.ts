"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  useDeleteCourse,
  useProviderCourseOptions,
  useProviderCourses,
  usePublishCourse,
} from "@/hooks/use-courses";
import { getErrorMessage } from "@/lib/api-utils";
import { Course } from "@/types/course";
import {
  adaptBackendCourseToCourse,
  mapSortToBackend,
  mapTabToStatusParam,
  mapVenueFilterToDeliveryMode,
} from "../manage-courses-utils";
import { useCourseUrlFilters } from "./use-course-url-filters";

interface UseManageCoursesProps {
  filters: ReturnType<typeof useCourseUrlFilters>;
  itemsPerPage?: number;
}

export function useManageCourses({ filters, itemsPerPage = 9 }: UseManageCoursesProps) {
  const locale = useLocale();

  // Dialog state for course deletion
  const [courseToDelete, setCourseToDelete] = React.useState<Course | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Options & Courses Queries
  const { data: optionsData, isLoading: isLoadingOptions } = useProviderCourseOptions();

  const backendSort = React.useMemo(() => {
    return mapSortToBackend(filters.sortBy);
  }, [filters.sortBy]);

  const deliveryModeParam = React.useMemo(() => {
    return mapVenueFilterToDeliveryMode(filters.venueFilter);
  }, [filters.venueFilter]);

  const statusParam = React.useMemo(() => {
    return mapTabToStatusParam(filters.activeTab);
  }, [filters.activeTab]);

  const {
    data: coursesData,
    isLoading,
    isFetching,
    refetch,
  } = useProviderCourses({
    search: filters.searchQuery.trim() || undefined,
    status: statusParam,
    delivery_mode: deliveryModeParam,
    educational_stage_id: filters.stageFilter !== "all" ? filters.stageFilter : undefined,
    subject_id: filters.subjectFilter !== "all" ? filters.subjectFilter : undefined,
    instructor_id: filters.instructorFilter !== "all" ? filters.instructorFilter : undefined,
    sort: backendSort,
    page: filters.currentPage,
    per_page: itemsPerPage,
  });

  // Mutations
  const publishMutation = usePublishCourse();
  const deleteMutation = useDeleteCourse();

  // Adapted courses list
  const courses: Course[] = React.useMemo(() => {
    if (!coursesData?.courses) return [];
    return coursesData.courses.map((c) => adaptBackendCourseToCourse(c, locale));
  }, [coursesData, locale]);

  // Status counts from backend
  const statusCounts = coursesData?.status_counts || {
    all: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
  };

  const paginationMeta = coursesData?.pagination || {
    current_page: filters.currentPage,
    last_page: 1,
    per_page: itemsPerPage,
    total: 0,
  };

  // Handlers
  const handlePublishToggle = async (courseId: string) => {
    try {
      await publishMutation.mutateAsync(courseId);
      toast.success(locale === "ar" ? "تم نشر الدورة بنجاح" : "Course published successfully");
    } catch (err) {
      toast.error(
        getErrorMessage(err) || (locale === "ar" ? "فشل نشر الدورة" : "Failed to publish course"),
      );
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteMutation.mutateAsync(courseToDelete.id);
      toast.success(locale === "ar" ? "تم حذف الدورة بنجاح" : "Course deleted successfully");
      setCourseToDelete(null);
    } catch (err) {
      toast.error(
        getErrorMessage(err) || (locale === "ar" ? "فشل حذف الدورة" : "Failed to delete course"),
      );
    }
  };

  const handleRefreshData = () => {
    refetch();
    toast.info(locale === "ar" ? "تم تحديث البيانات" : "Data refreshed");
  };

  const handleCopyLink = (courseId: string) => {
    const link = `${window.location.origin}/${locale}/dashboard/courses/${courseId}/edit`;
    navigator.clipboard.writeText(link);
    setCopiedId(courseId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter option dropdowns
  const stageOptions = React.useMemo(() => {
    return (optionsData?.educational_stages || []).map((s) => ({
      id: s.id,
      name: s.name?.[locale] || s.name?.ar || s.name?.en || "",
    }));
  }, [optionsData, locale]);

  const subjectOptions = React.useMemo(() => {
    return (optionsData?.subjects || []).map((s) => ({
      id: s.id,
      name: s.name?.[locale] || s.name?.ar || s.name?.en || "",
    }));
  }, [optionsData, locale]);

  const instructorOptions = React.useMemo(() => {
    return (optionsData?.instructors || []).map((i) => ({
      id: i.id,
      name: i.full_name,
    }));
  }, [optionsData]);

  return {
    courses,
    isLoading,
    isLoadingOptions,
    isFetching,
    statusCounts,
    paginationMeta,
    courseToDelete,
    setCourseToDelete,
    copiedId,
    stageOptions,
    subjectOptions,
    instructorOptions,
    handlePublishToggle,
    confirmDelete,
    handleRefreshData,
    handleCopyLink,
  };
}
