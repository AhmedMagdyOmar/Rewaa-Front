import { api } from "@/lib/apiClient";
import type {
  BackendLesson,
  BackendLessonOptions,
  LessonFilterParams,
  LessonListResponse,
  ReorderLessonsData,
  StoreLessonData,
  UpdateLessonData,
} from "@/types/api-contracts";

function buildLessonFormData(data: StoreLessonData | UpdateLessonData, method?: "PUT"): FormData {
  const formData = new FormData();

  if (method) {
    formData.append("_method", method);
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "title" || key === "description") {
      Object.entries(value as Record<string, string>).forEach(([loc, text]) => {
        if (text !== undefined && text !== null && text.trim() !== "") {
          formData.append(`${key}[${loc}]`, String(text));
        }
      });
    } else if (key === "cover_image" && value instanceof File) {
      formData.append("cover_image", value);
    } else if (key === "pdf_files" && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) {
          formData.append("pdf_files[]", file);
        }
      });
    } else if (key === "explanatory_images" && Array.isArray(value)) {
      value.forEach((image) => {
        if (image instanceof File) {
          formData.append("explanatory_images[]", image);
        }
      });
    } else if (
      (key === "delete_media_ids" || key === "delete_media_asset_ids") &&
      Array.isArray(value)
    ) {
      value.forEach((id) => {
        formData.append(`${key}[]`, String(id));
      });
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export const lessonsService = {
  /**
   * Get paginated provider lessons with filters and status counts
   */
  async getLessons(params?: LessonFilterParams): Promise<LessonListResponse> {
    return api<LessonListResponse>({
      url: "/api/dashboard/provider/lessons",
      method: "GET",
      params,
    });
  },

  /**
   * Get lookup options (classifications, types, delivery modes, stages, subjects, instructors, courses, exams)
   */
  async getLessonOptions(educationalStageId?: number | string): Promise<BackendLessonOptions> {
    return api<BackendLessonOptions>({
      url: "/api/dashboard/provider/lessons/options",
      method: "GET",
      params: educationalStageId ? { educational_stage_id: educationalStageId } : undefined,
    });
  },

  /**
   * Get single lesson details with relations and media collections
   */
  async getLesson(id: number | string): Promise<BackendLesson> {
    const res = await api<{ lesson: BackendLesson }>({
      url: `/api/dashboard/provider/lessons/${id}`,
      method: "GET",
    });
    return res.lesson;
  },

  /**
   * Create a new lesson
   */
  async createLesson(data: StoreLessonData | FormData): Promise<BackendLesson> {
    let payload = data;

    if (!(data instanceof FormData)) {
      payload = buildLessonFormData(data);
    }

    const res = await api<{ lesson: BackendLesson }>({
      url: "/api/dashboard/provider/lessons",
      method: "POST",
      data: payload,
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.lesson;
  },

  /**
   * Update an existing lesson
   */
  async updateLesson(
    id: number | string,
    data: UpdateLessonData | FormData,
  ): Promise<BackendLesson> {
    let payload = data;
    const isFormData = data instanceof FormData;

    if (!isFormData) {
      const hasFiles =
        data.cover_image instanceof File ||
        (Array.isArray(data.pdf_files) && data.pdf_files.some((f) => f instanceof File)) ||
        (Array.isArray(data.explanatory_images) &&
          data.explanatory_images.some((f) => f instanceof File)) ||
        Boolean(data.remove_cover_image);

      if (hasFiles) {
        payload = buildLessonFormData(data, "PUT");
      }
    }

    const usesMultipart = payload instanceof FormData;

    const res = await api<{ lesson: BackendLesson }>({
      url: `/api/dashboard/provider/lessons/${id}`,
      method: usesMultipart ? "POST" : "PUT",
      data: payload,
      headers: usesMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.lesson;
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(id: number | string): Promise<void> {
    await api({
      url: `/api/dashboard/provider/lessons/${id}`,
      method: "DELETE",
    });
  },

  /**
   * Reorder lessons within a group / section
   */
  async reorderLessons(data: ReorderLessonsData): Promise<BackendLesson[]> {
    const res = await api<{ lessons: BackendLesson[] }>({
      url: "/api/dashboard/provider/lessons/reorder",
      method: "PATCH",
      data,
    });
    return res.lessons;
  },
};
