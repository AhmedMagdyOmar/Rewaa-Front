"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  CheckCircle2,
  Filter,
  Fingerprint,
  Key,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { Input } from "@/components/ui/input";
import type { BackendProviderProfile } from "@/types/api-contracts";

interface ProfilePermissionsTabProps {
  profile: BackendProviderProfile;
}

export function ProfilePermissionsTab({ profile }: ProfilePermissionsTabProps) {
  const t = useTranslations("providerProfile.permissionsTab");
  const locale = useLocale();

  const isAr = locale === "ar";
  const userType = profile.user_type || "provider";
  const permissions = React.useMemo(() => profile.permissions || [], [profile.permissions]);
  const roles = React.useMemo(() => profile.roles || [], [profile.roles]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const getUserTypeBadge = () => {
    switch (userType.toLowerCase()) {
      case "center":
      case "provider":
        return {
          label: isAr ? "مالك المنصة / المركز" : "Platform Owner / Center",
          variant: "default" as const,
        };
      case "teacher":
        return {
          label: isAr ? "معلم" : "Teacher",
          variant: "secondary" as const,
        };
      case "assistant":
        return {
          label: isAr ? "مساعد" : "Assistant",
          variant: "outline" as const,
        };
      default:
        return {
          label: userType,
          variant: "secondary" as const,
        };
    }
  };

  const badgeInfo = getUserTypeBadge();

  // Helper to get translated permission name
  const getPermissionLabel = React.useCallback(
    (perm: string): string => {
      if (t.has(`authoritiesLabels.${perm}`)) {
        return t(`authoritiesLabels.${perm}`);
      }
      return perm;
    },
    [t],
  );

  // Helper to extract category from permission string e.g. "provider_courses:read" -> "provider_courses"
  const getPermissionCategory = React.useCallback((perm: string): string => {
    const prefix = perm.split(":")[0] || "other";
    return prefix;
  }, []);

  // Extract unique categories available from user permissions
  const availableCategories = React.useMemo(() => {
    const cats = new Set<string>();
    permissions.forEach((p) => cats.add(getPermissionCategory(p)));
    return Array.from(cats);
  }, [permissions, getPermissionCategory]);

  // Filter permissions based on search query and selected category
  const filteredPermissions = React.useMemo(() => {
    return permissions.filter((perm) => {
      const category = getPermissionCategory(perm);
      const matchesCategory = selectedCategory === "all" || category === selectedCategory;

      const label = getPermissionLabel(perm).toLowerCase();
      const code = perm.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || label.includes(q) || code.includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [permissions, selectedCategory, searchQuery, getPermissionCategory, getPermissionLabel]);

  return (
    <div className="space-y-6">
      <FormSectionCard title={t("title")} description={t("subtitle")} icon={Shield}>
        <div className="space-y-6 pt-2">
          {/* Account & Role Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Role Card */}
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("accountType")}</span>
                <UserCheck className="size-4" />
              </div>
              <div className="pt-1">
                <Badge variant={badgeInfo.variant} className="text-xs font-medium">
                  {badgeInfo.label}
                </Badge>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("accountStatus")}</span>
                {profile.is_active ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="size-4 text-destructive" />
                )}
              </div>
              <div className="pt-1">
                <Badge
                  variant={profile.is_active ? "outline" : "destructive"}
                  className={
                    profile.is_active
                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      : ""
                  }
                >
                  {profile.is_active ? t("active") : t("inactive")}
                </Badge>
              </div>
            </div>

            {/* Member Since Card */}
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t("memberSince")}</span>
                <Calendar className="size-4" />
              </div>
              <p className="text-sm font-semibold text-foreground pt-1" dir="ltr">
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Assigned Roles */}
          {roles.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Fingerprint className="size-4 text-primary" />
                <span>{t("assignedRoles")}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <Badge key={r.id} variant="secondary" className="px-3 py-1">
                    {r.display_name || r.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Granted Authorities & Permissions */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Key className="size-4 text-primary" />
                <span>{t("grantedAuthorities")}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {permissions.length}
                </Badge>
              </h3>

              {/* Search Bar */}
              {permissions.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute inset-s-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="h-8 ps-8 text-xs bg-background"
                  />
                </div>
              )}
            </div>

            {/* Category Filter Badges */}
            {availableCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {t("categories.all")} ({permissions.length})
                </button>
                {availableCategories.map((cat) => {
                  const catCount = permissions.filter(
                    (p) => getPermissionCategory(p) === cat,
                  ).length;
                  const catLabel = t.has(`categories.${cat}`)
                    ? t(`categories.${cat}`)
                    : cat.replace(/^provider_/, "");

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {catLabel} ({catCount})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Permissions Grid */}
            {permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3">
                {t("noExplicitPermissions")}
              </p>
            ) : filteredPermissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <Filter className="size-6 mx-auto mb-2 opacity-50" />
                <p>{isAr ? "لا توجد نتائج مطابقة لبحثك" : "No matching permissions found"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredPermissions.map((perm, idx) => {
                  const translatedLabel = getPermissionLabel(perm);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col justify-between p-3 rounded-lg bg-muted/40 border hover:border-primary/40 hover:bg-card transition-all gap-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-foreground leading-snug">
                          {translatedLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </FormSectionCard>
    </div>
  );
}
