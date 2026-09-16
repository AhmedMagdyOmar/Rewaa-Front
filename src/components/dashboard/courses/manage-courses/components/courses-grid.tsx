"use client";

import { Course } from "@/types/course";
import { CourseCard } from "../../course-card";
import { CoursesGridSkeleton } from "./courses-grid-skeleton";
import { CoursesEmptyState } from "./courses-empty-state";

interface CoursesGridProps {
  isLoading: boolean;
  courses: Course[];
  copiedId: string | null;
  onPublishToggle: (courseId: string) => void;
  onCopyLink: (courseId: string) => void;
  onDeleteRequest: (course: Course) => void;
}

export function CoursesGrid({
  isLoading,
  courses,
  copiedId,
  onPublishToggle,
  onCopyLink,
  onDeleteRequest,
}: CoursesGridProps) {
  if (isLoading) {
    return <CoursesGridSkeleton />;
  }

  if (courses.length === 0) {
    return <CoursesEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          copiedId={copiedId}
          onPublishToggle={onPublishToggle}
          onCopyLink={onCopyLink}
          onDeleteRequest={onDeleteRequest}
        />
      ))}
    </div>
  );
}
