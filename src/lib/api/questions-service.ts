import { api } from "@/lib/apiClient";
import type {
  BackendQuestion,
  BackendQuestionOptions,
  QuestionFilterParams,
  QuestionListResponse,
  StoreQuestionData,
  UpdateQuestionData,
} from "@/types/api-contracts";

export const questionsService = {
  /**
   * Get paginated questions with filtering
   */
  async getQuestions(filters?: QuestionFilterParams): Promise<QuestionListResponse> {
    return api<QuestionListResponse>({
      url: "/api/dashboard/provider/questions",
      method: "GET",
      params: filters,
    });
  },

  /**
   * Get options for question creation/filtering (stages, subjects, types, difficulties, exams)
   */
  async getQuestionOptions(
    educationalStageId?: number | string,
    examId?: number | string,
  ): Promise<BackendQuestionOptions> {
    const params: Record<string, unknown> = {};
    if (educationalStageId && educationalStageId !== "all") {
      params.educational_stage_id = educationalStageId;
    }
    if (examId && examId !== "none") {
      params.exam_id = examId;
    }

    return api<BackendQuestionOptions>({
      url: "/api/dashboard/provider/questions/options",
      method: "GET",
      params,
    });
  },

  /**
   * Get single question details
   */
  async getQuestion(id: number | string): Promise<BackendQuestion> {
    const response = await api<{ question: BackendQuestion }>({
      url: `/api/dashboard/provider/questions/${id}`,
      method: "GET",
    });
    return response.question;
  },

  /**
   * Create a new question
   */
  async createQuestion(data: StoreQuestionData): Promise<BackendQuestion> {
    const response = await api<{ question: BackendQuestion }>({
      url: `/api/dashboard/provider/questions`,
      method: "POST",
      data,
    });
    return response.question;
  },

  /**
   * Update existing question
   */
  async updateQuestion(id: number | string, data: UpdateQuestionData): Promise<BackendQuestion> {
    const response = await api<{ question: BackendQuestion }>({
      url: `/api/dashboard/provider/questions/${id}`,
      method: "PUT",
      data,
    });
    return response.question;
  },

  /**
   * Delete a question
   */
  async deleteQuestion(id: number | string): Promise<void> {
    await api<void>({
      url: `/api/dashboard/provider/questions/${id}`,
      method: "DELETE",
    });
  },

  /**
   * Reorder questions in an exam / section
   */
  async reorderQuestions(
    questionIds: number[],
    examId?: number | string,
    examSectionId?: number | string,
  ): Promise<BackendQuestion[]> {
    const response = await api<{ questions: BackendQuestion[] }>({
      url: `/api/dashboard/provider/questions/reorder`,
      method: "PATCH",
      data: {
        question_ids: questionIds,
        exam_id: examId,
        exam_section_id: examSectionId,
      },
    });
    return response.questions;
  },
};
