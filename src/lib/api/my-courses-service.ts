import { api } from "@/lib/apiClient";
import type {
  CourseContentResponse,
  LessonCompletionResponse,
  MyCoursesFilterParams,
  MyCoursesListResponse,
  StudentCourseDetailsResponse,
  StudentLessonDetailsResponse,
} from "@/types/api-contracts";

export const myCoursesService = {
  /**
   * Get enrolled student courses with filters (search, sort, pagination)
   * GET /api/website/my-courses
   */
  async getMyCourses(params?: MyCoursesFilterParams): Promise<MyCoursesListResponse> {
    return api<MyCoursesListResponse>({
      url: "/api/website/my-courses",
      method: "GET",
      params,
    });
  },

  /**
   * Get details for an enrolled student course.
   * GET /api/website/my-courses/{courseId}
   */
  async getEnrolledCourse(courseId: number | string): Promise<StudentCourseDetailsResponse> {
    return api<StudentCourseDetailsResponse>({
      url: `/api/website/my-courses/${courseId}`,
      method: "GET",
    });
  },

  /**
   * Get syllabus tree and curriculum content for an enrolled student course.
   * GET /api/website/my-courses/{courseId}/content
   */
  async getCourseContent(courseId: number | string): Promise<CourseContentResponse> {
    return api<CourseContentResponse>({
      url: `/api/website/my-courses/${courseId}/content`,
      method: "GET",
    });
  },

  /**
   * Get full lesson details for an enrolled course lesson.
   * GET /api/website/my-courses/{courseId}/lessons/{lessonId}
   */
  async getLessonDetail(
    courseId: number | string,
    lessonId: number | string,
  ): Promise<StudentLessonDetailsResponse> {
    return api<StudentLessonDetailsResponse>({
      url: `/api/website/my-courses/${courseId}/lessons/${lessonId}`,
      method: "GET",
    });
  },

  /**
   * Mark an enrolled lesson as completed.
   * POST /api/website/my-courses/{courseId}/lessons/{lessonId}/completion
   */
  async markLessonComplete(
    courseId: number | string,
    lessonId: number | string,
  ): Promise<LessonCompletionResponse> {
    return api<LessonCompletionResponse>({
      url: `/api/website/my-courses/${courseId}/lessons/${lessonId}/completion`,
      method: "POST",
    });
  },

  /**
   * Mark an enrolled lesson as incomplete (uncomplete).
   * DELETE /api/website/my-courses/{courseId}/lessons/{lessonId}/completion
   */
  async markLessonIncomplete(
    courseId: number | string,
    lessonId: number | string,
  ): Promise<LessonCompletionResponse> {
    return api<LessonCompletionResponse>({
      url: `/api/website/my-courses/${courseId}/lessons/${lessonId}/completion`,
      method: "DELETE",
    });
  },

  /**
   * Download or fetch protected lesson media (PDF attachment or Explanatory Image)
   * as a Blob with student Authorization headers.
   */
  async downloadLessonMedia(url: string): Promise<Blob> {
    const { axiosInstance } = await import("@/lib/apiClient");
    const response = await axiosInstance.get(url, {
      responseType: "blob",
    });
    return response as unknown as Blob;
  },
};
