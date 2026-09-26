/**
 * @deprecated Fully deprecated in Phase 7.
 * All student progress and exam attempts are now handled directly by the backend:
 * - GET /api/website/my-courses/{course}/content (useStudentCourseContent)
 * - POST /api/website/my-courses/{course}/lessons/{lesson}/completion (useToggleLessonCompletion)
 * - GET /api/website/exams/{exam}/result (useStudentExamResult)
 *
 * This file is retained only for backwards compatibility with any remaining legacy scripts.
 */

import { CourseSection } from "@/types/course";

export function getCompletedLessons(_courseId: string): string[] {
  return [];
}

export function toggleLessonCompletion(
  _courseId: string,
  _lessonId: string,
): {
  completedLessons: string[];
  isCompleted: boolean;
} {
  return { completedLessons: [], isCompleted: false };
}

export function calculateCourseProgress(totalLessons: number, completedCount: number): number {
  if (totalLessons <= 0) return 0;
  return Math.min(100, Math.round((completedCount / totalLessons) * 100));
}

export function getPassedExams(): string[] {
  return [];
}

export function isExamPassed(_examId: string): boolean {
  return false;
}

export function recordExamPass(_examId: string, _passed: boolean): string[] {
  return [];
}

export function getSectionLockStatus(
  _sectionIndex: number,
  _sections: CourseSection[],
  _passedExamIds: string[],
): {
  isLocked: boolean;
  requiredExamId?: string;
  requiredSectionTitle?: string;
} {
  return { isLocked: false };
}
