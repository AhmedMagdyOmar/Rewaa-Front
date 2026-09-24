import { api } from "@/lib/apiClient";
import type {
  BackendStudentLessonDetail,
  LessonCompletionResponse,
  StudentLessonDetailsResponse,
  StudentStandaloneLessonsFilterParams,
  StudentStandaloneLessonsListResponse,
} from "@/types/api-contracts";

export const studentLessonsService = {
  /**
   * Get paginated standalone / independent general lessons for current student
   * GET /api/website/lessons
   */
  async getStandaloneLessons(
    params?: StudentStandaloneLessonsFilterParams,
  ): Promise<StudentStandaloneLessonsListResponse> {
    return api<StudentStandaloneLessonsListResponse>({
      url: "/api/website/lessons",
      method: "GET",
      params,
    });
  },

  /**
   * Get standalone lesson details
   * GET /api/website/lessons/{lessonId}
   */
  async getStandaloneLesson(lessonId: number | string): Promise<BackendStudentLessonDetail> {
    const response = await api<StudentLessonDetailsResponse>({
      url: `/api/website/lessons/${lessonId}`,
      method: "GET",
    });
    return response.lesson;
  },

  /**
   * Mark standalone lesson as completed
   * POST /api/website/lessons/{lessonId}/completion
   */
  async markStandaloneComplete(lessonId: number | string): Promise<LessonCompletionResponse> {
    return api<LessonCompletionResponse>({
      url: `/api/website/lessons/${lessonId}/completion`,
      method: "POST",
    });
  },

  /**
   * Mark standalone lesson as incomplete
   * DELETE /api/website/lessons/{lessonId}/completion
   */
  async markStandaloneIncomplete(lessonId: number | string): Promise<LessonCompletionResponse> {
    return api<LessonCompletionResponse>({
      url: `/api/website/lessons/${lessonId}/completion`,
      method: "DELETE",
    });
  },

  /**
   * Get course-nested lesson details
   * GET /api/website/my-courses/{courseId}/lessons/{lessonId}
   */
  async getCourseLesson(
    courseId: number | string,
    lessonId: number | string,
  ): Promise<BackendStudentLessonDetail> {
    const response = await api<StudentLessonDetailsResponse>({
      url: `/api/website/my-courses/${courseId}/lessons/${lessonId}`,
      method: "GET",
    });
    return response.lesson;
  },

  /**
   * Mark course-nested lesson as completed
   * POST /api/website/my-courses/{courseId}/lessons/{lessonId}/completion
   */
  async markCourseLessonComplete(
    courseId: number | string,
    lessonId: number | string,
  ): Promise<LessonCompletionResponse> {
    return api<LessonCompletionResponse>({
      url: `/api/website/my-courses/${courseId}/lessons/${lessonId}/completion`,
      method: "POST",
    });
  },

  /**
   * Mark course-nested lesson as incomplete
   * DELETE /api/website/my-courses/{courseId}/lessons/{lessonId}/completion
   */
  async markCourseLessonIncomplete(
    courseId: number | string,
    lessonId: number | string,
  ): Promise<LessonCompletionResponse> {
    return api<LessonCompletionResponse>({
      url: `/api/website/my-courses/${courseId}/lessons/${lessonId}/completion`,
      method: "DELETE",
    });
  },
};
