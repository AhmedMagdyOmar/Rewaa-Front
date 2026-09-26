"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useStudentCourseContent } from "@/hooks/use-student-course-content";
import { useStudentCourseDetail } from "@/hooks/use-student-course-detail";
import { useStudentEnroll } from "@/hooks/use-student-enroll";
import { useStudentLessonDetail, useToggleLessonCompletion } from "@/hooks/use-student-lesson";
import { cn } from "@/lib/utils";
import {
  BackendCourseContentSection,
  BackendCourseContentSectionLesson,
  BackendCourseContentSectionLessonExam,
} from "@/types/api-contracts";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import * as React from "react";
import { toast } from "sonner";
import { StudentCourseContentSidebar } from "./StudentCourseContentSidebar";
import { StudentCourseLessonView } from "./StudentCourseLessonView";
import { StudentCourseMainView } from "./StudentCourseMainView";
import { StudentCoursePreviewView } from "./StudentCoursePreviewView";
import { StudentLockedSectionDialog } from "./StudentLockedSectionDialog";

interface StudentCourseDetailClientProps {
  courseId: string;
}

export function StudentCourseDetailClient({ courseId }: StudentCourseDetailClientProps) {
  const locale = useLocale();
  const tPreview = useTranslations("studentDashboard.coursePreview");

  // React Query for live backend course details
  const {
    data: backendCourse,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useStudentCourseDetail(courseId);

  // React Query for live course syllabus tree (only enabled when enrolled)
  const isEnrolled = Boolean(backendCourse?.is_enrolled);
  const { data: backendContent, isLoading: isContentLoading } = useStudentCourseContent(
    courseId,
    isEnrolled,
  );

  // React Query mutation for enrollment / checkout order creation
  const enrollMutation = useStudentEnroll();

  const [selectedLessonId, setSelectedLessonId] = React.useState<number | null>(null);
  const [lockedModalOpen, setLockedModalOpen] = React.useState(false);
  const [lockedSectionData, setLockedSectionData] = React.useState<{
    section: BackendCourseContentSection | null;
    requiredExam?: BackendCourseContentSectionLessonExam | null;
  }>({ section: null });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // React Query for active selected lesson
  const { data: activeLesson, isLoading: isLessonLoading } = useStudentLessonDetail(
    courseId,
    selectedLessonId,
    Boolean(selectedLessonId && isEnrolled),
  );

  // Mutation to toggle lesson completion
  const toggleCompletionMutation = useToggleLessonCompletion(courseId);

  // Flattened lessons list from content tree for Previous / Next navigation
  const flatLessons: BackendCourseContentSectionLesson[] = React.useMemo(() => {
    if (!backendContent?.sections) return [];
    return backendContent.sections.flatMap((s) => s.lessons || []);
  }, [backendContent]);

  const currentLessonIndex = flatLessons.findIndex((l) => l.id === selectedLessonId);
  const hasPreviousLesson = currentLessonIndex > 0;
  const hasNextLesson = currentLessonIndex !== -1 && currentLessonIndex < flatLessons.length - 1;

  const isNextLessonLocked = React.useMemo(() => {
    if (!hasNextLesson) return false;
    const nextLesson = flatLessons[currentLessonIndex + 1];
    return Boolean(nextLesson?.is_locked);
  }, [hasNextLesson, flatLessons, currentLessonIndex]);

  // Current lesson completed state
  const isCurrentLessonCompleted = React.useMemo(() => {
    if (!selectedLessonId) return false;
    const item = flatLessons.find((l) => l.id === selectedLessonId);
    return Boolean(item?.is_completed);
  }, [flatLessons, selectedLessonId]);

  const router = useRouter();

  // Handle Enrollment Action via backend order creation
  const handleEnroll = (targetCourseId: number, deliveryMode?: string) => {
    const payload: { course_ids: number[]; delivery_modes?: Record<string | number, string> } = {
      course_ids: [targetCourseId],
    };

    if (deliveryMode) {
      payload.delivery_modes = {
        [targetCourseId]: deliveryMode,
      };
    }

    enrollMutation.mutate(payload, {
      onSuccess: (data) => {
        if (data?.order?.status === "paid") {
          toast.success(tPreview("enrollSuccess"));
        } else if (data?.order?.id) {
          router.push(`/student-dashboard/orders/${data.order.id}`);
        } else {
          toast.success(tPreview("enrollSuccess"));
        }
      },
    });
  };

  const handleSelectLesson = (lessonId: number | null) => {
    setSelectedLessonId(lessonId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextLesson = () => {
    if (hasNextLesson) {
      const nextLesson = flatLessons[currentLessonIndex + 1];
      if (nextLesson && !nextLesson.is_locked) {
        handleSelectLesson(nextLesson.id);
      }
    }
  };

  const handlePreviousLesson = () => {
    if (hasPreviousLesson) {
      const prevLesson = flatLessons[currentLessonIndex - 1];
      if (prevLesson) {
        handleSelectLesson(prevLesson.id);
      }
    }
  };

  const handleAttemptLockedLesson = (
    section: BackendCourseContentSection,
    requiredExam?: BackendCourseContentSectionLessonExam | null,
  ) => {
    setLockedSectionData({
      section,
      requiredExam,
    });
    setLockedModalOpen(true);
  };

  const handleToggleCompletion = (lessonId: number) => {
    const item = flatLessons.find((l) => l.id === lessonId);
    const newStatus = !item?.is_completed;
    toggleCompletionMutation.mutate({
      lessonId,
      isCompleted: newStatus,
    });
  };

  if (isDetailsLoading || (isEnrolled && isContentLoading)) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // If backend found the course and student is NOT enrolled → render preview
  if (backendCourse && !backendCourse.is_enrolled) {
    return (
      <StudentCoursePreviewView
        course={backendCourse}
        onEnroll={handleEnroll}
        isEnrolling={enrollMutation.isPending}
      />
    );
  }

  // Fallback for not found or error
  if (!backendCourse && detailsError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border/80 space-y-4 my-8">
        <h2 className="text-xl font-bold text-foreground">
          {locale === "ar" ? "الدورة غير متوفرة" : "Course not found"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {locale === "ar"
            ? "عذراً، هذه الدورة غير متوفرة أو لم يتم نشرها بعد."
            : "Sorry, this course is not available or hasn't been published yet."}
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 2: STUDENT IS ENROLLED IN THE COURSE (Active Learning Dashboard View)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!backendCourse) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Course Content Navigation */}
        <aside
          className={cn(
            "order-2 lg:order-1 lg:sticky lg:top-20 max-h-none lg:max-h-[calc(100vh-6rem)] flex flex-col transition-all duration-300",
            isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-5 xl:col-span-4",
          )}
        >
          {backendContent && (
            <StudentCourseContentSidebar
              content={backendContent}
              selectedLessonId={selectedLessonId}
              onSelectLesson={handleSelectLesson}
              onToggleLessonCompletion={handleToggleCompletion}
              onAttemptLockedLesson={handleAttemptLockedLesson}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          )}
        </aside>

        {/* Main Content Workspace: Course Details OR Active Lesson */}
        <main
          className={cn(
            "order-1 lg:order-2 space-y-6 transition-all duration-300",
            isSidebarCollapsed ? "lg:col-span-11" : "lg:col-span-7 xl:col-span-8",
          )}
        >
          {selectedLessonId && isLessonLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : selectedLessonId && activeLesson && backendContent ? (
            <StudentCourseLessonView
              lesson={activeLesson}
              content={backendContent}
              isCompleted={isCurrentLessonCompleted}
              onToggleCompletion={handleToggleCompletion}
              isTogglingCompletion={toggleCompletionMutation.isPending}
              onSelectLesson={handleSelectLesson}
              onNextLesson={handleNextLesson}
              onPreviousLesson={handlePreviousLesson}
              hasNextLesson={hasNextLesson}
              hasPreviousLesson={hasPreviousLesson}
              isNextLessonLocked={isNextLessonLocked}
            />
          ) : (
            <StudentCourseMainView
              course={backendCourse}
              content={backendContent}
              onSelectLesson={handleSelectLesson}
            />
          )}
        </main>
      </div>

      {/* Locked Section Dialog */}
      <StudentLockedSectionDialog
        open={lockedModalOpen}
        onOpenChange={setLockedModalOpen}
        lockedSection={lockedSectionData.section}
        requiredExam={lockedSectionData.requiredExam}
      />
    </div>
  );
}
