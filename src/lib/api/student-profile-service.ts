import { api } from "@/lib/apiClient";
import type { BackendStudentOptions, UpdateProviderPasswordPayload } from "@/types/api-contracts";

export interface BackendWebsiteStudentProfile {
  id: number;
  student_code?: string;
  provider?: {
    id: number;
    name: string;
  } | null;
  first_name: string | null;
  father_name: string | null;
  family_name: string | null;
  additional_name: string | null;
  full_name: string;
  email: string | null;
  locale: string;
  supported_locales?: string[];
  is_multilingual?: boolean;
  phone_code: string | null;
  phone: string | null;
  guardian_phone_code: string | null;
  guardian_phone: string | null;
  gender: "male" | "female" | null;
  gender_label?: string;
  avatar_url: string | null;
  country_id: number | null;
  country?: { id: number; name: string } | null;
  governorate_id: number | null;
  governorate?: { id: number; name: string } | null;
  educational_stage_id: number | null;
  educational_stage?: { id: number; name: string } | null;
  status: "active" | "suspended" | null;
  status_label?: string;
  courses_count?: number;
  registered_at?: string;
}

export interface UpdateStudentWebsiteProfilePayload {
  first_name?: string;
  father_name?: string;
  family_name?: string;
  additional_name?: string;
  email?: string;
  phone_code?: string;
  phone?: string;
  guardian_phone_code?: string;
  guardian_phone?: string;
  gender?: "male" | "female";
  country_id?: number | string;
  governorate_id?: number | string;
  educational_stage_id?: number | string;
  avatar?: File | null;
  remove_avatar?: boolean;
}

export const studentProfileService = {
  /**
   * Get authenticated student profile
   * GET /api/website/profile
   */
  async getProfile(): Promise<BackendWebsiteStudentProfile> {
    const res = await api<{ student: BackendWebsiteStudentProfile } | BackendWebsiteStudentProfile>(
      {
        url: "/api/website/profile",
        method: "GET",
      },
    );

    if ("student" in res) return res.student;
    return res as BackendWebsiteStudentProfile;
  },

  /**
   * Get student profile options (genders, countries, governorates, educational_stages)
   * GET /api/website/profile/options
   */
  async getOptions(countryId?: number | string): Promise<BackendStudentOptions> {
    const res = await api<BackendStudentOptions | { options: BackendStudentOptions }>({
      url: "/api/website/profile/options",
      method: "GET",
      params: countryId ? { country_id: countryId } : undefined,
    });

    if ("options" in res) return res.options;
    return res as BackendStudentOptions;
  },

  /**
   * Update student profile
   * PUT /api/website/profile
   */
  async updateProfile(
    data: UpdateStudentWebsiteProfilePayload | FormData,
  ): Promise<BackendWebsiteStudentProfile> {
    let payload: UpdateStudentWebsiteProfilePayload | FormData = data;

    if (!(data instanceof FormData)) {
      const hasFile = data.avatar instanceof File;
      const hasRemoveAvatar = Boolean(data.remove_avatar);

      if (hasFile || hasRemoveAvatar) {
        const formData = new FormData();
        formData.append("_method", "PUT");

        Object.entries(data).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === "avatar" && value instanceof File) {
            formData.append("avatar", value);
          } else if (key === "remove_avatar" && value) {
            formData.append("remove_avatar", "1");
          } else {
            formData.append(key, String(value));
          }
        });

        payload = formData;
      }
    }

    const res = await api<{ student: BackendWebsiteStudentProfile } | BackendWebsiteStudentProfile>(
      {
        url: "/api/website/profile",
        method: payload instanceof FormData ? "POST" : "PUT",
        data: payload,
        headers:
          payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
      },
    );

    if ("student" in res) return res.student;
    return res as BackendWebsiteStudentProfile;
  },

  /**
   * Update student password
   * PATCH /api/website/profile/password
   */
  async updatePassword(data: UpdateProviderPasswordPayload): Promise<BackendWebsiteStudentProfile> {
    const res = await api<{ student: BackendWebsiteStudentProfile } | BackendWebsiteStudentProfile>(
      {
        url: "/api/website/profile/password",
        method: "PATCH",
        data,
      },
    );

    if ("student" in res) return res.student;
    return res as BackendWebsiteStudentProfile;
  },
};
