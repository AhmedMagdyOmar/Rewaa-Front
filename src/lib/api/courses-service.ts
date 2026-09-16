import { api } from "@/lib/apiClient";
import type {
  BackendCourse,
  BackendCourseOptions,
  BackendCourseSection,
  CourseListResponse,
} from "@/types/api-contracts";

export interface CourseFilterParams {
  search?: string;
  status?: string;
  educational_stage_id?: number | string;
  subject_id?: number | string;
  instructor_id?: number | string;
  subscription_period?: string;
  delivery_mode?: string;
  is_free?: boolean | number | string;
  is_active?: boolean | number | string;
  has_discount?: boolean | number | string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface StoreCourseData {
  title: { ar: string; en?: string };
  description?: { ar?: string; en?: string };
  intro_video_url?: string;
  cover_image?: File | null;
  educational_stage_id: number;
  subject_id: number;
  instructor_id?: number;
  subscription_period: string;
  is_free: boolean;
  base_price: number;
  currency_code?: string;
  has_discount: boolean;
  discount_percentage?: number;
  discount_starts_at?: string;
  discount_ends_at?: string;
  has_limited_access: boolean;
  access_duration_days?: number;
  uses_student_groups: boolean;
  delivery_mode: string;
  status?: string;
  scheduled_publish_at?: string;
  is_active: boolean;
}

export interface UpdateCourseData extends Partial<StoreCourseData> {
  remove_cover_image?: boolean;
}

export interface StoreCourseSectionData {
  title: { ar: string; en?: string };
  exam_id?: number | null;
  requires_exam_pass_to_unlock_next_section?: boolean;
  status?: string;
  scheduled_publish_at?: string;
}

export type UpdateCourseSectionData = Partial<StoreCourseSectionData>;

export const coursesService = {
  /**
   * Get paginated provider courses with filters and status counts
   */
  async getCourses(params?: CourseFilterParams): Promise<CourseListResponse> {
    return api<CourseListResponse>({
      url: "/api/dashboard/provider/courses",
      method: "GET",
      params,
    });
  },

  /**
   * Get lookup options (stages, subjects, instructors, periods, modes, statuses)
   */
  async getCourseOptions(educationalStageId?: number | string): Promise<BackendCourseOptions> {
    return api<BackendCourseOptions>({
      url: "/api/dashboard/provider/courses/options",
      method: "GET",
      params: educationalStageId ? { educational_stage_id: educationalStageId } : undefined,
    });
  },

  /**
   * Get single course details
   */
  async getCourse(id: number | string): Promise<BackendCourse> {
    const res = await api<{ course: BackendCourse }>({
      url: `/api/dashboard/provider/courses/${id}`,
      method: "GET",
    });
    return res.course;
  },

  /**
   * Get course with deep curriculum (sections and lessons)
   */
  async getCourseContent(id: number | string): Promise<BackendCourse> {
    const res = await api<{ course: BackendCourse }>({
      url: `/api/dashboard/provider/courses/${id}/content`,
      method: "GET",
    });
    return res.course;
  },

  /**
   * Create course (handles multipart FormData if file is attached)
   */
  async createCourse(data: StoreCourseData | FormData): Promise<BackendCourse> {
    let payload = data;

    if (!(data instanceof FormData)) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "title" || key === "description") {
          Object.entries(value as Record<string, string>).forEach(([loc, text]) => {
            if (text !== undefined && text !== null) {
              formData.append(`${key}[${loc}]`, String(text));
            }
          });
        } else if (key === "cover_image" && value instanceof File) {
          formData.append("cover_image", value);
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
        } else {
          formData.append(key, String(value));
        }
      });
      payload = formData;
    }

    const res = await api<{ course: BackendCourse }>({
      url: "/api/dashboard/provider/courses",
      method: "POST",
      data: payload,
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.course;
  },

  /**
   * Update course
   */
  async updateCourse(
    id: number | string,
    data: UpdateCourseData | FormData,
  ): Promise<BackendCourse> {
    let payload = data;

    if (!(data instanceof FormData)) {
      const hasFile = data.cover_image instanceof File;
      const hasRemoveCover = Boolean(data.remove_cover_image);
      if (hasFile || hasRemoveCover) {
        const formData = new FormData();
        formData.append("_method", "PUT");
        Object.entries(data).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === "title" || key === "description") {
            Object.entries(value as Record<string, string>).forEach(([loc, text]) => {
              if (text !== undefined && text !== null) {
                formData.append(`${key}[${loc}]`, String(text));
              }
            });
          } else if (key === "cover_image" && value instanceof File) {
            formData.append("cover_image", value);
          } else if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        });
        payload = formData;
      }
    }

    const res = await api<{ course: BackendCourse }>({
      url: `/api/dashboard/provider/courses/${id}`,
      method: payload instanceof FormData ? "POST" : "PUT",
      data: payload,
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.course;
  },

  /**
   * Delete course
   */
  async deleteCourse(id: number | string): Promise<void> {
    await api({
      url: `/api/dashboard/provider/courses/${id}`,
      method: "DELETE",
    });
  },

  /**
   * One-click publish course
   */
  async publishCourse(id: number | string): Promise<BackendCourse> {
    const res = await api<{ course: BackendCourse }>({
      url: `/api/dashboard/provider/courses/${id}/publish`,
      method: "PATCH",
    });
    return res.course;
  },

  /**
   * Schedule publish course
   */
  async scheduleCourse(id: number | string, scheduledPublishAt: string): Promise<BackendCourse> {
    const res = await api<{ course: BackendCourse }>({
      url: `/api/dashboard/provider/courses/${id}/schedule`,
      method: "PATCH",
      data: { scheduled_publish_at: scheduledPublishAt },
    });
    return res.course;
  },

  /**
   * Course Sections Management
   */
  async getSections(courseId: number | string): Promise<BackendCourseSection[]> {
    const res = await api<{ sections: BackendCourseSection[] }>({
      url: `/api/dashboard/provider/courses/${courseId}/sections`,
      method: "GET",
    });
    return res.sections;
  },

  async createSection(
    courseId: number | string,
    data: StoreCourseSectionData,
  ): Promise<BackendCourseSection> {
    const res = await api<{ section: BackendCourseSection }>({
      url: `/api/dashboard/provider/courses/${courseId}/sections`,
      method: "POST",
      data,
    });
    return res.section;
  },

  async updateSection(
    courseId: number | string,
    sectionId: number | string,
    data: UpdateCourseSectionData,
  ): Promise<BackendCourseSection> {
    const res = await api<{ section: BackendCourseSection }>({
      url: `/api/dashboard/provider/courses/${courseId}/sections/${sectionId}`,
      method: "PUT",
      data,
    });
    return res.section;
  },

  async deleteSection(courseId: number | string, sectionId: number | string): Promise<void> {
    await api({
      url: `/api/dashboard/provider/courses/${courseId}/sections/${sectionId}`,
      method: "DELETE",
    });
  },

  async reorderSections(
    courseId: number | string,
    sectionIds: number[],
  ): Promise<BackendCourseSection[]> {
    const res = await api<{ sections: BackendCourseSection[] }>({
      url: `/api/dashboard/provider/courses/${courseId}/sections/reorder`,
      method: "PATCH",
      data: { section_ids: sectionIds },
    });
    return res.sections;
  },
};
