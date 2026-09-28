import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/lib/api/notifications-service";
import { queryKeys } from "@/lib/api/queryKeys";
import type { NotificationFilterParams } from "@/types/api-contracts";

export function useProviderNotifications(params?: NotificationFilterParams) {
  return useQuery({
    queryKey: queryKeys.provider.notifications.list(params as Record<string, unknown>),
    queryFn: () => notificationsService.getNotifications(params),
    staleTime: 30 * 1000, // 30s
    refetchInterval: 60 * 1000, // poll every 60s
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.notifications.all() });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.notifications.all() });
    },
  });
}
