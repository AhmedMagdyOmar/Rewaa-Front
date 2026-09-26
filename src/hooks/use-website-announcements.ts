import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { websiteService } from "@/lib/api/website-service";
import type { BackendAnnouncement } from "@/types/api-contracts";

/**
 * Fetch published active announcements for the website / student portal
 * GET /api/website/announcements
 */
export function useWebsiteAnnouncements() {
  return useQuery<BackendAnnouncement[]>({
    queryKey: queryKeys.website.announcements(),
    queryFn: () => websiteService.getAnnouncements(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
