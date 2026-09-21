/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail, Phone, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfileMutation } from "@/hooks/use-profile";
import type { BackendProviderProfile } from "@/types/api-contracts";

interface ProfileGeneralTabProps {
  profile: BackendProviderProfile;
}

export function ProfileGeneralTab({ profile }: ProfileGeneralTabProps) {
  const t = useTranslations("providerProfile.general");
  const locale = useLocale();
  const updateProfileMutation = useUpdateProfileMutation();

  const [fullName, setFullName] = React.useState(profile.full_name || "");
  const [email, setEmail] = React.useState(profile.email || "");
  const [phoneCode, setPhoneCode] = React.useState(profile.phone_code || "+20");
  const [phone, setPhone] = React.useState(profile.phone || "");

  // Image upload state
  const isProviderOwner =
    !profile.user_type || profile.user_type === "center" || profile.user_type === "group";
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
    profile.flag || profile.avatar_url || null,
  );
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = React.useState(false);

  // Sync state if profile query updates externally
  React.useEffect(() => {
    setFullName(profile.full_name || "");
    setEmail(profile.email || "");
    setPhoneCode(profile.phone_code || "+20");
    setPhone(profile.phone || "");
    setAvatarPreview(profile.flag || profile.avatar_url || null);
    setAvatarFile(null);
    setRemoveAvatar(false);
  }, [profile]);

  const handleAvatarChange = (dataUrl: string, file?: File) => {
    setAvatarPreview(dataUrl);
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
    }
  };

  const handleClearAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(t("errors.nameRequired"));
      return;
    }
    if (!email.trim()) {
      toast.error(t("errors.emailRequired"));
      return;
    }

    try {
      if (avatarFile || removeAvatar) {
        const formData = new FormData();
        formData.append("full_name", fullName.trim());
        formData.append("email", email.trim());
        if (phoneCode) formData.append("phone_code", phoneCode.trim());
        if (phone) formData.append("phone", phone.trim());

        if (avatarFile) {
          formData.append("flag", avatarFile);
        } else if (removeAvatar) {
          formData.append("remove_flag", "1");
        }

        await updateProfileMutation.mutateAsync(formData);
      } else {
        await updateProfileMutation.mutateAsync({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_code: phoneCode.trim() || null,
          phone: phone.trim() || null,
        });
      }

      toast.success(
        locale === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile details updated successfully",
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t("errors.updateFailed");
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSectionCard title={t("title")} description={t("subtitle")} icon={UserIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Avatar / Organization Logo */}
          <div className="md:col-span-2">
            <ImageUploadField
              label={t("fields.avatarLabel")}
              hint={isProviderOwner ? t("fields.avatarHint") : t("fields.avatarDisabledHint")}
              value={avatarPreview}
              variant="avatar"
              onChange={handleAvatarChange}
              onClear={handleClearAvatar}
              disabled={!isProviderOwner || updateProfileMutation.isPending}
              previewWidthClassName="size-24"
              previewHeightClassName="size-24"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              {t("fields.nameLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <UserIcon className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("fields.namePlaceholder")}
                className="ps-9"
                required
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {t("fields.emailLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("fields.emailPlaceholder")}
                className="ps-9"
                required
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          {/* Phone Code */}
          <div className="space-y-2">
            <Label htmlFor="phone_code" className="text-sm font-medium">
              {t("fields.phoneCodeLabel")}
            </Label>
            <Input
              id="phone_code"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              placeholder="+20"
              dir="ltr"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              {t("fields.phoneLabel")}
            </Label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("fields.phonePlaceholder")}
                className="ps-9"
                dir="ltr"
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="gap-2 min-w-[140px]"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>{updateProfileMutation.isPending ? t("saving") : t("saveChanges")}</span>
          </Button>
        </div>
      </FormSectionCard>
    </form>
  );
}
