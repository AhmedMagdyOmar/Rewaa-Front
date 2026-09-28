/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ArrowLeft, Check, Loader2, MapPin, RotateCcw, ShieldCheck, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStudentProfileOptions,
  useStudentProfileQuery,
  useUpdateStudentPasswordMutation,
  useUpdateStudentProfileMutation,
} from "@/hooks/use-student-profile";
import { getErrorMessage } from "@/lib/api-utils";
import { Gender, RegistrationType } from "@/types/student";

interface StudentProfileFormData {
  firstName: string;
  fatherName: string;
  familyName: string;
  additionalName: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  gender: Gender;
  email: string;
  image: string;
  avatarFile?: File | null;
  removeAvatar?: boolean;
  password?: string;
  confirmPassword?: string;
  countryId: string;
  governorateId: string;
  educationalStageId: string;
  registrationType: RegistrationType;
}

export function StudentProfileClient() {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.profilePage");
  const tForm = useTranslations("studentsPage.form");

  const { data: profileData, isLoading: isProfileLoading, refetch } = useStudentProfileQuery();
  const updateProfileMutation = useUpdateStudentProfileMutation();
  const updatePasswordMutation = useUpdateStudentPasswordMutation();

  const [formData, setFormData] = React.useState<
    StudentProfileFormData & { currentPassword?: string }
  >({
    firstName: "",
    fatherName: "",
    familyName: "",
    additionalName: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    gender: "male",
    email: "",
    image: "",
    avatarFile: null,
    removeAvatar: false,
    currentPassword: "",
    password: "",
    confirmPassword: "",
    countryId: "",
    governorateId: "",
    educationalStageId: "",
    registrationType: "center",
  });

  const { data: optionsData } = useStudentProfileOptions(formData.countryId || undefined);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync state when backend profile loads or is refreshed
  React.useEffect(() => {
    if (profileData) {
      setFormData({
        firstName: profileData.first_name || "",
        fatherName: profileData.father_name || "",
        familyName: profileData.family_name || "",
        additionalName: profileData.additional_name || "",
        phoneNumber: profileData.phone || "",
        parentPhoneNumber: profileData.guardian_phone || "",
        gender: (profileData.gender as Gender) || "male",
        email: profileData.email || "",
        image: profileData.avatar_url || "",
        avatarFile: null,
        removeAvatar: false,
        currentPassword: "",
        password: "",
        confirmPassword: "",
        countryId: profileData.country_id ? String(profileData.country_id) : "",
        governorateId: profileData.governorate_id ? String(profileData.governorate_id) : "",
        educationalStageId: profileData.educational_stage_id
          ? String(profileData.educational_stage_id)
          : "",
        registrationType: (profileData.registration_type as RegistrationType) || "center",
      });
    }
  }, [profileData]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleReset = () => {
    refetch();
    setErrorMsg(null);
  };

  const validate = (): boolean => {
    if (
      !formData.firstName.trim() ||
      !formData.familyName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.parentPhoneNumber.trim() ||
      !formData.email.trim()
    ) {
      setErrorMsg(t("requiredFieldsError"));
      return false;
    }

    if (formData.password && !formData.currentPassword?.trim()) {
      setErrorMsg("يرجى إدخال كلمة المرور الحالية لتغيير كلمة المرور");
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMsg(t("passwordMismatch"));
      return false;
    }

    return true;
  };

  const isSubmitting = updateProfileMutation.isPending || updatePasswordMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // 1. Update Profile Information
      await updateProfileMutation.mutateAsync({
        first_name: formData.firstName.trim(),
        father_name: formData.fatherName.trim(),
        family_name: formData.familyName.trim(),
        additional_name: formData.additionalName.trim(),
        email: formData.email.trim(),
        phone: formData.phoneNumber.trim(),
        guardian_phone: formData.parentPhoneNumber.trim(),
        gender: formData.gender,
        country_id: formData.countryId ? Number(formData.countryId) : undefined,
        governorate_id: formData.governorateId ? Number(formData.governorateId) : undefined,
        educational_stage_id: formData.educationalStageId
          ? Number(formData.educationalStageId)
          : undefined,
        avatar: formData.avatarFile,
        remove_avatar: formData.removeAvatar,
      });

      // 2. Update Password if provided
      if (formData.password?.trim()) {
        await updatePasswordMutation.mutateAsync({
          current_password: formData.currentPassword?.trim() || "",
          password: formData.password.trim(),
          password_confirmation: formData.confirmPassword?.trim() || formData.password.trim(),
        });
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          password: "",
          confirmPassword: "",
        }));
      }

      toast.success(t("successToast"));
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to update profile");
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Row with Standardized Round Back Button */}
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0"
          title={t("backToDashboard")}
        >
          <Link href={`/${locale}/student-dashboard`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Section 1: Personal and Contact Information */}
        <FormSectionCard
          title={t("personalAndContactInfo")}
          description={t("personalAndContactInfoSubtitle")}
          icon={User}
        >
          <div className="space-y-6">
            {/* Profile Image Upload */}
            <ImageUploadField
              id="student-profile-avatar"
              label={t("imageLabel")}
              value={formData.image}
              onChange={(dataUrl, file) => {
                handleChange("image", dataUrl);
                handleChange("avatarFile", file || null);
                handleChange("removeAvatar", false);
              }}
              onClear={() => {
                handleChange("image", "");
                handleChange("avatarFile", null);
                handleChange("removeAvatar", true);
              }}
              variant="avatar"
              prompt={t("imagePrompt")}
              changePrompt={t("imageChange")}
              previewAlt="Student profile avatar"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                />
              </div>

              {/* Father / Middle Name */}
              <div className="space-y-2">
                <Label htmlFor="fatherName">{t("middleNameLabel")}</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => handleChange("fatherName", e.target.value)}
                />
              </div>

              {/* Family / Last Name */}
              <div className="space-y-2">
                <Label htmlFor="familyName">{t("lastNameLabel")}</Label>
                <Input
                  id="familyName"
                  value={formData.familyName}
                  onChange={(e) => handleChange("familyName", e.target.value)}
                  required
                />
              </div>

              {/* Additional Name */}
              <div className="space-y-2">
                <Label htmlFor="additionalName">{t("additionalNameLabel")}</Label>
                <Input
                  id="additionalName"
                  value={formData.additionalName}
                  onChange={(e) => handleChange("additionalName", e.target.value)}
                />
              </div>

              {/* Student Phone Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phoneNumber">{t("phoneNumberLabel")}</Label>
                </div>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              {/* Parent Phone Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="parentPhoneNumber">{t("parentPhoneNumberLabel")}</Label>
                </div>
                <Input
                  id="parentPhoneNumber"
                  value={formData.parentPhoneNumber}
                  onChange={(e) => handleChange("parentPhoneNumber", e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">{t("genderLabel")}</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => handleChange("gender", val as Gender)}
                >
                  <SelectTrigger id="gender" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("genderMale")}</SelectItem>
                    <SelectItem value="female">{t("genderFemale")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </FormSectionCard>

        {/* Section 2: Academic & Location Information */}
        <FormSectionCard
          title={t("academicAndLocation")}
          description={t("academicAndLocationSubtitle")}
          icon={MapPin}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="countryId">{t("countryLabel")}</Label>
              <Select
                value={formData.countryId}
                onValueChange={(val) => {
                  handleChange("countryId", val);
                  handleChange("governorateId", "");
                }}
              >
                <SelectTrigger id="countryId" className="bg-background">
                  <SelectValue placeholder={t("countryLabel")} />
                </SelectTrigger>
                <SelectContent>
                  {optionsData?.countries?.map((c) => {
                    const countryName =
                      typeof c.name === "object"
                        ? c.name[locale as keyof typeof c.name] || Object.values(c.name)[0]
                        : String(c.name);
                    return (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {countryName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* State / Governorate */}
            <div className="space-y-2">
              <Label htmlFor="governorateId">{t("stateLabel")}</Label>
              <Select
                value={formData.governorateId}
                onValueChange={(val) => handleChange("governorateId", val)}
                disabled={!formData.countryId}
              >
                <SelectTrigger id="governorateId" className="bg-background">
                  <SelectValue placeholder={t("stateLabel")} />
                </SelectTrigger>
                <SelectContent>
                  {optionsData?.governorates
                    ?.filter((g) =>
                      formData.countryId
                        ? String(g.country_id) === String(formData.countryId)
                        : true,
                    )
                    .map((g) => {
                      const govName =
                        typeof g.name === "object"
                          ? g.name[locale as keyof typeof g.name] || Object.values(g.name)[0]
                          : String(g.name);
                      return (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {govName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Educational Stage */}
            <div className="space-y-2">
              <Label htmlFor="educationalStageId">{t("gradeLabel")}</Label>
              <Select
                value={formData.educationalStageId}
                onValueChange={(val) => handleChange("educationalStageId", val)}
              >
                <SelectTrigger id="educationalStageId" className="bg-background">
                  <SelectValue placeholder={t("gradeLabel")} />
                </SelectTrigger>
                <SelectContent>
                  {optionsData?.educational_stages?.map((stage) => {
                    const stageName =
                      typeof stage.name === "object"
                        ? stage.name[locale as keyof typeof stage.name] ||
                          Object.values(stage.name)[0]
                        : String(stage.name);
                    return (
                      <SelectItem key={stage.id} value={String(stage.id)}>
                        {stageName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Registration Type */}
            <div className="space-y-2">
              <Label htmlFor="registrationType">{t("registrationTypeLabel")}</Label>
              <Select
                value={formData.registrationType}
                onValueChange={(val) => handleChange("registrationType", val as RegistrationType)}
              >
                <SelectTrigger id="registrationType" className="bg-background">
                  <SelectValue placeholder={tForm("selectRegistrationType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">{tForm("registrationTypes.center")}</SelectItem>
                  <SelectItem value="online">{tForm("registrationTypes.online")}</SelectItem>
                  <SelectItem value="hybrid">{tForm("registrationTypes.hybrid")}</SelectItem>
                  <SelectItem value="external">{tForm("registrationTypes.external")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSectionCard>

        {/* Section 3: Account Security and Password Change */}
        <FormSectionCard
          title={t("accountSecurity")}
          description={t("accountSecuritySubtitle")}
          icon={ShieldCheck}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="كلمة المرور الحالية"
                value={formData.currentPassword || ""}
                onChange={(e) => handleChange("currentPassword", e.target.value)}
                dir="ltr"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={formData.password || ""}
                onChange={(e) => handleChange("password", e.target.value)}
                dir="ltr"
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={formData.confirmPassword || ""}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </FormSectionCard>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" />
            <span>{t("resetChanges")}</span>
          </Button>

          <Button type="submit" disabled={isSubmitting} className="gap-1.5 min-w-32">
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            <span>{t("saveChanges")}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
