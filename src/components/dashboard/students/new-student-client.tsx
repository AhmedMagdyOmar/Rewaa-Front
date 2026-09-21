"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudentForm, StudentFormData } from "@/components/dashboard/students/student-form";
import { useCreateStudent, useStudentOptions } from "@/hooks/use-students";
import { toast } from "sonner";

export function NewStudentClient() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const tForm = useTranslations("studentsPage.form");

  const redirectPath = courseId
    ? `/${locale}/dashboard/courses/${courseId}/students`
    : `/${locale}/dashboard/students`;

  const { data: optionsData } = useStudentOptions();
  const createStudentMutation = useCreateStudent();

  const educationalStagesList = React.useMemo(() => {
    if (!optionsData?.educational_stages) return undefined;
    return optionsData.educational_stages.map(
      (s: { id: number; name: Record<string, string> }) => ({
        id: String(s.id),
        name: s.name[locale] || s.name.ar || s.name.en || "",
      }),
    );
  }, [optionsData, locale]);

  const handleSubmit = (data: StudentFormData) => {
    // Resolve stage, country, and governorate IDs if possible
    const matchedStage = optionsData?.educational_stages?.find(
      (s: { id: number; name: Record<string, string> }) =>
        String(s.id) === data.grade || (s.name[locale] || s.name.ar || s.name.en) === data.grade,
    );
    const stageId = matchedStage ? matchedStage.id : Number(data.grade) || undefined;
    const country = optionsData?.countries.find(
      (c: { id: number; name: Record<string, string> }) =>
        (c.name[locale] || c.name.ar || c.name.en) === data.country,
    );
    const governorate = optionsData?.governorates.find(
      (g: { id: number; name: Record<string, string> }) =>
        (g.name[locale] || g.name.ar || g.name.en) === data.state,
    );

    const password = data.password || "Password123!";
    const passwordConfirmation = data.confirmPassword || password;

    createStudentMutation.mutate(
      {
        first_name: data.firstName,
        father_name: data.middleName || undefined,
        family_name: data.lastName,
        additional_name: data.additionalName || undefined,
        phone_code: "+20",
        phone: data.phoneNumber,
        guardian_phone_code: "+20",
        guardian_phone: data.parentPhoneNumber,
        gender: data.gender,
        email: data.email,
        password,
        password_confirmation: passwordConfirmation,
        country_id: country?.id,
        governorate_id: governorate?.id,
        educational_stage_id: stageId,
        registration_type: data.registrationType,
        status: "active",
        avatar: data.imageFile || undefined,
      },
      {
        onSuccess: () => {
          toast.success(locale === "ar" ? "تم إنشاء الطالب بنجاح" : "Student created successfully");
          router.push(redirectPath);
        },
        onError: (err: unknown) => {
          const validationErrors =
            (err as { validationErrors?: unknown })?.validationErrors ||
            (err as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors;
          if (validationErrors) {
            const firstError = Object.values(validationErrors).flat()[0] as string;
            if (firstError) {
              toast.error(firstError);
              return;
            }
          }
          const message =
            (err as { apiMessage?: string })?.apiMessage ||
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as { message?: string })?.message ||
            (locale === "ar"
              ? "حدث خطأ أثناء إضافة الطالب"
              : "An error occurred while creating student");
          toast.error(message);
        },
      },
    );
  };

  const handleSaveDraft = (data: StudentFormData) => {
    handleSubmit(data);
  };

  const handleCancel = () => {
    router.push(redirectPath);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Row with Standardized Round Back Button */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={redirectPath}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tForm("createTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tForm("createSubtitle")}</p>
        </div>
      </div>

      {/* Main Student Form */}
      <StudentForm
        educationalStages={educationalStagesList}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={handleCancel}
      />
    </div>
  );
}
