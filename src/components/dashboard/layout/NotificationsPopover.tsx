"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useDeleteNotificationMutation,
  useMarkNotificationReadMutation,
  useProviderNotifications,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { BackendProviderNotification } from "@/types/api-contracts";

export function NotificationsPopover() {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [open, setOpen] = useState(false);

  const { data: response, isLoading } = useProviderNotifications();
  const markReadMutation = useMarkNotificationReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const notifications = response?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = (n: BackendProviderNotification) => {
    if (!n.is_read) {
      markReadMutation.mutate(n.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const getTitle = (n: BackendProviderNotification) => {
    if (!n.data?.title) return t("title");
    if (typeof n.data.title === "object") {
      return n.data.title[locale as "ar" | "en"] || Object.values(n.data.title)[0] || t("title");
    }
    return String(n.data.title);
  };

  const getMessage = (n: BackendProviderNotification) => {
    if (!n.data?.message) return "";
    if (typeof n.data.message === "object") {
      return n.data.message[locale as "ar" | "en"] || Object.values(n.data.message)[0] || "";
    }
    return String(n.data.message);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full transition-transform active:scale-95"
          aria-label={t("openAriaLabel")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 ltr:right-2 rtl:left-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-lg" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">{t("title")}</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {t("newBadge", { count: unreadCount })}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-75" dir={dir}>
          <div className="grid gap-1 p-1">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const title = getTitle(notification);
                const message = getMessage(notification);
                const isUnread = !notification.is_read;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification)}
                    className={cn(
                      "group flex flex-col items-start gap-1 rounded-md p-3 text-start text-sm transition-all hover:bg-accent cursor-pointer relative",
                      isUnread && "bg-accent/40",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={cn(
                          "font-medium transition-colors line-clamp-1",
                          isUnread ? "text-foreground font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {title}
                      </span>
                      <div className="flex items-center gap-1">
                        {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {message && (
                      <p
                        className={cn(
                          "text-xs line-clamp-2 transition-colors",
                          isUnread ? "text-foreground/80" : "text-muted-foreground/70",
                        )}
                      >
                        {message}
                      </p>
                    )}

                    {notification.created_at && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{t("empty")}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs font-medium h-8"
            onClick={() => {
              notifications.filter((n) => !n.is_read).forEach((n) => markReadMutation.mutate(n.id));
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-3.5 me-1.5" />
            {t("markAllRead")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
