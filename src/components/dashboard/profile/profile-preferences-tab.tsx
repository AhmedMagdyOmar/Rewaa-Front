/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, Globe, Sliders } from "lucide-react";
import { toast } from "sonner";
// import { useTheme } from "next-themes";
import { usePathname, useRouter } from "@/i18n/routing";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  // useUpdateDarkModeMutation,
  useUpdateLocaleMutation,
  useUpdateNotificationMutation,
} from "@/hooks/use-profile";
import type { BackendProviderProfile } from "@/types/api-contracts";

interface ProfilePreferencesTabProps {
  profile: BackendProviderProfile;
}

export function ProfilePreferencesTab({ profile }: ProfilePreferencesTabProps) {
  const t = useTranslations("providerProfile.preferences");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  // const { theme, setTheme } = useTheme();

  const updateLocaleMutation = useUpdateLocaleMutation();
  const updateNotificationMutation = useUpdateNotificationMutation();
  // const updateDarkModeMutation = useUpdateDarkModeMutation();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    profile.allow_notification ?? true,
  );
  // const [darkModeEnabled, setDarkModeEnabled] = React.useState(
  //   profile.allow_dark_mode ?? theme === "dark",
  // );

  React.useEffect(() => {
    if (profile.allow_notification !== undefined) {
      setNotificationsEnabled(Boolean(profile.allow_notification));
    }
    // if (profile.allow_dark_mode !== undefined) {
    //   setDarkModeEnabled(Boolean(profile.allow_dark_mode));
    // }
  }, [profile]);

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return;

    try {
      await updateLocaleMutation.mutateAsync(newLocale);
      toast.success(
        newLocale === "ar"
          ? "تم تحديث لغة الواجهة إلى العربية"
          : "Interface language updated to English",
      );
      router.replace(pathname, { locale: newLocale });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t("errors.localeUpdateFailed");
      toast.error(errorMsg);
    }
  };

  const handleToggleNotifications = async (checked: boolean) => {
    setNotificationsEnabled(checked);
    try {
      await updateNotificationMutation.mutateAsync(checked);
      toast.success(checked ? t("toasts.notificationsEnabled") : t("toasts.notificationsDisabled"));
    } catch (err: unknown) {
      setNotificationsEnabled(!checked);
      const errorMsg = err instanceof Error ? err.message : t("errors.notificationUpdateFailed");
      toast.error(errorMsg);
    }
  };

  // const handleToggleDarkMode = async (checked: boolean) => {
  //   setDarkModeEnabled(checked);
  //   try {
  //     await updateDarkModeMutation.mutateAsync(checked);
  //     if (setTheme) {
  //       setTheme(checked ? "dark" : "light");
  //     }
  //     toast.success(checked ? t("toasts.darkModeEnabled") : t("toasts.darkModeDisabled"));
  //   } catch (err: unknown) {
  //     setDarkModeEnabled(!checked);
  //     const errorMsg = err instanceof Error ? err.message : t("errors.darkModeUpdateFailed");
  //     toast.error(errorMsg);
  //   }
  // };

  return (
    <div className="space-y-6">
      <FormSectionCard title={t("title")} description={t("subtitle")} icon={Sliders}>
        <div className="space-y-6 pt-2">
          {/* Language Selection */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-background border shadow-2xs text-muted-foreground">
                <Globe className="size-4 shrink-0" />
              </div>
              <div className="space-y-0.5">
                <Label
                  htmlFor="language-select"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("language.title")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("language.subtitle")}</p>
              </div>
            </div>

            <div className="max-w-xs pt-1">
              <Select
                value={locale}
                onValueChange={handleLanguageChange}
                disabled={updateLocaleMutation.isPending}
              >
                <SelectTrigger id="language-select" className="w-full bg-background">
                  <SelectValue placeholder={t("language.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  <SelectItem value="en">English (الإنجليزية)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notifications Setting */}
          <FormToggleSetting
            id="notifications-toggle"
            title={t("notifications.title")}
            subtitle={t("notifications.subtitle")}
            icon={Bell}
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={updateNotificationMutation.isPending}
          />

          {/* Dark Mode Setting */}
          {/* <FormToggleSetting
            id="dark-mode-toggle"
            title={t("darkMode.title")}
            subtitle={t("darkMode.subtitle")}
            icon={darkModeEnabled ? Moon : Sun}
            checked={darkModeEnabled}
            onCheckedChange={handleToggleDarkMode}
            disabled={updateDarkModeMutation.isPending}
          /> */}
        </div>
      </FormSectionCard>
    </div>
  );
}
