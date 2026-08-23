"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { getStoredCourses } from "@/lib/courses-storage";
import { mockCoursesData } from "@/lib/mockCoursesData";
import { getStoredTeachers } from "@/lib/settings-storage";
import { cn } from "@/lib/utils";
import {
  calculateCourseProgress,
  getCompletedLessons,
  getPassedExams,
  getSectionLockStatus,
  toggleLessonCompletion,
} from "@/lib/student-course-progress";
import {
  enrollCourse,
  getEnrolledCourseIds,
  isCourseEnrolled,
} from "@/lib/student-enrollment-storage";
import { Course, CourseSection, Lesson } from "@/types/course";
import { useLocale } from "next-intl";
import * as React from "react";
import { StudentCertificateDialog } from "./StudentCertificateDialog";
import { StudentCourseContentSidebar } from "./StudentCourseContentSidebar";
import { StudentCourseMainView } from "./StudentCourseMainView";
import { StudentCoursePreviewView } from "./StudentCoursePreviewView";
import { StudentLockedSectionDialog } from "./StudentLockedSectionDialog";

interface StudentCourseDetailClientProps {
  courseId: string;
}

export function StudentCourseDetailClient({ courseId }: StudentCourseDetailClientProps) {
  const locale = useLocale();

  const [storedCourses, setStoredCourses] = React.useState<Course[]>([]);
  const [teachers, setTeachers] = React.useState(getStoredTeachers());
  const [enrolledIds, setEnrolledIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEnrolling, setIsEnrolling] = React.useState(false);

  // Selected active lesson (null = Course Overview)
  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);

  // Completed lessons
  const [completedLessons, setCompletedLessons] = React.useState<string[]>([]);

  // Passed exams
  const [passedExamIds, setPassedExamIds] = React.useState<string[]>([]);

  // Certificate Modal State
  const [certificateOpen, setCertificateOpen] = React.useState(false);

  // Locked Section Modal State
  const [lockedModalOpen, setLockedModalOpen] = React.useState(false);
  const [lockedSectionData, setLockedSectionData] = React.useState<{
    section: CourseSection | null;
    requiredExamId?: string;
  }>({ section: null });

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Load course, stored completions, and passed exams
  React.useEffect(() => {
    const loadData = () => {
      const courses = getStoredCourses(locale);
      setStoredCourses(courses);
      setTeachers(getStoredTeachers());
      setEnrolledIds(getEnrolledCourseIds());
      setCompletedLessons(getCompletedLessons(courseId));
      setPassedExamIds(getPassedExams());
      setIsLoading(false);
    };

    loadData();

    const handleCoursesUpdate = () => {
      setStoredCourses(getStoredCourses(locale));
      setTeachers(getStoredTeachers());
    };

    const handleEnrollmentUpdate = () => {
      setEnrolledIds(getEnrolledCourseIds());
    };

    const handleProgressUpdate = () => {
      setCompletedLessons(getCompletedLessons(courseId));
    };

    const handlePassedExamsUpdate = () => {
      setPassedExamIds(getPassedExams());
    };

    window.addEventListener("rewaa_courses_updated", handleCoursesUpdate);
    window.addEventListener("rewaa_settings_updated", handleCoursesUpdate);
    window.addEventListener("rewaa_student_enrollment_updated", handleEnrollmentUpdate);
    window.addEventListener("storage", handleEnrollmentUpdate);
    window.addEventListener("rewaa_student_progress_updated", handleProgressUpdate);
    window.addEventListener("rewaa_student_passed_exams_updated", handlePassedExamsUpdate);

    return () => {
      window.removeEventListener("rewaa_courses_updated", handleCoursesUpdate);
      window.removeEventListener("rewaa_settings_updated", handleCoursesUpdate);
      window.removeEventListener("rewaa_student_enrollment_updated", handleEnrollmentUpdate);
      window.removeEventListener("storage", handleEnrollmentUpdate);
      window.removeEventListener("rewaa_student_progress_updated", handleProgressUpdate);
      window.removeEventListener("rewaa_student_passed_exams_updated", handlePassedExamsUpdate);
    };
  }, [locale, courseId]);

  // Current Course - must be published
  const courseList = React.useMemo(() => {
    const raw =
      storedCourses.length > 0
        ? storedCourses
        : mockCoursesData[locale as "ar" | "en"] || mockCoursesData.ar;
    return raw.filter((c) => !c.isDraft);
  }, [storedCourses, locale]);

  const rawCourse = React.useMemo(() => {
    return courseList.find((c) => c.id === courseId) || null;
  }, [courseList, courseId]);

  // Sanitize course to ensure all sections & lessons are published (non-draft)
  const currentCourse = React.useMemo((): Course | null => {
    if (!rawCourse || rawCourse.isDraft) return null;

    const publishedSections = (rawCourse.sections || [])
      .filter((section) => !section.isDraft && section.status !== "draft")
      .map((section) => ({
        ...section,
        lessons: (section.lessons || []).filter((lesson) => lesson.publishStatus !== "draft"),
      }));

    const totalPublishedLessons = publishedSections.reduce((acc, s) => acc + s.lessons.length, 0);

    return {
      ...rawCourse,
      numberOfLessons: totalPublishedLessons,
      sections: publishedSections,
    };
  }, [rawCourse]);

  // Find instructor image & info
  const matchedTeacher = React.useMemo(() => {
    if (!currentCourse) return undefined;
    return teachers.find(
      (tch) =>
        tch.name.trim().toLowerCase() === currentCourse.teacherName?.trim().toLowerCase() ||
        (currentCourse.teacherName && tch.name.includes(currentCourse.teacherName)) ||
        (currentCourse.teacherName && currentCourse.teacherName.includes(tch.name)),
    );
  }, [teachers, currentCourse]);

  // Check enrollment
  const isEnrolled = React.useMemo(() => {
    if (!currentCourse) return false;
    return enrolledIds.includes(currentCourse.id) || isCourseEnrolled(currentCourse.id);
  }, [enrolledIds, currentCourse]);

  // Handle Enrollment Action
  const handleEnroll = (targetCourseId: string) => {
    setIsEnrolling(true);
    setTimeout(() => {
      const updated = enrollCourse(targetCourseId);
      setEnrolledIds(updated);
      setIsEnrolling(false);
    }, 400);
  };

  // Flat lessons list for next/prev navigation
  const flatLessons: Lesson[] = React.useMemo(() => {
    if (!currentCourse) return [];
    return currentCourse.sections.flatMap((s) => s.lessons);
  }, [currentCourse]);

  const selectedLesson = React.useMemo(() => {
    if (!selectedLessonId) return null;
    return flatLessons.find((l) => l.id === selectedLessonId) || null;
  }, [flatLessons, selectedLessonId]);

  const currentLessonIndex = flatLessons.findIndex((l) => l.id === selectedLessonId);
  const hasPreviousLesson = currentLessonIndex > 0;
  const hasNextLesson = currentLessonIndex !== -1 && currentLessonIndex < flatLessons.length - 1;

  // Check if the next lesson belongs to a locked section
  const isNextLessonLocked = React.useMemo(() => {
    if (!hasNextLesson || !currentCourse) return false;
    const nextLesson = flatLessons[currentLessonIndex + 1];
    if (!nextLesson) return false;
    const targetSecIdx = currentCourse.sections.findIndex((s) =>
      s.lessons.some((l) => l.id === nextLesson.id),
    );
    if (targetSecIdx <= 0) return false;
    const lockStatus = getSectionLockStatus(targetSecIdx, currentCourse.sections, passedExamIds);
    return lockStatus.isLocked;
  }, [hasNextLesson, flatLessons, currentLessonIndex, currentCourse, passedExamIds]);

  // Handle lesson navigation with lock check
  const handleSelectLesson = (lessonId: string | null) => {
    if (!lessonId) {
      setSelectedLessonId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!currentCourse) return;

    // Determine target section
    const targetSecIdx = currentCourse.sections.findIndex((s) =>
      s.lessons.some((l) => l.id === lessonId),
    );

    if (targetSecIdx > 0) {
      const lockStatus = getSectionLockStatus(targetSecIdx, currentCourse.sections, passedExamIds);
      if (lockStatus.isLocked) {
        setLockedSectionData({
          section: currentCourse.sections[targetSecIdx] || null,
          requiredExamId: lockStatus.requiredExamId,
        });
        setLockedModalOpen(true);
        return;
      }
    }

    setSelectedLessonId(lessonId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextLesson = () => {
    if (hasNextLesson) {
      const nextLesson = flatLessons[currentLessonIndex + 1];
      if (nextLesson) {
        handleSelectLesson(nextLesson.id);
      }
    }
  };

  const handlePreviousLesson = () => {
    if (hasPreviousLesson) {
      handleSelectLesson(flatLessons[currentLessonIndex - 1].id);
    }
  };

  const handleAttemptLockedLesson = (section: CourseSection, requiredExamId?: string) => {
    setLockedSectionData({
      section,
      requiredExamId,
    });
    setLockedModalOpen(true);
  };

  // Toggle completion
  const handleToggleCompletion = (lessonId: string) => {
    const res = toggleLessonCompletion(courseId, lessonId);
    setCompletedLessons(res.completedLessons);
  };

  // Progress percentage
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter((l) => completedLessons.includes(l.id)).length;
  const progressPercentage = calculateCourseProgress(totalLessons, completedCount);
  const isFullyCompleted = totalLessons > 0 && completedCount === totalLessons;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!currentCourse) {
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
  // CASE 1: STUDENT IS NOT ENROLLED IN THE COURSE (Preview & Purchase Landing)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isEnrolled) {
    return (
      <StudentCoursePreviewView
        course={currentCourse}
        matchedTeacher={matchedTeacher}
        onEnroll={handleEnroll}
        isEnrolling={isEnrolling}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASE 2: STUDENT IS ENROLLED IN THE COURSE (Active Learning Dashboard View)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-6">
      {/* 2-Column Responsive Workspace Grid */}
      {/* On desktop: Sidebar on start (left in LTR, right in RTL), Main view on end */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Course Content Navigation */}
        <aside
          className={cn(
            "order-2 lg:order-1 lg:sticky lg:top-20 max-h-none lg:max-h-[calc(100vh-6rem)] flex flex-col transition-all duration-300",
            isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-5 xl:col-span-4",
          )}
        >
          <StudentCourseContentSidebar
            course={currentCourse}
            selectedLessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
            completedLessons={completedLessons}
            passedExamIds={passedExamIds}
            onToggleLessonCompletion={handleToggleCompletion}
            onAttemptLockedLesson={handleAttemptLockedLesson}
            progressPercentage={progressPercentage}
            onOpenCertificate={() => setCertificateOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        </aside>

        {/* Main Content Workspace: Overview or Active Lesson */}
        <main
          className={cn(
            "order-1 lg:order-2 space-y-6 transition-all duration-300",
            isSidebarCollapsed ? "lg:col-span-11" : "lg:col-span-7 xl:col-span-8",
          )}
        >
          <StudentCourseMainView
            course={currentCourse}
            selectedLesson={selectedLesson}
            completedLessons={completedLessons}
            passedExamIds={passedExamIds}
            onToggleLessonCompletion={handleToggleCompletion}
            onSelectLesson={handleSelectLesson}
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
            hasNextLesson={hasNextLesson}
            hasPreviousLesson={hasPreviousLesson}
            isNextLessonLocked={isNextLessonLocked}
            teacherImage={matchedTeacher?.image}
            accessEndDate="2026-12-31"
          />
        </main>
      </div>

      {/* Locked Section Dialog */}
      <StudentLockedSectionDialog
        open={lockedModalOpen}
        onOpenChange={setLockedModalOpen}
        lockedSection={lockedSectionData.section}
        requiredExamId={lockedSectionData.requiredExamId}
      />

      {/* Certificate Modal */}
      <StudentCertificateDialog
        open={certificateOpen}
        onOpenChange={setCertificateOpen}
        course={currentCourse}
        isFullyCompleted={isFullyCompleted}
      />
    </div>
  );
}
