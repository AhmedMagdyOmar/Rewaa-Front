import { api } from "@/lib/apiClient";
import type { BackendAnnouncement } from "@/types/api-contracts";

export interface WebsiteAnnouncementsResponse {
  announcements: BackendAnnouncement[];
}

export const websiteService = {
  /**
   * Fetch active platform/website announcements
   * GET /api/website/announcements
   */
  async getAnnouncements(): Promise<BackendAnnouncement[]> {
    const res = await api<WebsiteAnnouncementsResponse | BackendAnnouncement[]>({
      url: "/api/website/announcements",
      method: "GET",
    });

    if (Array.isArray(res)) {
      return res;
    }
    if (res && "announcements" in res && Array.isArray(res.announcements)) {
      return res.announcements;
    }
    return [];
  },
};
