import { api } from "@/lib/apiClient";
import type {
  BackendExamCategory,
  ExamCategoryListResponse,
  StoreExamCategoryData,
} from "@/types/api-contracts";

export const examCategoriesService = {
  /**
   * Get all active exam categories (defaults + provider-created)
   */
  async getExamCategories(): Promise<ExamCategoryListResponse> {
    return api<ExamCategoryListResponse>({
      url: "/api/dashboard/provider/exam-categories",
      method: "GET",
    });
  },

  /**
   * Create a new custom exam category for current provider
   */
  async createExamCategory(
    data: StoreExamCategoryData,
  ): Promise<{ category: BackendExamCategory }> {
    return api<{ category: BackendExamCategory }>({
      url: "/api/dashboard/provider/exam-categories",
      method: "POST",
      data,
    });
  },
};
