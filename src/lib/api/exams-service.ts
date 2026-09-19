import { api } from "@/lib/apiClient";
import type {
  BackendExam,
  BackendExamComplaint,
  BackendExamOptions,
  BackendExamSection,
  ExamAttemptsListResponse,
  ExamComplaintFilterParams,
  ExamComplaintsListResponse,
  ExamFilterParams,
  ExamListResponse,
  StoreExamData,
  StoreExamSectionData,
  UpdateExamData,
  UpdateExamSectionData,
} from "@/types/api-contracts";

export const examsService = {
  /**
   * Get paginated exams with filtering and status counts
   */
  async getExams(filters?: ExamFilterParams): Promise<ExamListResponse> {
    return api<ExamListResponse>({
      url: "/api/dashboard/provider/exams",
      method: "GET",
      params: filters,
    });
  },

  /**
   * Get options for exam creation/filtering (stages, subjects, instructors, courses)
   */
  async getExamOptions(educationalStageId?: number | string): Promise<BackendExamOptions> {
    return api<BackendExamOptions>({
      url: "/api/dashboard/provider/exams/options",
      method: "GET",
      params: educationalStageId ? { educational_stage_id: educationalStageId } : undefined,
    });
  },

  /**
   * Get single exam details (including sections and questions)
   */
  async getExam(id: number | string): Promise<BackendExam> {
    const response = await api<{ exam: BackendExam }>({
      url: `/api/dashboard/provider/exams/${id}`,
      method: "GET",
    });
    return response.exam;
  },

  /**
   * Create new exam
   */
  async createExam(data: StoreExamData): Promise<BackendExam> {
    const response = await api<{ exam: BackendExam }>({
      url: `/api/dashboard/provider/exams`,
      method: "POST",
      data,
    });
    return response.exam;
  },

  /**
   * Update existing exam
   */
  async updateExam(id: number | string, data: UpdateExamData): Promise<BackendExam> {
    const response = await api<{ exam: BackendExam }>({
      url: `/api/dashboard/provider/exams/${id}`,
      method: "PUT",
      data,
    });
    return response.exam;
  },

  /**
   * Delete an exam
   */
  async deleteExam(id: number | string): Promise<void> {
    await api<void>({
      url: `/api/dashboard/provider/exams/${id}`,
      method: "DELETE",
    });
  },

  /**
   * Publish an exam immediately
   */
  async publishExam(id: number | string): Promise<BackendExam> {
    const response = await api<{ exam: BackendExam }>({
      url: `/api/dashboard/provider/exams/${id}/publish`,
      method: "PATCH",
    });
    return response.exam;
  },

  /**
   * Schedule exam publication
   */
  async scheduleExam(id: number | string, scheduledPublishAt: string): Promise<BackendExam> {
    const response = await api<{ exam: BackendExam }>({
      url: `/api/dashboard/provider/exams/${id}/schedule`,
      method: "PATCH",
      data: { scheduled_publish_at: scheduledPublishAt },
    });
    return response.exam;
  },

  /**
   * Convert standalone exam to course exam
   */
  async convertToCourse(
    id: number | string,
    data: { course_id: number; course_section_id: number; lesson_id?: number | null },
  ): Promise<BackendExam> {
    const response = await api<{ exam: BackendExam }>({
      url: `/api/dashboard/provider/exams/${id}/convert-to-course`,
      method: "PATCH",
      data,
    });
    return response.exam;
  },

  /**
   * Section Management: List sections
   */
  async getSections(examId: number | string): Promise<BackendExamSection[]> {
    const response = await api<{ sections: BackendExamSection[] }>({
      url: `/api/dashboard/provider/exams/${examId}/sections`,
      method: "GET",
    });
    return response.sections;
  },

  /**
   * Section Management: Create section
   */
  async createSection(
    examId: number | string,
    data: StoreExamSectionData,
  ): Promise<BackendExamSection> {
    const response = await api<{ section: BackendExamSection }>({
      url: `/api/dashboard/provider/exams/${examId}/sections`,
      method: "POST",
      data,
    });
    return response.section;
  },

  /**
   * Section Management: Update section
   */
  async updateSection(
    examId: number | string,
    sectionId: number | string,
    data: UpdateExamSectionData,
  ): Promise<BackendExamSection> {
    const response = await api<{ section: BackendExamSection }>({
      url: `/api/dashboard/provider/exams/${examId}/sections/${sectionId}`,
      method: "PUT",
      data,
    });
    return response.section;
  },

  /**
   * Section Management: Delete section
   */
  async deleteSection(examId: number | string, sectionId: number | string): Promise<void> {
    await api<void>({
      url: `/api/dashboard/provider/exams/${examId}/sections/${sectionId}`,
      method: "DELETE",
    });
  },

  /**
   * Section Management: Reorder sections
   */
  async reorderSections(
    examId: number | string,
    sectionIds: number[],
  ): Promise<BackendExamSection[]> {
    const response = await api<{ sections: BackendExamSection[] }>({
      url: `/api/dashboard/provider/exams/${examId}/sections/reorder`,
      method: "PATCH",
      data: { section_ids: sectionIds },
    });
    return response.sections;
  },

  /**
   * Student Attempts: Get attempts for an exam
   */
  async getExamAttempts(filters: {
    exam_id?: number | string;
    student_id?: number | string;
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<ExamAttemptsListResponse> {
    return api<ExamAttemptsListResponse>({
      url: `/api/dashboard/provider/exam-attempts`,
      method: "GET",
      params: filters,
    });
  },

  /**
   * Complaints Management: Get paginated complaints for an exam
   */
  async getComplaints(
    examId: number | string,
    filters?: ExamComplaintFilterParams,
  ): Promise<ExamComplaintsListResponse> {
    return api<ExamComplaintsListResponse>({
      url: `/api/dashboard/provider/exams/${examId}/complaints`,
      method: "GET",
      params: filters,
    });
  },

  /**
   * Complaints Management: Get single complaint details
   */
  async getComplaint(
    examId: number | string,
    complaintId: number | string,
  ): Promise<BackendExamComplaint> {
    const response = await api<{ complaint: BackendExamComplaint }>({
      url: `/api/dashboard/provider/exams/${examId}/complaints/${complaintId}`,
      method: "GET",
    });
    return response.complaint;
  },

  /**
   * Complaints Management: Delete/dismiss a complaint
   */
  async deleteComplaint(examId: number | string, complaintId: number | string): Promise<void> {
    await api<void>({
      url: `/api/dashboard/provider/exams/${examId}/complaints/${complaintId}`,
      method: "DELETE",
    });
  },
};
