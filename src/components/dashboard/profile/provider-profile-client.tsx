"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  KeyRound,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sliders,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProviderProfileQuery } from "@/hooks/use-profile";
import { ProfileGeneralTab } from "./profile-general-tab";
import { ProfileSecurityTab } from "./profile-security-tab";
import { ProfilePreferencesTab } from "./profile-preferences-tab";
import { ProfilePermissionsTab } from "./profile-permissions-tab";

export function ProviderProfileClient() {
  const t = useTranslations("providerProfile");
  const locale = useLocale();
  const isAr = locale === "ar";

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProviderProfileQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-sm font-medium">{t("loadingProfile")}</span>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4 text-center">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Shield className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t("errorLoadingTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : t("errorLoadingSubtitle")}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          <span>{t("retry")}</span>
        </Button>
      </div>
    );
  }

  const userType = profile.user_type || "provider";
  const getUserTypeBadge = () => {
    switch (userType.toLowerCase()) {
      case "center":
      case "provider":
        return isAr ? "مالك المنصة / المركز" : "Platform Owner / Center";
      case "teacher":
        return isAr ? "معلم" : "Teacher";
      case "assistant":
        return isAr ? "مساعد" : "Assistant";
      default:
        return userType;
    }
  };

  const effectiveAvatar = profile.flag || profile.avatar_url;
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="space-y-6">
      {/* Header & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          <span>{t("refreshData")}</span>
        </Button>
      </div>

      {/* Hero Summary Card */}
      <Card className="bg-linear-to-r from-primary/5 via-card to-card border shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-start">
            {/* Avatar Display */}
            <div className="relative size-20 md:size-24 rounded-full overflow-hidden border-2 border-primary/20 bg-background shadow-xs shrink-0 flex items-center justify-center">
              {effectiveAvatar ? (
                <Image
                  src={effectiveAvatar}
                  alt={profile.full_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xl md:text-2xl font-bold text-primary">{initials}</span>
              )}
            </div>

            {/* Profile Core Details */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-xl font-bold text-foreground truncate">{profile.full_name}</h2>
                <Badge variant="default" className="text-xs font-medium">
                  {getUserTypeBadge()}
                </Badge>
                {profile.is_active && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs"
                  >
                    {isAr ? "نشط" : "Active"}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span className="truncate">{profile.email}</span>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Phone className="size-3.5" />
                    <span>
                      {profile.phone_code ? `${profile.phone_code} ` : ""}
                      {profile.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="general" className="gap-2 cursor-pointer">
            <UserIcon className="size-4 shrink-0" />
            <span className="truncate">{t("tabs.general")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 cursor-pointer">
            <ShieldCheck className="size-4 shrink-0" />
            <span className="truncate">{t("tabs.security")}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 cursor-pointer">
            <Sliders className="size-4 shrink-0" />
            <span className="truncate">{t("tabs.preferences")}</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2 cursor-pointer">
            <KeyRound className="size-4 shrink-0" />
            <span className="truncate">{t("tabs.permissions")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general">
          <ProfileGeneralTab profile={profile} />
        </TabsContent>

        {/* Tab 2: Security & Password */}
        <TabsContent value="security">
          <ProfileSecurityTab />
        </TabsContent>

        {/* Tab 3: Preferences */}
        <TabsContent value="preferences">
          <ProfilePreferencesTab profile={profile} />
        </TabsContent>

        {/* Tab 4: Roles & Permissions */}
        <TabsContent value="permissions">
          <ProfilePermissionsTab profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
