/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useExamSectionMutations, useProviderExam, useProviderExams } from "@/hooks/use-exams";
import { useCreateQuestion, useDeleteQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import {
  mapBackendExamToFrontend,
  mapBackendQuestionToFrontend,
  mapBackendSectionToFrontend,
  mapFrontendKindToBackend,
} from "@/lib/adapters/exam-adapters";
import { getErrorMessage } from "@/lib/api-utils";
import { queryKeys } from "@/lib/api/queryKeys";
import { StoreQuestionData } from "@/types/api-contracts";
import { Exam, ExamSection, Question } from "@/types/exam";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExamDialogType, ParentExamContext } from "../types";

interface UseExamSectionsManagementProps {
  examId: string | number;
  locale: string;
  parentExamContext: ParentExamContext;
}

export function useExamSectionsManagement({
  examId,
  locale,
  parentExamContext,
}: UseExamSectionsManagementProps) {
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [activeDialog, setActiveDialog] = useState<ExamDialogType>(null);
  const [newSecTitle, setNewSecTitle] = useState("");
  const [editingSection, setEditingSection] = useState<ExamSection | null>(null);
  const [editSecTitle, setEditSecTitle] = useState("");
  const [sectionToDelete, setSectionToDelete] = useState<ExamSection | null>(null);

  const [editingQuestion, setEditingQuestion] = useState<{
    question: Question;
    sectionId: string;
  } | null>(null);
  const [targetQuestionSectionId, setTargetQuestionSectionId] = useState<string>("");
  const [isQuestionSectionLocked, setIsQuestionSectionLocked] = useState<boolean>(false);

  // TanStack Query & Mutations
  const queryClient = useQueryClient();
  const { data: fetchedBackendExam, isLoading: isExamLoading } = useProviderExam(examId);
  const { data: allExamsData } = useProviderExams({ per_page: 50 });

  const sectionMutations = useExamSectionMutations(examId);
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  // All available exams for importing
  const allExams: Exam[] = (allExamsData?.exams || []).map((be) =>
    mapBackendExamToFrontend(be, locale),
  );

  // Sync sections from fetched backend exam
  useEffect(() => {
    if (fetchedBackendExam) {
      const mapped = mapBackendExamToFrontend(fetchedBackendExam, locale);
      if (Array.isArray(mapped.examSections)) {
        setSections(mapped.examSections);
      }
    }
  }, [fetchedBackendExam, locale]);

  // Section Handlers
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setNewSecTitle("");
    setActiveDialog("section");
  };

  const handleOpenEditSection = (sec: ExamSection) => {
    setEditingSection(sec);
    setEditSecTitle(sec.title);
    setActiveDialog("section");
  };

  const handleSaveSection = async () => {
    const titleToSave = editingSection ? editSecTitle.trim() : newSecTitle.trim();
    if (!titleToSave) return;

    try {
      if (editingSection) {
        const updated = await sectionMutations.updateSection.mutateAsync({
          sectionId: editingSection.id,
          data: {
            title: { ar: titleToSave, en: titleToSave },
            is_active: true,
          },
        });
        const mapped = mapBackendSectionToFrontend(updated, locale);
        setSections((prev) =>
          prev.map((s) => (s.id === editingSection.id ? { ...mapped, questions: s.questions } : s)),
        );
        toast.success(locale === "ar" ? "تم تعديل القسم بنجاح" : "Section updated successfully");
      } else {
        const created = await sectionMutations.createSection.mutateAsync({
          title: { ar: titleToSave, en: titleToSave },
          is_active: true,
        });
        const mapped = mapBackendSectionToFrontend(created, locale);
        setSections((prev) => [...prev, mapped]);
        toast.success(locale === "ar" ? "تم إنشاء القسم بنجاح" : "Section created successfully");
      }
      setEditingSection(null);
      setNewSecTitle("");
      setEditSecTitle("");
      setActiveDialog(null);
    } catch (err) {
      toast.error(
        getErrorMessage(err, locale === "ar" ? "فشل حفظ القسم" : "Failed to save section"),
      );
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      await sectionMutations.deleteSection.mutateAsync(sectionToDelete.id);
      setSections((prev) => prev.filter((s) => s.id !== sectionToDelete.id));
      setSectionToDelete(null);
      setActiveDialog(null);
      toast.success(locale === "ar" ? "تم حذف القسم بنجاح" : "Section deleted successfully");
    } catch (err) {
      toast.error(
        getErrorMessage(err, locale === "ar" ? "فشل حذف القسم" : "Failed to delete section"),
      );
    }
  };

  const handleReorderSections = async (reorderedSections: ExamSection[]) => {
    setSections(reorderedSections);
    const numericIds = reorderedSections
      .map((s) => Number(s.id))
      .filter((id) => !Number.isNaN(id) && id > 0);

    if (numericIds.length > 0) {
      try {
        await sectionMutations.reorderSections.mutateAsync(numericIds);
        toast.success(
          locale === "ar" ? "تم ترتيب الأقسام بنجاح" : "Sections reordered successfully",
        );
      } catch (err) {
        toast.error(
          getErrorMessage(
            err,
            locale === "ar" ? "فشل إعادة ترتيب الأقسام" : "Failed to reorder sections",
          ),
        );
      }
    }
  };

  // Question Handlers
  const handleOpenAddQuestion = (secId?: string) => {
    setEditingQuestion(null);
    setTargetQuestionSectionId(secId || sections[0]?.id || "");
    setIsQuestionSectionLocked(Boolean(secId));
    setActiveDialog("question");
  };

  const handleOpenEditQuestion = (q: Question, secId: string) => {
    setEditingQuestion({ question: q, sectionId: secId });
    setTargetQuestionSectionId(secId);
    setIsQuestionSectionLocked(true);
    setActiveDialog("question");
  };

  const handleSaveQuestion = async (
    savedQuestion: Question,
    targetSecId: string,
    keepOpen = false,
  ) => {
    try {
      const sectionIdNum = Number(targetSecId);
      const instId = Number(parentExamContext.teacherName) || undefined;

      const payload: StoreQuestionData = {
        title: { ar: savedQuestion.questionName, en: savedQuestion.questionName },
        body: { ar: savedQuestion.questionContent, en: savedQuestion.questionContent },
        type:
          savedQuestion.type === "mcq"
            ? "multiple_choice"
            : savedQuestion.type === "true/false"
              ? "true_false"
              : "essay",
        difficulty: savedQuestion.difficulty || "medium",
        classification: mapFrontendKindToBackend(savedQuestion.questionType),
        score: Number(savedQuestion.grade) || 1,
        has_explanation: savedQuestion.hasAnswerExplanation,
        is_active: true,
        question_template_id: savedQuestion.questionTemplateId ?? undefined,
        exam_id: Number(examId),
        exam_section_id: !Number.isNaN(sectionIdNum) && sectionIdNum > 0 ? sectionIdNum : undefined,
        educational_stage_id: Number(parentExamContext.grade) || undefined,
        subject_id: Number(parentExamContext.subject) || undefined,
        ...(instId ? { instructor_id: instId } : {}),
      };

      if (savedQuestion.hasAnswerExplanation && savedQuestion.answerExplanation) {
        payload.explanation = {
          ar: savedQuestion.answerExplanation,
          en: savedQuestion.answerExplanation,
        };
      }

      if (savedQuestion.type === "text" && savedQuestion.modelAnswer) {
        payload.model_answer = {
          ar: savedQuestion.modelAnswer,
          en: savedQuestion.modelAnswer,
        };
      } else if (savedQuestion.type === "true/false") {
        payload.correct_answer = savedQuestion.modelAnswer === "true";
      } else if (savedQuestion.type === "mcq" && savedQuestion.options) {
        payload.options = savedQuestion.options.map((opt) => ({
          text: { ar: opt.text, en: opt.text },
          is_correct: opt.id === savedQuestion.modelAnswer,
        }));
      }

      let syncedQuestion = savedQuestion;
      if (!savedQuestion.id.startsWith("q-")) {
        const updated = await updateQuestionMutation.mutateAsync({
          id: savedQuestion.id,
          data: payload,
        });
        syncedQuestion = mapBackendQuestionToFrontend(updated, locale);
        toast.success(locale === "ar" ? "تم تحديث السؤال بنجاح" : "Question updated successfully");
      } else {
        const created = await createQuestionMutation.mutateAsync(payload);
        syncedQuestion = mapBackendQuestionToFrontend(created, locale);
        toast.success(locale === "ar" ? "تم إضافة السؤال بنجاح" : "Question added successfully");
      }

      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id === targetSecId) {
            const existingIdx = sec.questions.findIndex((q) => q.id === savedQuestion.id);
            if (existingIdx >= 0) {
              const updated = [...sec.questions];
              updated[existingIdx] = syncedQuestion;
              return { ...sec, questions: updated };
            }
            return { ...sec, questions: [...sec.questions, syncedQuestion] };
          }
          return {
            ...sec,
            questions: sec.questions.filter((q) => q.id !== savedQuestion.id),
          };
        }),
      );

      if (!keepOpen) {
        setActiveDialog(null);
        setEditingQuestion(null);
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err, locale === "ar" ? "فشل حفظ السؤال" : "Failed to save question"),
      );
    }
  };

  const handleSaveManyQuestions = async (questions: Question[], targetSecId: string) => {
    try {
      const sectionIdNum = Number(targetSecId);
      const validSectionId = !Number.isNaN(sectionIdNum) && sectionIdNum > 0 ? sectionIdNum : null;

      for (const q of questions) {
        if (!q.id.startsWith("q-")) {
          // Existing bank question: build complete payload required by backend PUT validation
          const payload: StoreQuestionData = {
            title: { ar: q.questionName, en: q.questionName },
            body: { ar: q.questionContent, en: q.questionContent },
            type:
              q.type === "mcq"
                ? "multiple_choice"
                : q.type === "true/false"
                  ? "true_false"
                  : "essay",
            difficulty: q.difficulty || "medium",
            classification: mapFrontendKindToBackend(q.questionType),
            score: Number(q.grade) || 1,
            has_explanation: Boolean(q.hasAnswerExplanation),
            is_active: true,
            exam_assignments: [
              {
                exam_id: Number(examId),
                exam_section_id: validSectionId,
              },
            ],
          };

          if (q.hasAnswerExplanation && q.answerExplanation) {
            payload.explanation = {
              ar: q.answerExplanation,
              en: q.answerExplanation,
            };
          }

          if (q.type === "text" && q.modelAnswer) {
            payload.model_answer = {
              ar: q.modelAnswer,
              en: q.modelAnswer,
            };
          } else if (q.type === "true/false") {
            payload.correct_answer = q.modelAnswer === "true";
          } else if (q.type === "mcq" && q.options) {
            payload.options = q.options.map((opt) => ({
              text: { ar: opt.text, en: opt.text },
              is_correct: opt.id === q.modelAnswer,
            }));
          }

          await updateQuestionMutation.mutateAsync({
            id: q.id,
            data: payload,
          });
        } else {
          // New question created in dialog
          await handleSaveQuestion(q, targetSecId, true);
        }
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.detail(examId) });
      setActiveDialog(null);
      setEditingQuestion(null);
      toast.success(locale === "ar" ? "تم إضافة الأسئلة بنجاح" : "Questions added successfully");
    } catch (err) {
      toast.error(
        getErrorMessage(err, locale === "ar" ? "فشل إضافة الأسئلة" : "Failed to add questions"),
      );
    }
  };

  const handleDeleteQuestion = async (secId: string, qId: string) => {
    if (!qId.startsWith("q-")) {
      try {
        await deleteQuestionMutation.mutateAsync(qId);
        toast.success(locale === "ar" ? "تم إزالة السؤال بنجاح" : "Question removed successfully");
      } catch (err) {
        toast.error(
          getErrorMessage(err, locale === "ar" ? "فشل إزالة السؤال" : "Failed to remove question"),
        );
        return;
      }
    }

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === secId) {
          return {
            ...sec,
            questions: sec.questions.filter((q) => q.id !== qId),
          };
        }
        return sec;
      }),
    );
  };

  const handleImportSections = async (importedSections: ExamSection[]) => {
    try {
      for (const impSec of importedSections) {
        const createdSec = await sectionMutations.createSection.mutateAsync({
          title: { ar: impSec.title, en: impSec.title },
          is_active: true,
        });

        for (const q of impSec.questions) {
          await handleSaveQuestion(q, String(createdSec.id), true);
        }
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.exams.detail(examId) });
      setActiveDialog(null);
      toast.success(
        locale === "ar" ? "تم استيراد الأسئلة بنجاح" : "Questions imported successfully",
      );
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          locale === "ar" ? "فشل استيراد الأسئلة" : "Failed to import questions",
        ),
      );
    }
  };

  const isSubmitting =
    sectionMutations.createSection.isPending ||
    sectionMutations.updateSection.isPending ||
    sectionMutations.deleteSection.isPending ||
    createQuestionMutation.isPending ||
    updateQuestionMutation.isPending ||
    deleteQuestionMutation.isPending;

  return {
    sections,
    allExams,
    activeDialog,
    setActiveDialog,
    newSecTitle,
    setNewSecTitle,
    editingSection,
    setEditingSection,
    editSecTitle,
    setEditSecTitle,
    sectionToDelete,
    setSectionToDelete,
    editingQuestion,
    setEditingQuestion,
    targetQuestionSectionId,
    setTargetQuestionSectionId,
    isQuestionSectionLocked,
    setIsQuestionSectionLocked,
    handleOpenAddSection,
    handleOpenEditSection,
    handleSaveSection,
    handleDeleteSection,
    handleReorderSections,
    handleOpenAddQuestion,
    handleOpenEditQuestion,
    handleSaveQuestion,
    handleSaveManyQuestions,
    handleDeleteQuestion,
    handleImportSections,
    isSubmitting,
    isExamLoading,
  };
}
