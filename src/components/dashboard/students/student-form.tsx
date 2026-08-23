"use client";

import { MapPin, ShieldCheck, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { GradeSelect } from "@/components/ui/academic-selects";
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
import { getStoredCustomRegistrationTypes } from "@/lib/custom-categories-storage";
import { Gender, RegistrationType, Student } from "@/types/student";

export interface StudentFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  additionalName: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  gender: Gender;
  email: string;
  image?: string;
  password?: string;
  confirmPassword?: string;
  country: string;
  state: string;
  grade: string;
  registrationType: RegistrationType;
}

interface StudentFormProps {
  initialData?: Student;
  isEditing?: boolean;
  onSubmit: (data: StudentFormData) => void;
  onSaveDraft?: (data: StudentFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function StudentForm({
  initialData,
  isEditing = false,
  onSubmit,
  onSaveDraft,
  onCancel,
  submitLabel,
}: StudentFormProps) {
  const locale = useLocale();

  const tForm = useTranslations("studentsPage.form");

  const [formData, setFormData] = React.useState<StudentFormData>({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    additionalName: initialData?.additionalName || "",
    phoneNumber: initialData?.phoneNumber || "",
    parentPhoneNumber: initialData?.parentPhoneNumber || "",
    gender: initialData?.gender || "male",
    email: initialData?.email || "",
    image: initialData?.image || "",
    password: initialData?.password || "",
    confirmPassword: initialData?.password || "",
    country: initialData?.country || (locale === "ar" ? "مصر" : "Egypt"),
    state: initialData?.state || (locale === "ar" ? "القاهرة" : "Cairo"),
    grade: initialData?.grade || "grade3",
    registrationType: initialData?.registrationType || "center",
  });

  const [customRegTypes, setCustomRegTypes] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );

  React.useEffect(() => {
    const load = () => {
      setCustomRegTypes(getStoredCustomRegistrationTypes());
    };
    load();
    window.addEventListener("rewaa_custom_categories_updated", load);
    window.addEventListener("rewaa_registration_types_updated", load);
    return () => {
      window.removeEventListener("rewaa_custom_categories_updated", load);
      window.removeEventListener("rewaa_registration_types_updated", load);
    };
  }, []);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const validate = (): boolean => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.parentPhoneNumber.trim() ||
      !formData.email.trim() ||
      !formData.country.trim() ||
      !formData.state.trim() ||
      !formData.grade.trim() ||
      !formData.registrationType
    ) {
      setErrorMsg(tForm("requiredFieldsError"));
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMsg(tForm("passwordMismatch"));
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleDraftClick = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Input Group 1: Basic Information */}
      <FormSectionCard
        title={tForm("basicInfo")}
        description={tForm("basicInfoSubtitle")}
        icon={User}
      >
        <div className="space-y-4">
          <ImageUploadField
            id="student-image"
            label={tForm("imageLabel")}
            value={formData.image}
            onChange={(dataUrl) => handleChange("image", dataUrl)}
            onClear={() => handleChange("image", "")}
            variant="avatar"
            prompt={tForm("imagePrompt")}
            changePrompt={tForm("imageChange")}
            previewAlt="Student profile"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">{tForm("firstNameLabel")}</Label>
              <Input
                id="firstName"
                placeholder={tForm("firstNamePlaceholder")}
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>

            {/* Middle Name */}
            <div className="space-y-2">
              <Label htmlFor="middleName">{tForm("middleNameLabel")}</Label>
              <Input
                id="middleName"
                placeholder={tForm("middleNamePlaceholder")}
                value={formData.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">{tForm("lastNameLabel")}</Label>
              <Input
                id="lastName"
                placeholder={tForm("lastNamePlaceholder")}
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>

            {/* Additional Name */}
            <div className="space-y-2">
              <Label htmlFor="additionalName">{tForm("additionalNameLabel")}</Label>
              <Input
                id="additionalName"
                placeholder={tForm("additionalNamePlaceholder")}
                value={formData.additionalName}
                onChange={(e) => handleChange("additionalName", e.target.value)}
              />
            </div>

            {/* Student Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{tForm("phoneNumberLabel")}</Label>
              <Input
                id="phoneNumber"
                placeholder={tForm("phoneNumberPlaceholder")}
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                required
                dir="ltr"
              />
            </div>

            {/* Parent Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="parentPhoneNumber">{tForm("parentPhoneNumberLabel")}</Label>
              <Input
                id="parentPhoneNumber"
                placeholder={tForm("parentPhoneNumberPlaceholder")}
                value={formData.parentPhoneNumber}
                onChange={(e) => handleChange("parentPhoneNumber", e.target.value)}
                required
                dir="ltr"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">{tForm("genderLabel")}</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => handleChange("gender", val as Gender)}
              >
                <SelectTrigger id="gender" className="bg-background">
                  <SelectValue placeholder={tForm("selectGender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{tForm("genderMale")}</SelectItem>
                  <SelectItem value="female">{tForm("genderFemale")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email">{tForm("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={tForm("emailPlaceholder")}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </FormSectionCard>

      {/* Input Group 2: Account and Security */}
      <FormSectionCard
        title={tForm("accountSecurity")}
        description={tForm("accountSecuritySubtitle")}
        icon={ShieldCheck}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{tForm("passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={tForm("passwordPlaceholder")}
              value={formData.password || ""}
              onChange={(e) => handleChange("password", e.target.value)}
              dir="ltr"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{tForm("confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={tForm("confirmPasswordPlaceholder")}
              value={formData.confirmPassword || ""}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
      </FormSectionCard>

      {/* Input Group 3: Location and Level */}
      <FormSectionCard
        title={tForm("locationLevel")}
        description={tForm("locationLevelSubtitle")}
        icon={MapPin}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">{tForm("countryLabel")}</Label>
            <Input
              id="country"
              placeholder={tForm("countryPlaceholder")}
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              required
            />
          </div>

          {/* State / Governorate */}
          <div className="space-y-2">
            <Label htmlFor="state">{tForm("stateLabel")}</Label>
            <Input
              id="state"
              placeholder={tForm("statePlaceholder")}
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              required
            />
          </div>

          {/* Grade Level */}
          <GradeSelect
            id="grade"
            value={formData.grade}
            onValueChange={(val) => handleChange("grade", val)}
            label={tForm("gradeLabel")}
            placeholder={tForm("selectGrade")}
          />

          {/* Registration Type */}
          <div className="space-y-2">
            <Label htmlFor="registrationType">{tForm("registrationTypeLabel")}</Label>
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
                {customRegTypes
                  .filter(
                    (c) =>
                      !["center", "online", "hybrid", "external"].includes(c.id) &&
                      !["center", "online", "hybrid", "external"].includes(c.name),
                  )
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSectionCard>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        <Button type="button" variant="outline" onClick={onCancel}>
          {tForm("cancel")}
        </Button>

        {onSaveDraft && (
          <Button type="button" variant="secondary" onClick={handleDraftClick}>
            {tForm("saveDraft")}
          </Button>
        )}

        <Button type="submit">
          {submitLabel || (isEditing ? tForm("saveChanges") : tForm("createStudent"))}
        </Button>
      </div>
    </form>
  );
}
