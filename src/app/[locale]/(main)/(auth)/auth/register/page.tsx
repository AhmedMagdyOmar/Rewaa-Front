/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneCountryOption, PhoneInputWithCode } from "@/components/ui/phone-input-with-code";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api-utils";
import { StudentRegisterPayload, authService } from "@/lib/api/auth-service";
import { queryKeys } from "@/lib/api/queryKeys";

interface FormState {
  first_name: string;
  father_name: string;
  family_name: string;
  additional_name: string;
  phone_code: string;
  phone: string;
  guardian_phone_code: string;
  guardian_phone: string;
  email: string;
  gender: "male" | "female";
  country_id: string;
  governorate_id: string;
  educational_stage_id: string;
  password: string;
  password_confirmation: string;
}

export default function StudentRegisterPage() {
  const t = useTranslations("auth.register");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormState>({
    first_name: "",
    father_name: "",
    family_name: "",
    additional_name: "",
    phone_code: "+20",
    phone: "",
    guardian_phone_code: "+20",
    guardian_phone: "",
    email: "",
    gender: "male",
    country_id: "",
    governorate_id: "",
    educational_stage_id: "",
    password: "",
    password_confirmation: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerSchema = useMemo(
    () =>
      z
        .object({
          first_name: z.string().min(2, tVal("minTwoChars")).max(100),
          father_name: z.string().max(100).optional(),
          family_name: z.string().min(2, tVal("minTwoChars")).max(100),
          additional_name: z.string().max(100).optional(),
          phone_code: z.string().default("+20"),
          phone: z
            .string()
            .min(1, tVal("phoneRequired"))
            .regex(/^[0-9+\s-]{8,15}$/, tVal("invalidPhone")),
          guardian_phone_code: z.string().default("+20"),
          guardian_phone: z
            .string()
            .min(1, tVal("phoneRequired"))
            .regex(/^[0-9+\s-]{8,15}$/, tVal("invalidPhone")),
          email: z
            .string()
            .trim()
            .refine((val) => val === "" || z.string().email().safeParse(val).success, {
              message: tVal("invalidEmail"),
            })
            .optional(),
          gender: z.enum(["male", "female"]),
          country_id: z.string().min(1, tVal("required")),
          governorate_id: z.string().min(1, tVal("required")),
          educational_stage_id: z.string().min(1, tVal("required")),
          password: z.string().min(8, tVal("passwordMin8")),
          password_confirmation: z.string().min(8, tVal("passwordMin8")),
        })
        .refine((data) => data.password === data.password_confirmation, {
          message: tVal("passwordsDoNotMatch"),
          path: ["password_confirmation"],
        }),
    [tVal],
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch registration lookup options
  const selectedCountryId = formData.country_id ? Number(formData.country_id) : undefined;
  const { data: optionsData, isLoading: isLoadingOptionsQuery } = useQuery({
    queryKey: queryKeys.website.authOptions(selectedCountryId),
    queryFn: () =>
      authService.getRegisterOptions({
        country_id: selectedCountryId,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const isLoadingOptions = isMounted ? isLoadingOptionsQuery : false;

  // Auto-select Egypt or first country if none selected
  useEffect(() => {
    if (optionsData?.countries?.length && !formData.country_id) {
      const egypt = optionsData.countries.find((c) => {
        const code = c.country_code ? c.country_code.replace(/^\+/, "") : "";
        const arName = c.name?.ar || "";
        const enName = c.name?.en || "";
        return code === "20" || arName.includes("مصر") || enName.toLowerCase().includes("egypt");
      });
      const selected = egypt || optionsData.countries[0];
      setFormData((prev) => ({
        ...prev,
        country_id: String(selected.id),
      }));
    }
  }, [optionsData?.countries, formData.country_id]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "country_id" && value !== prev.country_id) {
        updated.governorate_id = "";
      }
      return updated;
    });

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const validationResult = registerSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = String(issue.path[0]);
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    const payload: StudentRegisterPayload = {
      first_name: formData.first_name.trim(),
      father_name: formData.father_name.trim() || undefined,
      family_name: formData.family_name.trim(),
      additional_name: formData.additional_name.trim() || undefined,
      phone_code: formData.phone_code,
      phone: formData.phone.trim(),
      guardian_phone_code: formData.guardian_phone_code,
      guardian_phone: formData.guardian_phone.trim(),
      email: formData.email.trim() || undefined,
      gender: formData.gender,
      country_id: Number(formData.country_id),
      governorate_id: Number(formData.governorate_id),
      educational_stage_id: Number(formData.educational_stage_id),
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    };

    setIsSubmitting(true);
    try {
      await authService.studentRegister(payload);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.student.profile(),
      });

      toast.success(t("registerSuccess"));
      router.push("/student-dashboard");
      router.refresh();
    } catch (err) {
      const axiosErr = err as {
        validationErrors?: Record<string, string[]>;
        response?: { data?: { errors?: Record<string, string[]> } };
      };
      const backendErrors = axiosErr?.validationErrors || axiosErr?.response?.data?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const mappedErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(backendErrors)) {
          if (Array.isArray(msgs) && msgs.length > 0) {
            mappedErrors[key] = msgs[0];
          }
        }
        setFieldErrors(mappedErrors);
      }

      const friendlyMsg = getErrorMessage(err);
      setErrorMessage(friendlyMsg || tCommon("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalizedName = useCallback(
    (names: Record<string, string> | undefined) => {
      if (!names) return "";
      return names[locale] || names["ar"] || names["en"] || Object.values(names)[0] || "";
    },
    [locale],
  );

  const countries = optionsData?.countries;
  const countryOptions: PhoneCountryOption[] = useMemo(() => {
    if (!countries) return [];
    return countries.map((c) => ({
      id: c.id,
      name: getLocalizedName(c.name),
      country_code: c.country_code,
      flag: c.flag,
    }));
  }, [countries, getLocalizedName]);

  return (
    <div className="w-full max-w-2xl py-6 my-auto">
      <Card className="w-full relative shadow-sm border bg-card">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg animate-in fade-in">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-semibold text-foreground">{t("submitText")}...</p>
            </div>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("title")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Section 1: Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    {t("firstNameLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    placeholder={t("firstNamePlaceholder")}
                    className={fieldErrors.first_name ? "border-destructive" : ""}
                  />
                  {fieldErrors.first_name && (
                    <p className="text-xs text-destructive">{fieldErrors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="father_name">{t("fatherNameLabel")}</Label>
                  <Input
                    id="father_name"
                    value={formData.father_name}
                    onChange={(e) => handleChange("father_name", e.target.value)}
                    placeholder={t("fatherNamePlaceholder")}
                  />
                  {fieldErrors.father_name && (
                    <p className="text-xs text-destructive">{fieldErrors.father_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family_name">
                    {t("lastNameLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="family_name"
                    value={formData.family_name}
                    onChange={(e) => handleChange("family_name", e.target.value)}
                    placeholder={t("lastNamePlaceholder")}
                    className={fieldErrors.family_name ? "border-destructive" : ""}
                  />
                  {fieldErrors.family_name && (
                    <p className="text-xs text-destructive">{fieldErrors.family_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_name">{t("additionalNameLabel")}</Label>
                  <Input
                    id="additional_name"
                    value={formData.additional_name}
                    onChange={(e) => handleChange("additional_name", e.target.value)}
                    placeholder={t("additionalNamePlaceholder")}
                  />
                  {fieldErrors.additional_name && (
                    <p className="text-xs text-destructive">{fieldErrors.additional_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Contact Details & Gender */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">{t("emailLabel")}</Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className={`ps-9 ${fieldErrors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {t("phoneLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <PhoneInputWithCode
                    id="phone"
                    phone={formData.phone}
                    phoneCode={formData.phone_code}
                    onPhoneChange={(val) => handleChange("phone", val)}
                    onPhoneCodeChange={(val) => handleChange("phone_code", val)}
                    countries={countryOptions}
                    disabled={isSubmitting}
                    required
                    placeholder={t("phonePlaceholder")}
                    className={fieldErrors.phone ? "[&>input]:border-destructive" : ""}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">
                    {t("guardianPhoneLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <PhoneInputWithCode
                    id="guardian_phone"
                    phone={formData.guardian_phone}
                    phoneCode={formData.guardian_phone_code}
                    onPhoneChange={(val) => handleChange("guardian_phone", val)}
                    onPhoneCodeChange={(val) => handleChange("guardian_phone_code", val)}
                    countries={countryOptions}
                    disabled={isSubmitting}
                    required
                    placeholder={t("guardianPhonePlaceholder")}
                    className={fieldErrors.guardian_phone ? "[&>input]:border-destructive" : ""}
                  />
                  {fieldErrors.guardian_phone && (
                    <p className="text-xs text-destructive">{fieldErrors.guardian_phone}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("genderLabel")}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={formData.gender === "male" ? "default" : "outline"}
                      className={`w-full justify-center h-10 ${
                        formData.gender === "male" ? "shadow-sm font-semibold" : ""
                      }`}
                      onClick={() => handleChange("gender", "male")}
                    >
                      {t("male")}
                    </Button>
                    <Button
                      type="button"
                      variant={formData.gender === "female" ? "default" : "outline"}
                      className={`w-full justify-center h-10 ${
                        formData.gender === "female" ? "shadow-sm font-semibold" : ""
                      }`}
                      onClick={() => handleChange("gender", "female")}
                    >
                      {t("female")}
                    </Button>
                  </div>
                  {fieldErrors.gender && (
                    <p className="text-xs text-destructive">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Academic Stage & Location */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country_id">
                    {t("countryLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.country_id}
                    onValueChange={(val) => handleChange("country_id", val)}
                    disabled={isLoadingOptions}
                  >
                    <SelectTrigger
                      id="country_id"
                      className={fieldErrors.country_id ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder={t("selectCountry")} />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsData?.countries?.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)}>
                          {getLocalizedName(country.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.country_id && (
                    <p className="text-xs text-destructive">{fieldErrors.country_id}</p>
                  )}
                </div>

                {/* Governorate */}
                <div className="space-y-2">
                  <Label htmlFor="governorate_id">
                    {t("governorateLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.governorate_id}
                    onValueChange={(val) => handleChange("governorate_id", val)}
                    disabled={isLoadingOptions || !formData.country_id}
                  >
                    <SelectTrigger
                      id="governorate_id"
                      className={fieldErrors.governorate_id ? "border-destructive" : ""}
                    >
                      <SelectValue
                        placeholder={
                          formData.country_id ? t("selectGovernorate") : t("selectCountryFirst")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsData?.governorates?.map((gov) => (
                        <SelectItem key={gov.id} value={String(gov.id)}>
                          {getLocalizedName(gov.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.governorate_id && (
                    <p className="text-xs text-destructive">{fieldErrors.governorate_id}</p>
                  )}
                </div>

                {/* Educational Stage */}
                <div className="space-y-2">
                  <Label htmlFor="educational_stage_id">
                    {t("stageLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.educational_stage_id}
                    onValueChange={(val) => handleChange("educational_stage_id", val)}
                    disabled={isLoadingOptions}
                  >
                    <SelectTrigger
                      id="educational_stage_id"
                      className={fieldErrors.educational_stage_id ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder={t("selectStage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsData?.educational_stages?.map((stage) => (
                        <SelectItem key={stage.id} value={String(stage.id)}>
                          {getLocalizedName(stage.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.educational_stage_id && (
                    <p className="text-xs text-destructive">{fieldErrors.educational_stage_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Password & Security */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t("passwordLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className={`pe-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">
                    {t("confirmPasswordLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.password_confirmation}
                      onChange={(e) => handleChange("password_confirmation", e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className={`pe-10 ${
                        fieldErrors.password_confirmation ? "border-destructive" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password_confirmation && (
                    <p className="text-xs text-destructive">{fieldErrors.password_confirmation}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms notice */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t("termsNotice")}{" "}
              <Link href="/terms" className="text-primary underline hover:text-primary/80">
                {t("termsOfService")}
              </Link>{" "}
              &{" "}
              <Link href="/privacy-policy" className="text-primary underline hover:text-primary/80">
                {t("privacyPolicy")}
              </Link>
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold gap-2 shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t("submitText")}...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{t("submitText")}</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t bg-muted/20 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              {t("signIn")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
