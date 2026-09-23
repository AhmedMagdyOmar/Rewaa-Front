"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { dashboardService, BackendDashboardStatistics } from "@/lib/api/dashboard-service";

/**
 * Fetch provider dashboard summary statistics
 */
export function useDashboardStatistics() {
  return useQuery<BackendDashboardStatistics>({
    queryKey: queryKeys.provider.dashboard.statistics(),
    queryFn: () => dashboardService.getStatistics(),
    staleTime: 60 * 1000, // 1 minute
  });
}
