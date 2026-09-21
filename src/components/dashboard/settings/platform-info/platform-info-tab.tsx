"use client";

import { useLocale } from "next-intl";
import { adaptBackendPlatformSettingsToUI } from "@/lib/adapters/settings-adapter";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/use-settings";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommunicationGroup } from "./communication-group";
import { WhoWeAreGroup } from "./who-we-are-group";
import { TermsGroup } from "./terms-group";

export function PlatformInfoTab() {
  const locale = useLocale();
  const { data: backendSettings, isLoading } = usePlatformSettings();
  const updateSettingsMutation = useUpdatePlatformSettings();

  const platformInfo = adaptBackendPlatformSettingsToUI(backendSettings, locale);

  const handleSaveCommunication = async (data: typeof platformInfo.communication) => {
    try {
      await updateSettingsMutation.mutateAsync({
        support_phone: data.supportPhone,
        whatsapp_phone: data.whatsappPhone,
        facebook_url: data.facebookUrl,
        instagram_url: data.instagramUrl,
        tiktok_url: data.tiktokUrl,
        additional_links: data.customLinks.map((l) => ({
          id: l.id,
          title: { [locale]: l.label, ar: l.label, en: l.label },
          url: l.url,
        })),
      });
      toast.success(
        locale === "ar" ? "تم حفظ معلومات التواصل بنجاح" : "Communication settings saved",
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update platform info";
      toast.error(errorMsg);
    }
  };

  const handleSaveWhoWeAre = async (content: string) => {
    try {
      await updateSettingsMutation.mutateAsync({
        about: { [locale]: content, ar: content, en: content },
      });
      toast.success(locale === "ar" ? "تم حفظ من نحن بنجاح" : "About information saved");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update about info";
      toast.error(errorMsg);
    }
  };

  const handleSaveTerms = async (content: string) => {
    try {
      await updateSettingsMutation.mutateAsync({
        terms: { [locale]: content, ar: content, en: content },
      });
      toast.success(
        locale === "ar" ? "تم حفظ الشروط والأحكام بنجاح" : "Terms and conditions saved",
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update terms";
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-xs">
          {locale === "ar" ? "جارٍ تحميل إعدادات المنصة..." : "Loading platform settings..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Phone numbers and Communication channels */}
      <CommunicationGroup
        data={platformInfo.communication}
        onSaveCustom={handleSaveCommunication}
      />

      {/* 2. Who we are */}
      <WhoWeAreGroup data={platformInfo.whoWeAre} onSaveCustom={handleSaveWhoWeAre} />

      {/* 3. Terms and conditions */}
      <TermsGroup data={platformInfo.terms} onSaveCustom={handleSaveTerms} />
    </div>
  );
}
