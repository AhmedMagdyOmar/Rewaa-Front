/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Eye, EyeOff, MapPin, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { GradeSelect } from "@/components/ui/academic-selects";
import { Button } from "@/components/ui/button";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect, GovernorateSelect, LocationOption } from "@/components/ui/location-selects";
import { PhoneInputWithCode } from "@/components/ui/phone-input-with-code";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gender, Student } from "@/types/student";

export interface StudentFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  additionalName: string;
  phoneNumber: string;
  phoneCode: string;
  parentPhoneNumber: string;
  guardianPhoneCode: string;
  gender: Gender;
  email: string;
  image?: string;
  imageFile?: File | null;
  removeAvatar?: boolean;
  password?: string;
  confirmPassword?: string;
  country: string;
  state: string;
  grade: string;
}

interface StudentFormProps {
  initialData?: Student;
  isEditing?: boolean;
  onSubmit: (data: StudentFormData) => void;
  onSaveDraft?: (data: StudentFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
  educationalStages?: Array<{ id: string | number; name: string }>;
  countries?: LocationOption[];
  governorates?: LocationOption[];
}

export function StudentForm({
  initialData,
  isEditing = false,
  onSubmit,
  onSaveDraft,
  onCancel,
  submitLabel,
  educationalStages,
  countries = [],
  governorates = [],
}: StudentFormProps) {
  const tForm = useTranslations("studentsPage.form");

  const getDefaultCountryId = React.useCallback((countryList: LocationOption[]) => {
    if (!countryList.length) return "";
    const egyptMatch = countryList.find((c) => {
      const lower = c.name.toLowerCase();
      return lower.includes("egypt") || lower.includes("مصر");
    });
    return String(egyptMatch ? egyptMatch.id : countryList[0].id);
  }, []);

  const [formData, setFormData] = React.useState<StudentFormData>(() => {
    // Initial country resolution
    let initialCountry = "";
    if (initialData?.countryId) {
      initialCountry = String(initialData.countryId);
    } else if (initialData?.country) {
      const match = countries.find(
        (c) => c.name === initialData.country || String(c.id) === String(initialData.country),
      );
      initialCountry = match ? String(match.id) : initialData.country;
    } else if (countries.length > 0) {
      const egyptMatch = countries.find((c) => {
        const lower = c.name.toLowerCase();
        return lower.includes("egypt") || lower.includes("مصر");
      });
      initialCountry = String(egyptMatch ? egyptMatch.id : countries[0].id);
    }

    // Initial state resolution
    let initialState = "";
    if (initialData?.governorateId) {
      initialState = String(initialData.governorateId);
    } else if (initialData?.state) {
      const match = governorates.find(
        (g) => g.name === initialData.state || String(g.id) === String(initialData.state),
      );
      initialState = match ? String(match.id) : initialData.state;
    }

    const matchedInitialCountry = countries.find((c) => String(c.id) === String(initialCountry));
    const initialPhoneCode = initialData?.phoneCode || matchedInitialCountry?.country_code || "+20";
    const initialGuardianPhoneCode =
      initialData?.guardianPhoneCode || matchedInitialCountry?.country_code || "+20";

    return {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      additionalName: initialData?.additionalName || "",
      phoneNumber: initialData?.phoneNumber || "",
      phoneCode: initialPhoneCode,
      parentPhoneNumber: initialData?.parentPhoneNumber || "",
      guardianPhoneCode: initialGuardianPhoneCode,
      gender: initialData?.gender || "male",
      email: initialData?.email || "",
      image: initialData?.image || "",
      password: initialData?.password || "",
      confirmPassword: initialData?.password || "",
      country: initialCountry,
      state: initialState,
      grade: initialData?.educationalStageId
        ? String(initialData.educationalStageId)
        : initialData?.grade || "",
    };
  });

  React.useEffect(() => {
    if (initialData) {
      let initialCountry = "";
      if (initialData.countryId) {
        initialCountry = String(initialData.countryId);
      } else if (initialData.country) {
        const match = countries.find(
          (c) => c.name === initialData.country || String(c.id) === String(initialData.country),
        );
        initialCountry = match ? String(match.id) : initialData.country;
      }

      let initialState = "";
      if (initialData.governorateId) {
        initialState = String(initialData.governorateId);
      } else if (initialData.state) {
        const match = governorates.find(
          (g) => g.name === initialData.state || String(g.id) === String(initialData.state),
        );
        initialState = match ? String(match.id) : initialData.state;
      }

      const matchedCountry = countries.find((c) => String(c.id) === String(initialCountry));
      const fallbackCode = matchedCountry?.country_code || "+20";

      setFormData((prev) => ({
        ...prev,
        firstName: initialData.firstName || "",
        middleName: initialData.middleName || "",
        lastName: initialData.lastName || "",
        additionalName: initialData.additionalName || "",
        phoneNumber: initialData.phoneNumber || "",
        phoneCode: initialData.phoneCode || prev.phoneCode || fallbackCode,
        parentPhoneNumber: initialData.parentPhoneNumber || "",
        guardianPhoneCode: initialData.guardianPhoneCode || prev.guardianPhoneCode || fallbackCode,
        gender: initialData.gender || "male",
        email: initialData.email || "",
        image: initialData.image || "",
        password: initialData.password || "",
        confirmPassword: initialData.password || "",
        country: initialCountry,
        state: initialState,
        grade: initialData.educationalStageId
          ? String(initialData.educationalStageId)
          : initialData.grade || "",
      }));
    } else if (countries.length > 0) {
      setFormData((prev) => {
        if (!prev.country) {
          const defaultCountryId = getDefaultCountryId(countries);
          const defaultCountry = countries.find((c) => String(c.id) === String(defaultCountryId));
          const defaultCode = defaultCountry?.country_code || "+20";

          return {
            ...prev,
            country: defaultCountryId,
            phoneCode: defaultCode,
            guardianPhoneCode: defaultCode,
          };
        }
        return prev;
      });
    }
  }, [initialData, countries, governorates, getDefaultCountryId]);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleCountryChange = (newCountryId: string) => {
    const selectedCountry = countries.find((c) => String(c.id) === String(newCountryId));
    const nextCode = selectedCountry?.country_code;

    setFormData((prev) => ({
      ...prev,
      country: newCountryId,
      state: "", // Reset state when country changes
      phoneCode: nextCode || prev.phoneCode,
      guardianPhoneCode: nextCode || prev.guardianPhoneCode,
    }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const validate = (): boolean => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phoneCode.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.guardianPhoneCode.trim() ||
      !formData.parentPhoneNumber.trim() ||
      !formData.country.trim() ||
      !formData.state.trim() ||
      !formData.grade.trim()
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
            onChange={(dataUrl, file) => {
              setFormData((prev) => ({
                ...prev,
                image: dataUrl,
                imageFile: file || prev.imageFile,
                removeAvatar: false,
              }));
              if (errorMsg) setErrorMsg(null);
            }}
            onClear={() => {
              setFormData((prev) => ({
                ...prev,
                image: "",
                imageFile: null,
                removeAvatar: true,
              }));
              if (errorMsg) setErrorMsg(null);
            }}
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
              <PhoneInputWithCode
                id="phoneNumber"
                phone={formData.phoneNumber}
                phoneCode={formData.phoneCode}
                onPhoneChange={(val) => handleChange("phoneNumber", val)}
                onPhoneCodeChange={(code) => handleChange("phoneCode", code)}
                countries={countries}
                placeholder={tForm("phoneNumberPlaceholder")}
                required
              />
            </div>

            {/* Parent Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="parentPhoneNumber">{tForm("parentPhoneNumberLabel")}</Label>
              <PhoneInputWithCode
                id="parentPhoneNumber"
                phone={formData.parentPhoneNumber}
                phoneCode={formData.guardianPhoneCode}
                onPhoneChange={(val) => handleChange("parentPhoneNumber", val)}
                onPhoneCodeChange={(code) => handleChange("guardianPhoneCode", code)}
                countries={countries}
                placeholder={tForm("parentPhoneNumberPlaceholder")}
                required
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={tForm("passwordPlaceholder")}
                value={formData.password || ""}
                onChange={(e) => handleChange("password", e.target.value)}
                dir="ltr"
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-hidden transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{tForm("confirmPasswordLabel")}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={tForm("confirmPasswordPlaceholder")}
                value={formData.confirmPassword || ""}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                dir="ltr"
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-hidden transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
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
          <CountrySelect
            id="country"
            label={tForm("countryLabel")}
            placeholder={tForm("selectCountry")}
            searchPlaceholder={tForm("searchCountry")}
            emptyLabel={tForm("noCountryFound")}
            value={formData.country}
            onValueChange={handleCountryChange}
            countries={countries}
            required
          />

          {/* State / Governorate */}
          <GovernorateSelect
            id="state"
            label={tForm("stateLabel")}
            placeholder={formData.country ? tForm("selectState") : tForm("selectCountryFirst")}
            searchPlaceholder={tForm("searchState")}
            emptyLabel={tForm("noStateFound")}
            value={formData.state}
            onValueChange={(val) => handleChange("state", val)}
            governorates={governorates}
            countryId={formData.country}
            disabled={!formData.country}
            required
          />

          {/* Grade Level */}
          <GradeSelect
            id="grade"
            value={formData.grade}
            onValueChange={(val) => handleChange("grade", val)}
            label={tForm("gradeLabel")}
            placeholder={tForm("selectGrade")}
            grades={educationalStages}
          />
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
