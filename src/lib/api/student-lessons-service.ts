import { api } from "@/lib/apiClient";
import type {
  BackendStudentLessonDetail,
  LessonCompletionResponse,
  StudentLessonDetailsResponse,
} from "@/types/api-contracts";

export const studentLessonsService = {
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
