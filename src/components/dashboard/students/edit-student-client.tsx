"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudentForm, StudentFormData } from "@/components/dashboard/students/student-form";
import { adaptBackendStudentToUI } from "@/lib/adapters/student-adapter";
import { useStudentDetail, useStudentOptions, useUpdateStudent } from "@/hooks/use-students";
import { Student } from "@/types/student";
import { toast } from "sonner";

interface EditStudentClientProps {
  studentId: string;
}

export function EditStudentClient({ studentId }: EditStudentClientProps) {
  const locale = useLocale();
  const router = useRouter();

  const tForm = useTranslations("studentsPage.form");
  const tDetails = useTranslations("studentsPage.details");

  const { data: backendStudent, isLoading } = useStudentDetail(studentId);
  const { data: optionsData } = useStudentOptions();
  const updateStudentMutation = useUpdateStudent();

  const student: Student | null = React.useMemo(() => {
    if (!backendStudent) return null;
    return adaptBackendStudentToUI(backendStudent, locale);
  }, [backendStudent, locale]);

  const educationalStagesList = React.useMemo(() => {
    if (!optionsData?.educational_stages) return undefined;
    return optionsData.educational_stages.map(
      (s: { id: number; name: Record<string, string> }) => ({
        id: String(s.id),
        name: s.name[locale] || s.name.ar || s.name.en || "",
      }),
    );
  }, [optionsData, locale]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        {tDetails("personalInfoSubtitle")}...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Users className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{tDetails("notFoundTitle")}</h2>
        <p className="text-sm text-muted-foreground">{tDetails("notFoundDesc")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/students`}>
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {tDetails("backToStudents")}
          </Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = (data: StudentFormData) => {
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

    const payloadData: Record<string, unknown> = {
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
      country_id: country?.id,
      governorate_id: governorate?.id,
      educational_stage_id: stageId,
      registration_type: data.registrationType,
    };

    if (data.password) {
      payloadData.password = data.password;
      payloadData.password_confirmation = data.confirmPassword || data.password;
    }

    if (data.imageFile) {
      payloadData.avatar = data.imageFile;
    } else if (data.removeAvatar) {
      payloadData.remove_avatar = true;
    }

    updateStudentMutation.mutate(
      {
        studentId,
        data: payloadData,
      },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar" ? "تم تعديل بيانات الطالب بنجاح" : "Student updated successfully",
          );
          router.push(`/${locale}/dashboard/students/${studentId}`);
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
              ? "حدث خطأ أثناء حفظ التعديلات"
              : "An error occurred while updating student");
          toast.error(message);
        },
      },
    );
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/students/${studentId}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Row with Standardized Round Back Button */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/students/${studentId}`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tForm("editTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tForm("editSubtitle")}</p>
        </div>
      </div>

      {/* Main Student Form */}
      <StudentForm
        initialData={student}
        isEditing={true}
        educationalStages={educationalStagesList}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
