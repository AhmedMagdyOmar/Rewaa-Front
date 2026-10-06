import { api } from "@/lib/apiClient";
import type {
  BackendCourseCategory,
  CourseCategoryListResponse,
  StoreCourseCategoryData,
} from "@/types/api-contracts";

export const courseCategoriesService = {
  /**
   * Get all active course categories (defaults + provider-created)
   */
  async getCourseCategories(): Promise<CourseCategoryListResponse> {
    return api<CourseCategoryListResponse>({
      url: "/api/dashboard/provider/course-categories",
      method: "GET",
    });
  },

  /**
   * Create a new custom course category for current provider
   */
  async createCourseCategory(
    data: StoreCourseCategoryData,
  ): Promise<{ category: BackendCourseCategory }> {
    return api<{ category: BackendCourseCategory }>({
      url: "/api/dashboard/provider/course-categories",
      method: "POST",
      data,
    });
  },
};
