import { api } from "@/lib/apiClient";
import type {
  BackendAdmin,
  BackendAnnouncement,
  BackendEducationalStage,
  BackendPlatformSettings,
  BackendSubject,
  BackendTeacher,
} from "@/types/api-contracts";

export interface StageData {
  name: Record<string, string>;
  desc?: Record<string, string>;
  academic_year?: number;
  is_active?: boolean;
}

export interface SubjectData {
  name: Record<string, string>;
  desc?: Record<string, string>;
  educational_stage_ids?: number[];
  is_active?: boolean;
}

export interface TeacherData {
  full_name: string;
  email?: string;
  phone_code?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
  avatar?: File | null;
  avatar_url?: string;
  remove_avatar?: boolean;
  educational_stage_ids?: number[];
  subject_ids?: number[];
}

export interface StaffAdminData {
  full_name: string;
  national_id?: string;
  email: string;
  phone_code?: string;
  phone?: string;
  password?: string;
  role?: string; // "teacher" | "assistant"
  role_id?: number;
  permissions?: string[];
  is_active?: boolean;
}

export interface AnnouncementData {
  title: Record<string, string>;
  details: Record<string, string>;
  image?: File | string;
  image_url?: string;
  remove_image?: boolean;
  link?: string;
  url?: string;
  is_active?: boolean;
}

export const settingsService = {
  // Educational Stages / Grades
  async getStages(): Promise<BackendEducationalStage[]> {
    const res = await api<
      | { educational_stages: BackendEducationalStage[] }
      | { stages: BackendEducationalStage[] }
      | { data: BackendEducationalStage[] }
      | BackendEducationalStage[]
    >({
      url: "/api/dashboard/provider/educational-stages",
      method: "GET",
    });

    if (Array.isArray(res)) return res;
    if ("educational_stages" in res) return res.educational_stages;
    if ("stages" in res) return res.stages;
    if ("data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  async createStage(data: StageData): Promise<BackendEducationalStage> {
    const res = await api<{ stage: BackendEducationalStage } | BackendEducationalStage>({
      url: "/api/dashboard/provider/educational-stages",
      method: "POST",
      data,
    });
    if ("stage" in res) return res.stage;
    return res as BackendEducationalStage;
  },

  async updateStage(
    stageId: number | string,
    data: Partial<StageData>,
  ): Promise<BackendEducationalStage> {
    const res = await api<{ stage: BackendEducationalStage } | BackendEducationalStage>({
      url: `/api/dashboard/provider/educational-stages/${stageId}`,
      method: "PUT",
      data,
    });
    if ("stage" in res) return res.stage;
    return res as BackendEducationalStage;
  },

  async deleteStage(stageId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/educational-stages/${stageId}`,
      method: "DELETE",
    });
  },

  // Subjects
  async getSubjects(stageId?: number | string): Promise<BackendSubject[]> {
    const res = await api<
      { subjects: BackendSubject[] } | { data: BackendSubject[] } | BackendSubject[]
    >({
      url: "/api/dashboard/provider/subjects",
      method: "GET",
      params: stageId ? { stage_id: stageId } : undefined,
    });

    if (Array.isArray(res)) return res;
    if ("subjects" in res) return res.subjects;
    if ("data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  async createSubject(data: SubjectData): Promise<BackendSubject> {
    const res = await api<{ subject: BackendSubject } | BackendSubject>({
      url: "/api/dashboard/provider/subjects",
      method: "POST",
      data,
    });
    if ("subject" in res) return res.subject;
    return res as BackendSubject;
  },

  async updateSubject(
    subjectId: number | string,
    data: Partial<SubjectData>,
  ): Promise<BackendSubject> {
    const res = await api<{ subject: BackendSubject } | BackendSubject>({
      url: `/api/dashboard/provider/subjects/${subjectId}`,
      method: "PUT",
      data,
    });
    if ("subject" in res) return res.subject;
    return res as BackendSubject;
  },

  async deleteSubject(subjectId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/subjects/${subjectId}`,
      method: "DELETE",
    });
  },

  // Teachers
  async getTeachers(): Promise<BackendTeacher[]> {
    const res = await api<
      { teachers: BackendTeacher[] } | { data: BackendTeacher[] } | BackendTeacher[]
    >({
      url: "/api/dashboard/provider/teachers",
      method: "GET",
    });

    if (Array.isArray(res)) return res;
    if ("teachers" in res) return res.teachers;
    if ("data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  async createTeacher(data: TeacherData | FormData): Promise<BackendTeacher> {
    const res = await api<{ teacher: BackendTeacher } | BackendTeacher>({
      url: "/api/dashboard/provider/teachers",
      method: "POST",
      data,
    });
    if ("teacher" in res) return res.teacher;
    return res as BackendTeacher;
  },

  async updateTeacher(
    teacherId: number | string,
    data: Partial<TeacherData> | FormData,
  ): Promise<BackendTeacher> {
    const res = await api<{ teacher: BackendTeacher } | BackendTeacher>({
      url: `/api/dashboard/provider/teachers/${teacherId}`,
      method: data instanceof FormData ? "POST" : "PUT",
      data,
      params: data instanceof FormData ? { _method: "PUT" } : undefined,
    });
    if ("teacher" in res) return res.teacher;
    return res as BackendTeacher;
  },

  async deleteTeacher(teacherId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/teachers/${teacherId}`,
      method: "DELETE",
    });
  },

  // Staff (Assistants / Provider Admins)
  async getAdmins(role?: "teacher" | "assistant" | string): Promise<BackendAdmin[]> {
    const res = await api<{ admins: BackendAdmin[] } | { data: BackendAdmin[] } | BackendAdmin[]>({
      url: "/api/dashboard/provider/admins",
      method: "GET",
      params: role ? { role } : undefined,
    });

    if (Array.isArray(res)) return res;
    if ("admins" in res) return res.admins;
    if ("data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  async createAdmin(data: StaffAdminData): Promise<BackendAdmin> {
    const res = await api<{ admin: BackendAdmin } | BackendAdmin>({
      url: "/api/dashboard/provider/admins",
      method: "POST",
      data,
    });
    if ("admin" in res) return res.admin;
    return res as BackendAdmin;
  },

  async updateAdmin(
    adminId: number | string,
    data: Partial<StaffAdminData>,
  ): Promise<BackendAdmin> {
    const res = await api<{ admin: BackendAdmin } | BackendAdmin>({
      url: `/api/dashboard/provider/admins/${adminId}`,
      method: "PUT",
      data,
    });
    if ("admin" in res) return res.admin;
    return res as BackendAdmin;
  },

  async deleteAdmin(adminId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/admins/${adminId}`,
      method: "DELETE",
    });
  },

  // Announcements
  async getAnnouncements(): Promise<BackendAnnouncement[]> {
    const res = await api<
      | { announcements: BackendAnnouncement[] }
      | { data: BackendAnnouncement[] }
      | BackendAnnouncement[]
    >({
      url: "/api/dashboard/provider/announcements",
      method: "GET",
    });

    if (Array.isArray(res)) return res;
    if ("announcements" in res) return res.announcements;
    if ("data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  async createAnnouncement(data: AnnouncementData | FormData): Promise<BackendAnnouncement> {
    let payload: AnnouncementData | FormData = data;

    if (!(data instanceof FormData)) {
      const hasFile = data.image instanceof File;
      if (hasFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === "title" || key === "details") {
            Object.entries(value as Record<string, string>).forEach(([loc, text]) => {
              if (text !== undefined && text !== null) {
                formData.append(`${key}[${loc}]`, String(text));
              }
            });
          } else if (key === "image" && value instanceof File) {
            formData.append("image", value);
          } else if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        });
        payload = formData;
      }
    }

    const res = await api<{ announcement: BackendAnnouncement } | BackendAnnouncement>({
      url: "/api/dashboard/provider/announcements",
      method: "POST",
      data: payload,
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    if ("announcement" in res) return res.announcement;
    return res as BackendAnnouncement;
  },

  async updateAnnouncement(
    announcementId: number | string,
    data: Partial<AnnouncementData> | FormData,
  ): Promise<BackendAnnouncement> {
    let payload: Partial<AnnouncementData> | FormData = data;

    if (!(data instanceof FormData)) {
      const hasFile = data.image instanceof File;
      const hasRemoveImage = Boolean(data.remove_image);
      if (hasFile || hasRemoveImage) {
        const formData = new FormData();
        formData.append("_method", "PUT");
        Object.entries(data).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === "title" || key === "details") {
            Object.entries(value as Record<string, string>).forEach(([loc, text]) => {
              if (text !== undefined && text !== null) {
                formData.append(`${key}[${loc}]`, String(text));
              }
            });
          } else if (key === "image" && value instanceof File) {
            formData.append("image", value);
          } else if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        });
        payload = formData;
      }
    }

    const res = await api<{ announcement: BackendAnnouncement } | BackendAnnouncement>({
      url: `/api/dashboard/provider/announcements/${announcementId}`,
      method: payload instanceof FormData ? "POST" : "PUT",
      data: payload,
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    if ("announcement" in res) return res.announcement;
    return res as BackendAnnouncement;
  },

  async deleteAnnouncement(announcementId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/announcements/${announcementId}`,
      method: "DELETE",
    });
  },

  // Platform Settings
  async getPlatformSettings(): Promise<BackendPlatformSettings> {
    const res = await api<{ settings: BackendPlatformSettings } | BackendPlatformSettings>({
      url: "/api/dashboard/provider/platform-settings",
      method: "GET",
    });
    if ("settings" in res) return res.settings;
    return res as BackendPlatformSettings;
  },

  async updatePlatformSettings(
    data: Partial<BackendPlatformSettings>,
  ): Promise<BackendPlatformSettings> {
    const res = await api<{ settings: BackendPlatformSettings } | BackendPlatformSettings>({
      url: "/api/dashboard/provider/platform-settings",
      method: "PUT",
      data,
    });
    if ("settings" in res) return res.settings;
    return res as BackendPlatformSettings;
  },
};
