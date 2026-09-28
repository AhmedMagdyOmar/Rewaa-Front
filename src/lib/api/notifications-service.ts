import { api } from "@/lib/apiClient";
import type {
  BackendProviderNotification,
  NotificationFilterParams,
  NotificationsListResponse,
} from "@/types/api-contracts";

export const notificationsService = {
  /**
   * Get paginated provider notifications
   * GET /api/dashboard/provider/notifications
   */
  async getNotifications(params?: NotificationFilterParams): Promise<NotificationsListResponse> {
    const res = await api<
      | {
          notifications: BackendProviderNotification[];
          pagination?: NotificationsListResponse["pagination"];
        }
      | {
          data: BackendProviderNotification[];
          current_page?: number;
          last_page?: number;
          per_page?: number;
          total?: number;
        }
      | BackendProviderNotification[]
    >({
      url: "/api/dashboard/provider/notifications",
      method: "GET",
      params,
    });

    if (Array.isArray(res)) {
      return {
        notifications: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("notifications" in res) {
      return {
        notifications: res.notifications,
        pagination: res.pagination,
      };
    }

    return {
      notifications: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 15,
        total: res.total ?? 0,
      },
    };
  },

  /**
   * Mark a single notification as read
   * PATCH /api/dashboard/provider/notifications/{id}/read
   */
  async markAsRead(id: string | number): Promise<BackendProviderNotification> {
    const res = await api<
      { notification: BackendProviderNotification } | BackendProviderNotification
    >({
      url: `/api/dashboard/provider/notifications/${id}/read`,
      method: "PATCH",
    });

    if ("notification" in res) return res.notification;
    return res as BackendProviderNotification;
  },

  /**
   * Delete a notification
   * DELETE /api/dashboard/provider/notifications/{id}
   */
  async deleteNotification(id: string | number): Promise<void> {
    await api({
      url: `/api/dashboard/provider/notifications/${id}`,
      method: "DELETE",
    });
  },
};
