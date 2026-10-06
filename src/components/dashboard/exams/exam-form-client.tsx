"use client";

import { AlertTriangle, FileQuestion, ListOrdered, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormTimelineSidebar } from "@/components/dashboard/common/form-timeline-sidebar";
import { Exam } from "@/types/exam";
import { ExamFormHeader } from "./exam-form/components/exam-form-header";
import { useExamForm } from "./exam-form/hooks/use-exam-form";
import { ExamStep1Form } from "./exam-form/step1-exam-info/exam-step1-form";
import { QuestionsView } from "./exam-form/step2-questions/questions-view";
import { StepItem } from "./exam-form/types";

interface ExamFormClientProps {
  mode: "create" | "edit";
  examId?: string | number;
  initialData?: Exam | null;
}

export function ExamFormClient({ mode, examId, initialData }: ExamFormClientProps) {
  const locale = useLocale();
  const tForm = useTranslations("exams.form");
  const tStep2 = useTranslations("exams.step2");
  const tCourses = useTranslations("courses");

  const form = useExamForm({
    mode,
    initialExamId: examId,
    initialData,
  });

  const steps: StepItem[] = [
    {
      id: 1,
      label: tCourses("new.steps.infoAndPrice"),
      icon: ListOrdered,
      complete: form.currentStep > 1,
    },
    {
      id: 2,
      label: tStep2("title"),
      icon: FileQuestion,
      complete: false,
    },
  ];

  if (!form.isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {locale === "ar" ? "جاري تحميل بيانات الامتحان..." : "Loading exam data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-28">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <ExamFormHeader currentStep={form.currentStep} title={form.title} mode={mode} />

      {/* ── Main Layout: Timeline Sidebar (4 cols) + Content (8 cols) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 order-2 lg:order-1">
          <FormTimelineSidebar
            timelineTitle={tCourses("new.timelineTitle")}
            steps={steps}
            currentStep={form.currentStep}
            disclaimerTitle={tCourses("new.disclaimerTitle")}
            disclaimerDescription={tCourses("new.disclaimerDescription")}
            onStepClick={
              mode === "edit" || Boolean(form.createdExamId)
                ? (stepId) => form.setCurrentStep(stepId as 1 | 2)
                : undefined
            }
          />
        </div>

        <main className="lg:col-span-8 order-1 lg:order-2 space-y-6">
          {mode === "edit" && form.performedCount > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-900 ">
              <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1 text-sm">
                <h4 className="font-bold text-amber-800">{tForm("performedWarning.title")}</h4>
                <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                  {tForm("performedWarning.description", {
                    count: form.performedCount,
                  })}
                </p>
              </div>
            </div>
          )}

          {form.currentStep === 1 ? (
            <ExamStep1Form form={form} mode={mode} locale={locale} />
          ) : (
            <QuestionsView
              examId={form.createdExamId!}
              locale={locale}
              isEditing={mode === "edit"}
              parentExamContext={{
                examId: form.createdExamId!,
                grade: form.grade,
                subject: form.subject,
                teacherName: form.teacherName,
              }}
              onBackToStep1={() => form.setCurrentStep(1)}
              onFinish={form.handleFinish}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default ExamFormClient;
