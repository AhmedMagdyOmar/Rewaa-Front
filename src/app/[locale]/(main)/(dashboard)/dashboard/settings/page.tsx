"use client";

import { useTranslations } from "next-intl";
import { Settings, Info, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeachersSection } from "@/components/dashboard/settings/teachers-section";
import { AssistantsSection } from "@/components/dashboard/settings/assistants-section";
import { GradesSection } from "@/components/dashboard/settings/grades-section";
import { SubjectsSection } from "@/components/dashboard/settings/subjects-section";
import { AnnouncementsSection } from "@/components/dashboard/settings/announcements-section";
import { PlatformInfoTab } from "@/components/dashboard/settings/platform-info/platform-info-tab";
import { useProviderRole } from "@/hooks/use-provider-role";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { isAdmin } = useProviderRole();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* 3 Tabs Selector */}
      <Tabs defaultValue="platform-settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="platform-settings" className="gap-2">
            <Settings className="size-4 shrink-0" />
            <span>{t("tabs.platformSettings")}</span>
          </TabsTrigger>
          <TabsTrigger value="platform-info" className="gap-2">
            <Info className="size-4 shrink-0" />
            <span>{t("tabs.platformInfo")}</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="size-4 shrink-0" />
            <span>{t("tabs.announcements")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Platform Settings */}
        <TabsContent value="platform-settings" className="space-y-6">
          {/* Teachers Section — admin only */}
          {isAdmin && <TeachersSection />}

          {/* Grades and Subjects Row — visible to all, read-only for non-admins */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GradesSection isReadOnly={!isAdmin} />
            <SubjectsSection isReadOnly={!isAdmin} />
          </div>

          {/* Assistants Section — admin only */}
          {isAdmin && <AssistantsSection />}
        </TabsContent>

        {/* Tab 2: Platform Information */}
        <TabsContent value="platform-info">
          <PlatformInfoTab />
        </TabsContent>

        {/* Tab 3: Announcements */}
        <TabsContent value="announcements">
          <AnnouncementsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
