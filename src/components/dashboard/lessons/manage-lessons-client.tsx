"use client";

import { BookOpen, Plus, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { CourseSelect } from "@/components/ui/academic-selects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteLesson, useProviderLessons } from "@/hooks/use-lessons";
import { getErrorMessage } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { LessonClassification } from "@/types/api-contracts";
import { CourseVenue, Lesson } from "@/types/course";
import { ContentFilters, SortOptionItem, TabItem } from "../common/content-filters";
import { ContentPagination } from "../common/content-pagination";
import { DeleteLessonDialog } from "./delete-lesson-dialog";
import { LessonCard } from "./lesson-card";
import { useLessonUrlFilters } from "./use-lesson-url-filters";

export type LessonFilterTab = "all" | "course-linked";
export type LessonSortOption = "date-newest" | "date-oldest";

export function ManageLessonsClient() {
  const locale = useLocale();
  const t = useTranslations("lessons");

  const {
    searchQuery,
    activeTab,
    courseId,
    sortBy,
    currentPage,
    handleSearchChange,
    handleTabChange,
    handleCourseChange,
    handleSortChange,
    handlePageChange,
    handleResetFilters,
  } = useLessonUrlFilters();
  const itemsPerPage = 9;

  // Map filters to backend request params
  const classification: LessonClassification | undefined =
    activeTab === "course-linked" ? "course" : undefined;
  const sort = sortBy === "date-oldest" ? "oldest" : "latest";

  const { data, isLoading, refetch, isRefetching } = useProviderLessons({
    search: searchQuery.trim() || undefined,
    classification,
    course_id: courseId || undefined,
    sort,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const deleteLessonMutation = useDeleteLesson();

  // Dialog state for lesson deletion
  const [lessonToDelete, setLessonToDelete] = React.useState<Lesson | null>(null);

  // Adapt backend lessons to local Lesson models for rendering
  const adaptedLessons: Lesson[] = (data?.lessons || []).map((b) => ({
    id: String(b.id),
    title: b.title?.[locale] || b.title?.ar || b.title?.en || "",
    description: b.description?.[locale] || b.description?.ar || "",
    type: b.type === "text_only" ? "text" : "videoAndText",
    coverImage: b.cover_image || b.cover_image_url || b.course?.cover_image || undefined,
    lectureVideoLink: b.video_url || undefined,
    grade: b.educational_stage?.name?.[locale] || b.educational_stage?.name?.ar || undefined,
    subject: b.subject?.name?.[locale] || b.subject?.name?.ar || undefined,
    teacherName: b.instructor?.full_name || undefined,
    teacherImage: b.instructor?.avatar || undefined,
    venue: (b.delivery_mode as CourseVenue) || "hybrid",
    classification: b.classification,
    lessonCategory: b.classification === "standalone" ? "independent" : "course-dependent",
    courseId: b.course_id
      ? String(b.course_id)
      : b.linked_courses && b.linked_courses.length > 0
        ? String(b.linked_courses[0].id)
        : undefined,
    courseTitle:
      b.course?.title?.[locale] ||
      b.course?.title?.ar ||
      (b.linked_courses && b.linked_courses.length > 0
        ? b.linked_courses[0].title?.[locale] || b.linked_courses[0].title?.ar
        : undefined),
    linkedCoursesCount: b.linked_courses_count ?? (b.linked_courses ? b.linked_courses.length : 0),
    linkedCourses: (b.linked_courses || []).map((c) => ({
      id: String(c.id),
      title: c.title?.[locale] || c.title?.ar || c.title?.en || "",
      coverImage: c.cover_image || undefined,
      sectionId: c.section?.id ? String(c.section.id) : undefined,
      sectionTitle: c.section?.title?.[locale] || c.section?.title?.ar || undefined,
    })),
    sectionId: b.course_section_id
      ? String(b.course_section_id)
      : b.linked_courses && b.linked_courses.length > 0 && b.linked_courses[0].section?.id
        ? String(b.linked_courses[0].section.id)
        : undefined,
    sectionTitle:
      b.course_section?.title?.[locale] ||
      b.course_section?.title?.ar ||
      (b.linked_courses && b.linked_courses.length > 0
        ? b.linked_courses[0].section?.title?.[locale] || b.linked_courses[0].section?.title?.ar
        : undefined),
    completionsCount: b.completions_count ?? 0,
    isActive: b.is_active,
    hasPdfAttachments: Boolean(b.has_pdf_attachments),
    pdfFiles: (b.pdf_attachments || []).map((p) => ({
      id: String(p.id),
      title: p.name || p.file_name || "PDF Document",
      fileUrl: p.url,
      fileType: "pdf" as const,
      sizeInBytes: p.size,
    })),
    hasImageAttachments: Boolean(b.has_explanatory_images),
    imageFiles: (b.explanatory_images || []).map((img) => ({
      id: String(img.id),
      title: img.name || "Image",
      fileUrl: img.url,
      fileType: "image" as const,
      sizeInBytes: img.size,
    })),
    isLinkedToExam: Boolean(b.has_exam),
    linkedExamId: b.exam_id ? String(b.exam_id) : undefined,
    linkedExamTitle: b.exam?.title?.[locale] || b.exam?.title?.ar || undefined,
    isRequiredPassExam: Boolean(b.requires_exam_pass_to_unlock_next_lesson),
  }));

  // Pagination details from backend
  const totalItems = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.last_page ?? 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLessons = adaptedLessons;

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await deleteLessonMutation.mutateAsync(lessonToDelete.id);
      toast.success(locale === "ar" ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully");
      setLessonToDelete(null);
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Classification counts from backend
  const classificationCounts = data?.classification_counts;

  // Filter tabs and sort options
  const tabs: TabItem<LessonFilterTab>[] = [
    {
      value: "all",
      label: t("tabs.all"),
      count: classificationCounts?.all ?? totalItems ?? 0,
    },
    {
      value: "course-linked",
      label: t("tabs.courseLinked"),
      count: classificationCounts?.course ?? 0,
    },
  ];

  const sortOptions: SortOptionItem<LessonSortOption>[] = [
    { value: "date-newest", label: t("sort.newest") },
    { value: "date-oldest", label: t("sort.oldest") },
  ];

  const showingText = t("pagination.showing", {
    start: totalItems === 0 ? 0 : Math.min(startIndex + 1, totalItems),
    end: Math.min(startIndex + itemsPerPage, totalItems),
    total: totalItems,
  });

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
            onClick={handleRefresh}
            disabled={isRefetching}
            className="gap-2 shadow-xs font-semibold"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            <span>{locale === "ar" ? "تحديث" : "Refresh"}</span>
          </Button>
          <Button asChild size="default" className="gap-2 shadow-sm font-semibold">
            <Link href={`/${locale}/dashboard/lessons/new`}>
              <Plus className="h-4 w-4" />
              <span>{t("addNewLesson")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Controls Row */}
      <ContentFilters<LessonFilterTab, LessonSortOption>
        searchQuery={searchQuery}
        searchPlaceholder={t("searchPlaceholder")}
        activeTab={activeTab}
        tabs={tabs}
        sortBy={sortBy}
        sortOptions={sortOptions}
        clearFiltersLabel={t("clearFilters")}
        isFilterActiveCustom={Boolean(courseId && courseId !== "all")}
        extraFilters={
          <div className="w-full sm:w-64">
            <CourseSelect
              value={courseId || "all"}
              onValueChange={handleCourseChange}
              placeholder={t("filterCourse")}
              showAllOption
              allOptionLabel={t("allCourses")}
              triggerClassName="h-9"
            />
          </div>
        }
        onSearchChange={handleSearchChange}
        onTabChange={handleTabChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />

      {/* Lessons Grid or Skeleton Loader */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
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
      ) : paginatedLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border/80">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{t("empty.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} onDeleteRequest={setLessonToDelete} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <ContentPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        showingText={showingText}
        onPageChange={handlePageChange}
      />

      {/* Confirmation Dialog for Deletion */}
      <DeleteLessonDialog
        lessonToDelete={lessonToDelete}
        onClose={() => setLessonToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteLessonMutation.isPending}
      />
    </div>
  );
}
