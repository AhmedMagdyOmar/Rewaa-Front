import { api } from "@/lib/apiClient";
import type {
  ExploreCoursesFilterParams,
  ExploreCoursesListResponse,
  StoreStudentOrderPayload,
  StoreStudentOrderResponse,
  StudentCourseDetailsResponse,
} from "@/types/api-contracts";

export const exploreCoursesService = {
  /**
   * Get available (non-enrolled) courses for the authenticated student.
   * GET /api/website/courses
   */
  async getAvailableCourses(
    params?: ExploreCoursesFilterParams,
  ): Promise<ExploreCoursesListResponse> {
    return api<ExploreCoursesListResponse>({
      url: "/api/website/courses",
      method: "GET",
      params,
    });
  },

  /**
   * Get details for an available/unenrolled course.
   * GET /api/website/courses/{courseId}
   */
  async getAvailableCourse(courseId: number | string): Promise<StudentCourseDetailsResponse> {
    return api<StudentCourseDetailsResponse>({
      url: `/api/website/courses/${courseId}`,
      method: "GET",
    });
  },

  /**
   * Create an order (enrollment) for one or more courses.
   * POST /api/website/orders
   * If total is 0 (free course), backend auto-fulfills and activates enrollment immediately.
   */
  async createOrder(payload: StoreStudentOrderPayload): Promise<StoreStudentOrderResponse> {
    return api<StoreStudentOrderResponse>({
      url: "/api/website/orders",
      method: "POST",
      data: payload,
    });
  },
};
