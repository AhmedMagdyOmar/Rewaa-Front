import { useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { myCoursesService } from "@/lib/api/my-courses-service";
import type { BackendCourseContentSectionLesson, BackendMyCourse } from "@/types/api-contracts";
import * as React from "react";

export interface StudentEnrolledLessonItem {
  id: number;
  courseId: number;
  courseTitle: Record<string, string>;
  courseCoverImage: string | null;
  sectionId: number;
  sectionTitle: Record<string, string>;
  title: Record<string, string>;
  type: string; // "video_and_text" | "text_only"
  position: number;
  isLocked: boolean;
  isCompleted: boolean;
  instructor: { id: number; full_name: string; avatar?: string | null } | null;
  educationalStage: { id: number; name: Record<string, string> } | null;
  subject: { id: number; name: Record<string, string> } | null;
  deliveryMode?: string | null;
  exam: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
    is_passed: boolean;
  } | null;
}

/**
 * Hook to fetch all accessible lessons across the student's enrolled courses.
 * Aggregates all course contents seamlessly using TanStack Query.
 */
export function useStudentEnrolledLessons() {
  // 1. Fetch all enrolled courses (up to 100 courses for student learning portal)
  const myCoursesQuery = useQuery({
    queryKey: queryKeys.student.myCourses({ per_page: 100 }),
    queryFn: () => myCoursesService.getMyCourses({ per_page: 100 }),
    staleTime: 60 * 1000,
  });

  const courses = React.useMemo<BackendMyCourse[]>(
    () => myCoursesQuery.data?.courses || [],
    [myCoursesQuery.data?.courses],
  );

  // 2. Fetch content tree for each enrolled course in parallel
  const courseContentQueries = useQueries({
    queries: courses.map((course) => {
      const courseId = course.id ?? course.course_id ?? 0;
      return {
        queryKey: queryKeys.student.courseContent(courseId),
        queryFn: () => myCoursesService.getCourseContent(courseId),
        enabled: Boolean(courseId),
        staleTime: 60 * 1000,
      };
    }),
  });

  const isContentLoading = courseContentQueries.some((q) => q.isLoading);

  // 3. Aggregate flattened lessons list
  const lessons = React.useMemo<StudentEnrolledLessonItem[]>(() => {
    const list: StudentEnrolledLessonItem[] = [];

    courses.forEach((course, index) => {
      const courseId = course.id ?? course.course_id ?? 0;
      const content = courseContentQueries[index]?.data?.content;
      if (!content || !content.sections) return;

      content.sections.forEach((section) => {
        (section.lessons || []).forEach((lesson: BackendCourseContentSectionLesson) => {
          list.push({
            id: lesson.id,
            courseId,
            courseTitle: course.title,
            courseCoverImage: course.cover_image || course.cover_image_url || null,
            sectionId: section.id,
            sectionTitle: section.title,
            title: lesson.title,
            type: lesson.type,
            position: lesson.position,
            isLocked: Boolean(lesson.is_locked),
            isCompleted: Boolean(lesson.is_completed),
            instructor: course.instructor || null,
            educationalStage: course.educational_stage || null,
            subject: course.subject || null,
            deliveryMode: course.delivery_mode,
            exam: lesson.exam
              ? {
                  id: lesson.exam.id,
                  title: lesson.exam.title,
                  passing_percentage: lesson.exam.passing_percentage,
                  is_passed: Boolean(lesson.exam.is_passed),
                }
              : null,
          });
        });
      });
    });

    return list;
  }, [courses, courseContentQueries]);

  return {
    lessons,
    courses,
    isLoading: myCoursesQuery.isLoading || isContentLoading,
    isError: myCoursesQuery.isError,
    refetch: () => {
      myCoursesQuery.refetch();
      courseContentQueries.forEach((q) => q.refetch());
    },
  };
}
