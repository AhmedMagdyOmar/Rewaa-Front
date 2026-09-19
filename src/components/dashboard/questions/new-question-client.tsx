"use client";

import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QuestionFormContent } from "@/components/dashboard/questions/question-form-content";
import { Button } from "@/components/ui/button";
import { useCreateQuestion } from "@/hooks/use-questions";
import { getErrorMessage } from "@/lib/api-utils";
import { Question } from "@/types/exam";
import type { StoreQuestionData } from "@/types/api-contracts";
import { mapFrontendKindToBackend } from "@/lib/adapters/exam-adapters";

export function NewQuestionClient() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("questionsPage.newPage");
  const createQuestionMutation = useCreateQuestion();

  const handleSave = async (
    newQuestion: Question,
    _sectionId?: string,
    keepOpen?: boolean,
    academicContext?: {
      grade?: string;
      subject?: string;
      teacherName?: string;
      educationalStageId?: number;
      subjectId?: number;
      instructorId?: number;
    },
  ) => {
    try {
      const payload: StoreQuestionData = {
        title: { ar: newQuestion.questionName, en: newQuestion.questionName },
        body: { ar: newQuestion.questionContent, en: newQuestion.questionContent },
        type:
          newQuestion.type === "mcq"
            ? "multiple_choice"
            : newQuestion.type === "true/false"
              ? "true_false"
              : "essay",
        difficulty: newQuestion.difficulty || "medium",
        classification: mapFrontendKindToBackend(newQuestion.questionType),
        score: Number(newQuestion.grade) || 1,
        has_explanation: newQuestion.hasAnswerExplanation,
        is_active: true,
        educational_stage_id: academicContext?.educationalStageId,
        subject_id: academicContext?.subjectId,
        instructor_id: academicContext?.instructorId,
      };

      if (newQuestion.hasAnswerExplanation && newQuestion.answerExplanation) {
        payload.explanation = {
          ar: newQuestion.answerExplanation,
          en: newQuestion.answerExplanation,
        };
      }

      if (newQuestion.type === "text" && newQuestion.modelAnswer) {
        payload.model_answer = {
          ar: newQuestion.modelAnswer,
          en: newQuestion.modelAnswer,
        };
      } else if (newQuestion.type === "true/false") {
        payload.correct_answer = newQuestion.modelAnswer === "true";
      } else if (newQuestion.type === "mcq" && newQuestion.options) {
        payload.options = newQuestion.options.map((opt) => ({
          text: { ar: opt.text, en: opt.text },
          is_correct: opt.id === newQuestion.modelAnswer,
        }));
      }

      await createQuestionMutation.mutateAsync(payload);
      toast.success(t("messages.createdSuccessfully") || "تم إنشاء السؤال بنجاح");

      if (!keepOpen) {
        router.push(`/${locale}/dashboard/questions`);
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err) ||
          (locale === "ar" ? "فشل في إنشاء السؤال" : "Failed to create question"),
      );
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/questions`);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Row with Standard Round Back Button */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/questions`}>
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

      {/* Question Form Content with editable grade, subject, and teacherName */}
      <QuestionFormContent
        examGrade=""
        examSubject=""
        examTeacherName=""
        allowEditableAcademicProps={true}
        onSave={handleSave}
        onCancel={handleCancel}
        submitLabel={t("saveQuestion")}
        cancelLabel={t("cancel")}
        showSaveAndAddAnother={true}
      />
    </div>
  );
}
