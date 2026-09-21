import { api } from "@/lib/apiClient";
import type {
  BackendProviderProfile,
  UpdateProviderPasswordPayload,
  UpdateProviderProfilePayload,
} from "@/types/api-contracts";

export const profileService = {
  /**
   * Get authenticated provider profile details
   */
  async getProfile(): Promise<BackendProviderProfile> {
    const res = await api<{ user: BackendProviderProfile } | BackendProviderProfile>({
      url: "/api/dashboard/provider/profile",
      method: "GET",
    });

    if ("user" in res) return res.user;
    return res as BackendProviderProfile;
  },

  /**
   * Update provider personal information
   */
  async updateProfile(
    data: UpdateProviderProfilePayload | FormData,
  ): Promise<BackendProviderProfile> {
    let payload: UpdateProviderProfilePayload | FormData = data;

    if (!(data instanceof FormData)) {
      const hasFile = data.flag instanceof File;
      const hasRemoveFlag = Boolean(data.remove_flag);

      if (hasFile || hasRemoveFlag) {
        const formData = new FormData();
        formData.append("_method", "PUT");

        if (data.full_name) formData.append("full_name", data.full_name);
        if (data.email) formData.append("email", data.email);
        if (data.phone_code) formData.append("phone_code", data.phone_code);
        if (data.phone) formData.append("phone", data.phone);

        if (hasFile && data.flag instanceof File) {
          formData.append("flag", data.flag);
        } else if (hasRemoveFlag) {
          formData.append("remove_flag", "1");
        }

        payload = formData;
      }
    }

    const res = await api<{ user: BackendProviderProfile } | BackendProviderProfile>({
      url: "/api/dashboard/provider/profile",
      method: payload instanceof FormData ? "POST" : "PUT",
      data: payload,
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });

    if ("user" in res) return res.user;
    return res as BackendProviderProfile;
  },

  /**
   * Update provider password
   */
  async updatePassword(data: UpdateProviderPasswordPayload): Promise<BackendProviderProfile> {
    const res = await api<{ user: BackendProviderProfile } | BackendProviderProfile>({
      url: "/api/dashboard/provider/profile/password",
      method: "PATCH",
      data,
    });

    if ("user" in res) return res.user;
    return res as BackendProviderProfile;
  },

  /**
   * Change dashboard locale preference
   */
  async changeLocale(locale: string): Promise<BackendProviderProfile> {
    const res = await api<{ user: BackendProviderProfile } | BackendProviderProfile>({
      url: "/api/dashboard/provider/profile/locale",
      method: "PATCH",
      data: { locale },
    });

    if ("user" in res) return res.user;
    return res as BackendProviderProfile;
  },

  /**
   * Update notifications preference
   */
  async updateNotificationPreference(allow_notification: boolean): Promise<BackendProviderProfile> {
    const res = await api<{ user: BackendProviderProfile } | BackendProviderProfile>({
      url: "/api/dashboard/provider/profile/notification",
      method: "PATCH",
      data: { allow_notification },
    });

    if ("user" in res) return res.user;
    return res as BackendProviderProfile;
  },

  /**
   * Update dark mode preference
   */
  async updateDarkModePreference(allow_dark_mode: boolean): Promise<BackendProviderProfile> {
    const res = await api<{ user: BackendProviderProfile } | BackendProviderProfile>({
      url: "/api/dashboard/provider/profile/dark-mode",
      method: "PATCH",
      data: { allow_dark_mode },
    });

    if ("user" in res) return res.user;
    return res as BackendProviderProfile;
  },
};
