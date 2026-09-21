"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdatePasswordMutation } from "@/hooks/use-profile";

export function ProfileSecurityTab() {
  const t = useTranslations("providerProfile.security");
  const locale = useLocale();
  const updatePasswordMutation = useUpdatePasswordMutation();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(t("errors.currentRequired"));
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error(t("errors.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("errors.passwordsMismatch"));
      return;
    }
    if (newPassword === currentPassword) {
      toast.error(t("errors.passwordMustBeDifferent"));
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      toast.success(
        locale === "ar" ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully",
      );

      // Reset fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t("errors.updateFailed");
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSectionCard title={t("title")} description={t("subtitle")} icon={ShieldCheck}>
        <div className="max-w-xl space-y-5 pt-2">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-sm font-medium">
              {t("fields.currentLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("fields.currentPlaceholder")}
                className="ps-9 pe-10"
                required
                disabled={updatePasswordMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-hidden"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-medium">
              {t("fields.newLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("fields.newPlaceholder")}
                className="ps-9 pe-10"
                required
                minLength={8}
                disabled={updatePasswordMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-hidden"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{t("fields.passwordRequirements")}</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-sm font-medium">
              {t("fields.confirmLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("fields.confirmPlaceholder")}
                className="ps-9 pe-10"
                required
                minLength={8}
                disabled={updatePasswordMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-hidden"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
          <Button
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className="gap-2 min-w-[160px]"
          >
            {updatePasswordMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            <span>{updatePasswordMutation.isPending ? t("updating") : t("updatePassword")}</span>
          </Button>
        </div>
      </FormSectionCard>
    </form>
  );
}
