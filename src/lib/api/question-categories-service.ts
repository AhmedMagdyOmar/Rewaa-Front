import { api } from "@/lib/apiClient";
import type {
  BackendQuestionCategory,
  QuestionCategoryListResponse,
  StoreQuestionCategoryData,
} from "@/types/api-contracts";

export const questionCategoriesService = {
  /**
   * Get all active question categories (defaults + provider-created)
   */
  async getQuestionCategories(): Promise<QuestionCategoryListResponse> {
    return api<QuestionCategoryListResponse>({
      url: "/api/dashboard/provider/question-categories",
      method: "GET",
    });
  },

  /**
   * Create a new custom question category for current provider
   */
  async createQuestionCategory(
    data: StoreQuestionCategoryData,
  ): Promise<{ category: BackendQuestionCategory }> {
    return api<{ category: BackendQuestionCategory }>({
      url: "/api/dashboard/provider/question-categories",
      method: "POST",
      data,
    });
  },
};
