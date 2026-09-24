import { api } from "@/lib/apiClient";
import type {
  BackendExamComplaint,
  BackendStudentExam,
  BackendStudentExamAttempt,
  SaveExamAnswerPayload,
  StudentExamAttemptResponse,
  StudentExamAttemptsListResponse,
  StudentExamDetailResponse,
  StudentExamsFilterParams,
  StudentExamsListResponse,
  SubmitExamAttemptPayload,
} from "@/types/api-contracts";

export const studentExamsService = {
  /**
   * Get paginated course-linked exams for current student
   * GET /api/website/exams
   */
  async getExams(params?: StudentExamsFilterParams): Promise<StudentExamsListResponse> {
    return api<StudentExamsListResponse>({
      url: "/api/website/exams",
      method: "GET",
      params,
    });
  },

  /**
   * Get paginated general platform-wide exams for current student
   * GET /api/website/general-exams
   */
  async getGeneralExams(params?: StudentExamsFilterParams): Promise<StudentExamsListResponse> {
    return api<StudentExamsListResponse>({
      url: "/api/website/general-exams",
      method: "GET",
      params,
    });
  },

  /**
   * Get exam details and accessibility criteria for student
   * GET /api/website/exams/{examId}
   */
  async getExam(examId: number | string): Promise<BackendStudentExam> {
    const response = await api<StudentExamDetailResponse>({
      url: `/api/website/exams/${examId}`,
      method: "GET",
    });
    return response.exam;
  },

  /**
   * Start or resume an exam attempt for student
   * POST /api/website/exams/{examId}/attempts OR POST /api/website/my-courses/{courseId}/exams/{examId}/attempts
   */
  async startAttempt(
    examId: number | string,
    courseId?: number | string,
  ): Promise<BackendStudentExamAttempt> {
    const url = courseId
      ? `/api/website/my-courses/${courseId}/exams/${examId}/attempts`
      : `/api/website/exams/${examId}/attempts`;

    const response = await api<StudentExamAttemptResponse>({
      url,
      method: "POST",
    });
    return response.attempt;
  },

  /**
   * Get full details of an active or graded attempt by attempt ID
   * GET /api/website/exam-attempts/{attemptId}
   */
  async getAttempt(attemptId: number | string): Promise<BackendStudentExamAttempt> {
    const response = await api<StudentExamAttemptResponse>({
      url: `/api/website/exam-attempts/${attemptId}`,
      method: "GET",
    });
    return response.attempt;
  },

  /**
   * Get the latest/adopted exam result for a student on an exam
   * GET /api/website/exams/{examId}/result
   */
  async getExamResult(examId: number | string): Promise<BackendStudentExamAttempt> {
    const response = await api<StudentExamAttemptResponse>({
      url: `/api/website/exams/${examId}/result`,
      method: "GET",
    });
    return response.attempt;
  },

  /**
   * List all attempts made by student on a specific course exam
   * GET /api/website/my-courses/{courseId}/exams/{examId}/attempts
   */
  async getCourseExamAttempts(
    courseId: number | string,
    examId: number | string,
  ): Promise<BackendStudentExamAttempt[]> {
    const response = await api<StudentExamAttemptsListResponse>({
      url: `/api/website/my-courses/${courseId}/exams/${examId}/attempts`,
      method: "GET",
    });
    return response.attempts;
  },

  /**
   * Save / autosave answer for a specific question during an active attempt
   * PATCH /api/website/exam-attempts/{attemptId}/answers/{questionId}
   */
  async saveAnswer(
    attemptId: number | string,
    questionId: number | string,
    payload: SaveExamAnswerPayload,
  ): Promise<BackendStudentExamAttempt> {
    const response = await api<StudentExamAttemptResponse>({
      url: `/api/website/exam-attempts/${attemptId}/answers/${questionId}`,
      method: "PATCH",
      data: payload,
    });
    return response.attempt;
  },

  /**
   * Submit exam attempt for final evaluation and grading
   * POST /api/website/exam-attempts/{attemptId}/submit
   */
  async submitAttempt(
    attemptId: number | string,
    payload: SubmitExamAttemptPayload,
    courseId?: number | string,
    examId?: number | string,
  ): Promise<BackendStudentExamAttempt> {
    const url =
      courseId && examId
        ? `/api/website/my-courses/${courseId}/exams/${examId}/attempts/${attemptId}/submit`
        : `/api/website/exam-attempts/${attemptId}/submit`;

    const response = await api<StudentExamAttemptResponse>({
      url,
      method: "POST",
      data: payload,
    });
    return response.attempt;
  },

  /**
   * Submit a student complaint for an exam
   * POST /api/website/exams/{examId}/complaints
   */
  async submitComplaint(examId: number | string, body: string): Promise<BackendExamComplaint> {
    const response = await api<{ complaint: BackendExamComplaint }>({
      url: `/api/website/exams/${examId}/complaints`,
      method: "POST",
      data: { body },
    });
    return response.complaint;
  },
};
