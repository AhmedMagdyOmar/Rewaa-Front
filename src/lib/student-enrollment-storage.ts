/**
 * @deprecated Fully deprecated in Phase 7.
 * All student enrollment states are now sourced directly from backend APIs:
 * - GET /api/website/my-courses (useMyCourses)
 * - GET /api/website/courses (useExploreCourses)
 * - POST /api/website/orders (useStudentEnroll)
 *
 * This file is retained only for backwards compatibility with any remaining legacy scripts.
 */

export function getEnrolledCourseIds(): string[] {
  return [];
}

export function isCourseEnrolled(_courseId: string): boolean {
  return false;
}

export function enrollCourse(_courseId: string): string[] {
  return [];
}

export function unenrollCourse(_courseId: string): string[] {
  return [];
}

export function resetEnrolledCourses(): string[] {
  return [];
}
