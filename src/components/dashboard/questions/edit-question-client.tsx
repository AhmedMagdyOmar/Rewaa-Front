"use client";

import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QuestionFormContent } from "@/components/dashboard/questions/question-form-content";
import { Button } from "@/components/ui/button";
import { useProviderQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import { mapBackendKindToFrontend, mapFrontendKindToBackend } from "@/lib/adapters/exam-adapters";
import { getErrorMessage } from "@/lib/api-utils";
import type { UpdateQuestionData } from "@/types/api-contracts";
import { Question } from "@/types/exam";

interface EditQuestionClientProps {
  questionId: string;
}

export function EditQuestionClient({ questionId }: EditQuestionClientProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("questionsPage.editPage");
  const tDetails = useTranslations("questionsPage.details");

  const { data: question, isLoading } = useProviderQuestion(questionId);
  const updateQuestionMutation = useUpdateQuestion();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading question details...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">{tDetails("notFoundTitle")}</h2>
        <p className="text-sm text-muted-foreground">{tDetails("notFoundDesc")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/questions`}>
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {tDetails("backToQuestions")}
          </Link>
        </Button>
      </div>
    );
  }

  // Convert BackendQuestion to frontend Question model for QuestionFormContent
  const mappedInitialQuestion: Question = {
    id: String(question.id),
    questionName: question.title[locale] || question.title.ar || "",
    questionContent: question.body?.[locale] || question.body?.ar || "",
    modelAnswer:
      question.type === "essay"
        ? question.model_answer?.[locale] || question.model_answer?.ar || ""
        : question.type === "true_false"
          ? String(question.correct_answer ?? true)
          : (question.options?.find((o) => o.is_correct)?.id?.toString() ?? "opt-1"),
    type:
      question.type === "multiple_choice"
        ? "mcq"
        : question.type === "true_false"
          ? "true/false"
          : "text",
    options: question.options?.map((o, idx) => ({
      id: o.id ? String(o.id) : `opt-${idx + 1}`,
      text: o.text[locale] || o.text.ar || "",
    })),
    grade: Number(question.score) || 1,
    required: true,
    questionType: mapBackendKindToFrontend(question.classification),
    difficulty: question.difficulty || "medium",
    hasAnswerExplanation: question.has_explanation,
    answerExplanation: question.explanation?.[locale] || question.explanation?.ar || "",
  };

  const handleSave = async (
    updated: Question,
    _sectionId?: string,
    _keepOpen?: boolean,
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
      const payload: UpdateQuestionData = {
        title: { ar: updated.questionName, en: updated.questionName },
        body: { ar: updated.questionContent, en: updated.questionContent },
        type:
          updated.type === "mcq"
            ? "multiple_choice"
            : updated.type === "true/false"
              ? "true_false"
              : "essay",
        difficulty: updated.difficulty || "medium",
        classification: mapFrontendKindToBackend(updated.questionType),
        score: Number(updated.grade) || 1,
        has_explanation: updated.hasAnswerExplanation,
        is_active: true,
      };

      if (updated.hasAnswerExplanation && updated.answerExplanation) {
        payload.explanation = {
          ar: updated.answerExplanation,
          en: updated.answerExplanation,
        };
      }

      if (updated.type === "text" && updated.modelAnswer) {
        payload.model_answer = {
          ar: updated.modelAnswer,
          en: updated.modelAnswer,
        };
      } else if (updated.type === "true/false") {
        payload.correct_answer = updated.modelAnswer === "true";
      } else if (updated.type === "mcq" && updated.options) {
        payload.options = updated.options.map((opt) => ({
          text: { ar: opt.text, en: opt.text },
          is_correct: opt.id === updated.modelAnswer,
        }));
      }

      if (academicContext?.educationalStageId) {
        payload.educational_stage_id = academicContext.educationalStageId;
      }
      if (academicContext?.subjectId) {
        payload.subject_id = academicContext.subjectId;
      }
      if (academicContext?.instructorId) {
        payload.instructor_id = academicContext.instructorId;
      }

      await updateQuestionMutation.mutateAsync({ id: question.id, data: payload });
      toast.success(t("messages.savedSuccessfully") || "تم حفظ التعديلات بنجاح");
      router.push(`/${locale}/dashboard/questions`);
    } catch (err) {
      toast.error(getErrorMessage(err) || t("messages.saveFailed"));
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
          <Link href={`/${locale}/dashboard/questions/${questionId}`}>
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

      {/* Main Question Form Card Container */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-6">
        <QuestionFormContent
          initialQuestion={mappedInitialQuestion}
          initialEducationalStageId={question.educational_stage_id}
          initialSubjectId={question.subject_id}
          initialInstructorId={question.instructor_id}
          examGrade={
            question.educational_stage?.name?.[locale] || question.educational_stage?.name?.ar
          }
          examSubject={question.subject?.name?.[locale] || question.subject?.name?.ar}
          examTeacherName={question.instructor?.full_name}
          allowEditableAcademicProps={true}
          onSave={handleSave}
          onCancel={handleCancel}
          submitLabel={t("saveChanges")}
          cancelLabel={t("cancel")}
        />
      </div>
    </div>
  );
}
