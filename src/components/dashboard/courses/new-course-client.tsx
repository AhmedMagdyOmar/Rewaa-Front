"use client";

import { FormTimelineSidebar } from "@/components/dashboard/common/form-timeline-sidebar";
import "@mdxeditor/editor/style.css";
import { BookOpen, FileText, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CourseFormHeader } from "./course-form/components/course-form-header";
import { useCourseForm } from "./course-form/hooks/use-course-form";
import { CourseStep1Form } from "./course-form/step1-course-info/course-step1-form";
import { CurriculumView } from "./course-form/step2-curriculum/curriculum-view";
import { NewCourseClientProps, StepItem } from "./course-form/types";

export function NewCourseClient({ initialCourseId }: NewCourseClientProps = {}) {
  const t = useTranslations("courses.new");
  const locale = useLocale();

  const form = useCourseForm({ initialCourseId });

  const steps: StepItem[] = [
    {
      id: 1,
      label: t("steps.infoAndPrice"),
      icon: FileText,
      complete: form.isInfoAndPriceComplete,
    },
    {
      id: 2,
      label: t("steps.lectures"),
      icon: BookOpen,
      complete: false,
    },
  ];

  if (!form.isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {locale === "ar" ? "جاري تحميل بيانات الدورة..." : "Loading course data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header section */}
      <CourseFormHeader
        currentStep={form.currentStep}
        title={form.title}
        initialCourseId={initialCourseId}
        coursePublishStatus={form.coursePublishStatus}
        onPublishStatusChange={form.setCoursePublishStatus}
        courseScheduledPublishDate={form.courseScheduledPublishDate}
        onScheduledPublishDateChange={form.setCourseScheduledPublishDate}
      />

      {form.successMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {form.successMessage}
        </div>
      )}

      {/* Main layout: Sidebar (3 cols) + Content (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <FormTimelineSidebar
            timelineTitle={t("timelineTitle")}
            steps={steps}
            currentStep={form.currentStep}
            disclaimerTitle={t("disclaimerTitle")}
            disclaimerDescription={t("disclaimerDescription")}
            onStepClick={
              initialCourseId || form.createdCourseId
                ? (stepId) => form.setCurrentStep(stepId as 1 | 2)
                : undefined
            }
          />
        </div>

        <main className="lg:col-span-9 order-1 lg:order-2">
          {form.currentStep === 1 ? (
            <CourseStep1Form form={form} initialCourseId={initialCourseId} />
          ) : (
            <CurriculumView
              courseId={form.createdCourseId!}
              locale={locale}
              isEditing={Boolean(initialCourseId)}
              onBackToStep1={() => form.setCurrentStep(1)}
              onFinish={form.handleFinish}
            />
          )}
        </main>
      </div>
    </div>
  );
}
export default NewCourseClient;
