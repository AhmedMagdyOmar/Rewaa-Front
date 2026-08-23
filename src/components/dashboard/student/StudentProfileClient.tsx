/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ArrowLeft, Check, MapPin, RotateCcw, ShieldCheck, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

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
import { getStoredStudents, updateStoredStudent } from "@/lib/students-storage";
import { Gender, RegistrationType, Student } from "@/types/student";

interface StudentProfileFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  additionalName: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  gender: Gender;
  email: string;
  image: string;
  password?: string;
  confirmPassword?: string;
  country: string;
  state: string;
  grade: string;
  registrationType: RegistrationType;
}

export function StudentProfileClient() {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.profilePage");
  const tForm = useTranslations("studentsPage.form");

  const [student, setStudent] = React.useState<Student | null>(null);
  const [formData, setFormData] = React.useState<StudentProfileFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    additionalName: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    gender: "male",
    email: "",
    image: "",
    password: "",
    confirmPassword: "",
    country: locale === "ar" ? "مصر" : "Egypt",
    state: locale === "ar" ? "القاهرة" : "Cairo",
    grade: "grade3",
    registrationType: "center",
  });

  const [customRegTypes, setCustomRegTypes] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load active student data (default to first student std-1)
  const loadStudentData = React.useCallback(() => {
    const students = getStoredStudents(locale);
    const active = students[0] || null;
    if (active) {
      setStudent(active);
      setFormData({
        firstName: active.firstName || "",
        middleName: active.middleName || "",
        lastName: active.lastName || "",
        additionalName: active.additionalName || "",
        phoneNumber: active.phoneNumber || "",
        parentPhoneNumber: active.parentPhoneNumber || "",
        gender: active.gender || "male",
        email: active.email || "",
        image: active.image || "",
        password: "",
        confirmPassword: "",
        country: active.country || (locale === "ar" ? "مصر" : "Egypt"),
        state: active.state || (locale === "ar" ? "القاهرة" : "Cairo"),
        grade: active.grade || "grade3",
        registrationType: active.registrationType || "center",
      });
    }
  }, [locale]);

  React.useEffect(() => {
    loadStudentData();
    setCustomRegTypes(getStoredCustomRegistrationTypes());

    const handleUpdate = () => loadStudentData();
    const handleCats = () => setCustomRegTypes(getStoredCustomRegistrationTypes());

    window.addEventListener("rewaa_students_updated", handleUpdate);
    window.addEventListener("rewaa_custom_categories_updated", handleCats);
    window.addEventListener("rewaa_registration_types_updated", handleCats);

    return () => {
      window.removeEventListener("rewaa_students_updated", handleUpdate);
      window.removeEventListener("rewaa_custom_categories_updated", handleCats);
      window.removeEventListener("rewaa_registration_types_updated", handleCats);
    };
  }, [loadStudentData]);

  const handleChange = (field: keyof StudentProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleReset = () => {
    loadStudentData();
    setErrorMsg(null);
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
      setErrorMsg(t("requiredFieldsError"));
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMsg(t("passwordMismatch"));
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!student) return;

    setIsSubmitting(true);

    const updatePayload: Partial<Student> = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),
      additionalName: formData.additionalName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      parentPhoneNumber: formData.parentPhoneNumber.trim(),
      gender: formData.gender,
      email: formData.email.trim(),
      image: formData.image,
      country: formData.country.trim(),
      state: formData.state.trim(),
      grade: formData.grade,
      registrationType: formData.registrationType,
    };

    if (formData.password?.trim()) {
      updatePayload.password = formData.password.trim();
    }

    const updated = updateStoredStudent(locale, student.id, updatePayload);
    if (updated) {
      setStudent(updated);
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      toast.success(t("successToast"));
    }

    setIsSubmitting(false);
  };

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
              onChange={(dataUrl) => handleChange("image", dataUrl)}
              onClear={() => handleChange("image", "")}
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

              {/* Middle Name */}
              <div className="space-y-2">
                <Label htmlFor="middleName">{t("middleNameLabel")}</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleChange("middleName", e.target.value)}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
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
              <Label htmlFor="country">{t("countryLabel")}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                required
              />
            </div>

            {/* State / Governorate */}
            <div className="space-y-2">
              <Label htmlFor="state">{t("stateLabel")}</Label>
              <Input
                id="state"
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
              label={t("gradeLabel")}
            />

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

        {/* Section 3: Account Security and Password Change */}
        <FormSectionCard
          title={t("accountSecurity")}
          description={t("accountSecuritySubtitle")}
          icon={ShieldCheck}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Check className="size-4" />
            <span>{t("saveChanges")}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
