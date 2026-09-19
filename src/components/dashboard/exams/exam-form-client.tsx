/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit2,
  Eye,
  FileQuestion,
  FolderPlus,
  GraduationCap,
  HelpCircle,
  Import,
  Info,
  ListOrdered,
  MapPin,
  Plus,
  Settings,
  Shuffle,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { toast } from "sonner";

import { ArrangeSectionsDialog } from "@/components/dashboard/common/arrange-sections-dialog";
import { FormTimelineSidebar } from "@/components/dashboard/common/form-timeline-sidebar";
import { ImportFromExamsDialog } from "@/components/dashboard/exams/import-from-exams-dialog";
import { QuestionDialog } from "@/components/dashboard/exams/question-dialog";
import { GradeSelect, SubjectSelect, TeacherSelect } from "@/components/ui/academic-selects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectWithAdd } from "@/components/ui/select-with-add";
import {
  useCreateExam,
  useExamSectionMutations,
  useProviderExam,
  useProviderExamOptions,
  useProviderExams,
  usePublishExam,
  useUpdateExam,
} from "@/hooks/use-exams";
import { useCreateQuestion, useDeleteQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import {
  mapBackendExamToFrontend,
  mapBackendQuestionToFrontend,
  mapBackendSectionToFrontend,
  mapFrontendCategoryToBackend,
  mapFrontendKindToBackend,
} from "@/lib/adapters/exam-adapters";
import { getErrorMessage } from "@/lib/api-utils";
import {
  getStoredCustomExamCategories,
  saveStoredCustomExamCategory,
} from "@/lib/custom-categories-storage";
import { cn } from "@/lib/utils";
import type { StoreExamData, StoreQuestionData } from "@/types/api-contracts";
import { Exam, ExamCategory, ExamSection, ExamVenue, Question } from "@/types/exam";

interface ExamFormClientProps {
  mode: "create" | "edit";
  examId?: string;
  initialData?: Exam | null;
}

export function ExamFormClient({ mode, examId, initialData }: ExamFormClientProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("exams");
  const tForm = useTranslations("exams.form");
  const tStep2 = useTranslations("exams.step2");
  const tCourses = useTranslations("courses");

  // Step state (1: Settings, 2: Sections & Questions)
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1);

  // Saved Exam ID (either from prop or created in Step 1)
  const [activeExamId, setActiveExamId] = React.useState<string | number | undefined>(
    examId || initialData?.id,
  );

  // API Queries and Mutations
  const { data: fetchedBackendExam } = useProviderExam(activeExamId);
  const [educationalStageId, setEducationalStageId] = React.useState<string>("");
  const { data: optionsData, isLoading: isLoadingOptions } =
    useProviderExamOptions(educationalStageId);

  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const publishExamMutation = usePublishExam();
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  // Section mutations hook (active once an exam ID is established)
  const sectionMutations = useExamSectionMutations(activeExamId || 0);

  // Form State - Step 1
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [triesAllowed, setTriesAllowed] = React.useState<number>(1);
  const [durationMinutes, setDurationMinutes] = React.useState<number>(30);
  const [passingPercentage, setPassingPercentage] = React.useState<number>(60);
  const [numberOfQuestions, setNumberOfQuestions] = React.useState<number>(10);

  // Academic Info
  const [grade, setGrade] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [teacherName, setTeacherName] = React.useState("");
  const [category, setCategory] = React.useState<ExamCategory>("test");
  const [customExamCategories, setCustomExamCategories] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  // Advanced Settings
  const [showModelAnswers, setShowModelAnswers] = React.useState(true);
  const [randomizeQuestionsOrder, setRandomizeQuestionsOrder] = React.useState(true);
  const [randomizeMCQChoices, setRandomizeMCQChoices] = React.useState(false);

  // Classification & Venue / Publish Status
  const [isIndependent, setIsIndependent] = React.useState<boolean>(true);
  const [venue, setVenue] = React.useState<ExamVenue>("online");
  const [coursesCount, setCoursesCount] = React.useState<number>(0);
  const [performedCount, setPerformedCount] = React.useState<number>(0);

  // Form State - Step 2 (Exam Sections & Questions)
  const [examSections, setExamSections] = React.useState<ExamSection[]>([
    {
      id: "sec-1",
      title: locale === "ar" ? "الفصل الأول - الأسئلة الرئيسية" : "Section 1 - Main Questions",
      questions: [],
    },
  ]);

  // Sync state from backend when editing
  React.useEffect(() => {
    if (fetchedBackendExam) {
      const mapped = mapBackendExamToFrontend(fetchedBackendExam, locale);
      setTitle(mapped.title);
      setDescription(mapped.description || "");
      setTriesAllowed(mapped.triesAllowed);
      setDurationMinutes(mapped.durationMinutes);
      setPassingPercentage(mapped.passingPercentage);
      setNumberOfQuestions(mapped.numberOfQuestions);

      const stageIdStr = String(fetchedBackendExam.educational_stage_id);
      setGrade(stageIdStr);
      setEducationalStageId(stageIdStr);
      setSubject(String(fetchedBackendExam.subject_id));
      setTeacherName(String(fetchedBackendExam.instructor_id));
      setCategory(mapped.category);

      setShowModelAnswers(mapped.showModelAnswers);
      setRandomizeQuestionsOrder(mapped.randomizeQuestionsOrder);
      setRandomizeMCQChoices(mapped.randomizeMCQChoices);

      setIsIndependent(mapped.examType === "independent");
      if (mapped.venue) setVenue(mapped.venue);
      setCoursesCount(mapped.coursesCount ?? 0);
      setPerformedCount(mapped.numberOfStudents ?? 0);

      if (mapped.examSections && mapped.examSections.length > 0) {
        setExamSections(mapped.examSections);
      }
    } else if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setTriesAllowed(initialData.triesAllowed);
      setDurationMinutes(initialData.durationMinutes);
      setPassingPercentage(initialData.passingPercentage);
      setNumberOfQuestions(initialData.numberOfQuestions);
      setGrade(initialData.grade);
      setSubject(initialData.subject);
      setTeacherName(initialData.teacherName);
      setCategory(initialData.category);
      setShowModelAnswers(initialData.showModelAnswers);
      setRandomizeQuestionsOrder(initialData.randomizeQuestionsOrder);
      setRandomizeMCQChoices(initialData.randomizeMCQChoices);
      setIsIndependent(initialData.examType === "independent");
      if (initialData.venue) setVenue(initialData.venue);
      setCoursesCount(initialData.coursesCount ?? 0);
      setPerformedCount(initialData.numberOfStudents ?? 0);
      if (initialData.examSections && initialData.examSections.length > 0) {
        setExamSections(initialData.examSections);
      }
    }
  }, [fetchedBackendExam, initialData, locale]);

  // Sync educationalStageId when grade changes
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setEducationalStageId(newGrade);
    setSubject("");
  };

  React.useEffect(() => {
    const loadCategories = () => {
      setCustomExamCategories(getStoredCustomExamCategories());
    };
    loadCategories();
    window.addEventListener("rewaa_custom_categories_updated", loadCategories);
    window.addEventListener("rewaa_exam_categories_updated", loadCategories);
    return () => {
      window.removeEventListener("rewaa_custom_categories_updated", loadCategories);
      window.removeEventListener("rewaa_exam_categories_updated", loadCategories);
    };
  }, []);

  const handleAddExamCategory = (name: string) => {
    saveStoredCustomExamCategory(name);
  };

  const defaultExamCategoryOptions = [
    { value: "final", label: t("category.final") },
    { value: "midterm", label: t("category.midterm") },
    { value: "test", label: t("category.test") },
    { value: "yearWork", label: t("category.yearWork") },
    { value: "comprehensive", label: t("category.comprehensive") },
    { value: "unit", label: t("category.unit") },
    { value: "quiz", label: t("category.quiz") },
    { value: "placement", label: t("category.placement") },
  ];

  const allExamCategoryOptions = [
    ...defaultExamCategoryOptions,
    ...customExamCategories
      .filter(
        (c) => !defaultExamCategoryOptions.some((d) => d.value === c.id || d.label === c.name),
      )
      .map((c) => ({ value: c.id, label: c.name })),
  ];

  // Map backend stages and subjects to Combobox options
  const mappedStages = (optionsData?.educational_stages || []).map((s) => ({
    id: s.id,
    name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
  }));

  const mappedSubjects = (optionsData?.subjects || []).map((s) => ({
    id: s.id,
    name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
  }));

  const mappedInstructors = (optionsData?.instructors || []).map((i) => ({
    id: i.id,
    full_name: i.full_name,
  }));

  // Step 2 Active Dialog State
  const [activeDialog, setActiveDialog] = React.useState<
    "addSection" | "question" | "arrange" | "importExams" | null
  >(null);
  const [editingQuestion, setEditingQuestion] = React.useState<{
    question: Question;
    sectionId: string;
  } | null>(null);
  const [targetQuestionSectionId, setTargetQuestionSectionId] = React.useState<string>("");

  // Available live exams for importing (fetching from backend)
  const { data: allExamsResponse } = useProviderExams({ per_page: 50 });
  const allExams: Exam[] = React.useMemo(() => {
    if (!allExamsResponse?.exams) return [];
    return allExamsResponse.exams
      .filter((e) => String(e.id) !== String(activeExamId))
      .map((e) => mapBackendExamToFrontend(e, locale));
  }, [allExamsResponse, activeExamId, locale]);

  // Section Dialog states (Add, Edit, Delete)
  const [newSecTitle, setNewSecTitle] = React.useState("");
  const [editingSection, setEditingSection] = React.useState<ExamSection | null>(null);
  const [editSecTitle, setEditSecTitle] = React.useState("");
  const [sectionToDelete, setSectionToDelete] = React.useState<ExamSection | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Helper to construct backend payload
  const buildExamPayload = () => {
    const stageId = Number(grade) || optionsData?.educational_stages?.[0]?.id || 1;
    const subjId = Number(subject) || optionsData?.subjects?.[0]?.id || 1;
    const requiresInstructor = optionsData?.requires_instructor_selection ?? true;
    const instId = requiresInstructor
      ? Number(teacherName) || optionsData?.instructors?.[0]?.id
      : undefined;

    const deliveryMode =
      venue === "onsite" ? "in_person" : venue === "hybrid" ? "hybrid" : "online";

    const payload: StoreExamData = {
      title: { ar: title.trim(), en: title.trim() },
      description: description.trim()
        ? { ar: description.trim(), en: description.trim() }
        : undefined,
      educational_stage_id: stageId,
      subject_id: subjId,
      ...(requiresInstructor && instId ? { instructor_id: instId } : {}),
      classification: mapFrontendCategoryToBackend(category),
      duration_minutes: Number(durationMinutes) || 30,
      passing_percentage: Number(passingPercentage) || 60,
      max_attempts: Number(triesAllowed) || 1,
      questions_limit: Number(numberOfQuestions) || 10,
      show_correct_answers_after_submission: Boolean(showModelAnswers),
      shuffle_questions: Boolean(randomizeQuestionsOrder),
      shuffle_answer_options: Boolean(randomizeMCQChoices),
      delivery_mode: deliveryMode,
      is_active: true,
    };

    return payload;
  };

  // Save Step 1 and proceed to Step 2
  const handleProceedToStep2 = async () => {
    if (!title.trim()) {
      toast.error(locale === "ar" ? "يرجى كتابة عنوان الامتحان" : "Please enter an exam title");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildExamPayload();

      if (activeExamId) {
        // Update existing draft or exam
        await updateExamMutation.mutateAsync({ id: activeExamId, data: payload });
        toast.success(locale === "ar" ? "تم حفظ بيانات الامتحان" : "Exam settings saved");
      } else {
        // Create new draft exam in backend
        const created = await createExamMutation.mutateAsync(payload);
        setActiveExamId(created.id);
        toast.success(locale === "ar" ? "تم إنشاء مسودة الامتحان" : "Exam draft created");
      }
      setCurrentStep(2);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ||
          (locale === "ar" ? "حدث خطأ أثناء حفظ الامتحان" : "Error occurred while saving exam"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Submit Handler: Publishes or Finalizes Exam
  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (activeExamId) {
        // Ensure settings are synced
        const payload = buildExamPayload();
        await updateExamMutation.mutateAsync({ id: activeExamId, data: payload });

        // Only publish when completing initial creation flow
        if (mode === "create" && fetchedBackendExam?.status !== "published") {
          await publishExamMutation.mutateAsync(activeExamId);
        }
      }
      toast.success(
        mode === "create"
          ? locale === "ar"
            ? "تم إنشاء ونشر الامتحان بنجاح"
            : "Exam created and published successfully"
          : locale === "ar"
            ? "تم حفظ التعديلات بنجاح"
            : "Changes saved successfully",
      );
      router.push(`/${locale}/dashboard/exams`);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ||
          (locale === "ar" ? "حدث خطأ أثناء إتمام العملية" : "An error occurred"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Handlers
  const handleAddSection = async () => {
    if (!newSecTitle.trim()) return;

    if (activeExamId) {
      try {
        const created = await sectionMutations.createSection.mutateAsync({
          title: { ar: newSecTitle.trim(), en: newSecTitle.trim() },
          is_active: true,
        });
        const mapped = mapBackendSectionToFrontend(created, locale);
        setExamSections((prev) => [...prev, mapped]);
        setNewSecTitle("");
        setActiveDialog(null);
        toast.success(locale === "ar" ? "تم إضافة القسم بنجاح" : "Section added successfully");
        return;
      } catch {
        toast.error(locale === "ar" ? "فشل إضافة القسم" : "Failed to add section");
      }
    }

    const newSec: ExamSection = {
      id: `sec-${Date.now()}`,
      title: newSecTitle.trim(),
      questions: [],
    };
    setExamSections((prev) => [...prev, newSec]);
    setNewSecTitle("");
    setActiveDialog(null);
  };

  const handleOpenEditSection = (sec: ExamSection) => {
    setEditingSection(sec);
    setEditSecTitle(sec.title);
  };

  const handleSaveEditSection = async () => {
    if (!editingSection || !editSecTitle.trim()) return;

    if (activeExamId && !editingSection.id.startsWith("sec-")) {
      try {
        const updated = await sectionMutations.updateSection.mutateAsync({
          sectionId: editingSection.id,
          data: { title: { ar: editSecTitle.trim(), en: editSecTitle.trim() } },
        });
        const mapped = mapBackendSectionToFrontend(updated, locale);
        setExamSections((prev) =>
          prev.map((sec) => (sec.id === editingSection.id ? { ...sec, title: mapped.title } : sec)),
        );
        setEditingSection(null);
        setEditSecTitle("");
        toast.success(locale === "ar" ? "تم تحديث القسم بنجاح" : "Section updated successfully");
        return;
      } catch {
        toast.error(locale === "ar" ? "فشل تحديث القسم" : "Failed to update section");
      }
    }

    setExamSections((prev) =>
      prev.map((sec) =>
        sec.id === editingSection.id ? { ...sec, title: editSecTitle.trim() } : sec,
      ),
    );
    setEditingSection(null);
    setEditSecTitle("");
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    if (activeExamId && !sectionToDelete.id.startsWith("sec-")) {
      try {
        await sectionMutations.deleteSection.mutateAsync(sectionToDelete.id);
        setExamSections((prev) => prev.filter((sec) => sec.id !== sectionToDelete.id));
        setSectionToDelete(null);
        toast.success(locale === "ar" ? "تم حذف القسم بنجاح" : "Section deleted successfully");
        return;
      } catch (err) {
        toast.error(
          getErrorMessage(err) || (locale === "ar" ? "فشل حذف القسم" : "Failed to delete section"),
        );
      }
    }

    setExamSections((prev) => prev.filter((sec) => sec.id !== sectionToDelete.id));
    setSectionToDelete(null);
    toast.success(locale === "ar" ? "تم حذف القسم محلياً" : "Section deleted locally");
  };

  const handleSaveQuestion = async (
    savedQuestion: Question,
    targetSecId: string,
    keepOpen = false,
  ) => {
    const isRealBackendSection = targetSecId && !targetSecId.startsWith("sec-");

    if (activeExamId) {
      try {
        const requiresInstructor = optionsData?.requires_instructor_selection ?? true;
        const instId = requiresInstructor ? Number(teacherName) || undefined : undefined;

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
          exam_id: Number(activeExamId),
          exam_section_id: isRealBackendSection ? Number(targetSecId) : undefined,
          educational_stage_id: Number(grade) || undefined,
          subject_id: Number(subject) || undefined,
          ...(requiresInstructor && instId ? { instructor_id: instId } : {}),
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
          // Update existing question
          const updated = await updateQuestionMutation.mutateAsync({
            id: savedQuestion.id,
            data: payload,
          });
          syncedQuestion = mapBackendQuestionToFrontend(updated, locale);
          toast.success(
            locale === "ar" ? "تم تحديث السؤال بنجاح" : "Question updated successfully",
          );
        } else {
          // Create new question
          const created = await createQuestionMutation.mutateAsync(payload);
          syncedQuestion = mapBackendQuestionToFrontend(created, locale);
          toast.success(locale === "ar" ? "تم إضافة السؤال بنجاح" : "Question added successfully");
        }

        setExamSections((prevSections) => {
          return prevSections.map((sec) => {
            if (sec.id === targetSecId) {
              const questionExists = sec.questions.some((q) => q.id === syncedQuestion.id);
              let updatedQuestions: Question[];
              if (questionExists) {
                updatedQuestions = sec.questions.map((q) =>
                  q.id === syncedQuestion.id ? syncedQuestion : q,
                );
              } else {
                updatedQuestions = [...sec.questions, syncedQuestion];
              }
              return { ...sec, questions: updatedQuestions };
            } else {
              return {
                ...sec,
                questions: sec.questions.filter((q) => q.id !== syncedQuestion.id),
              };
            }
          });
        });

        if (!keepOpen) {
          setEditingQuestion(null);
          setActiveDialog(null);
        }
        return;
      } catch (err) {
        toast.error(
          getErrorMessage(err) ||
            (locale === "ar" ? "فشل في حفظ السؤال" : "Failed to save question"),
        );
      }
    }

    setExamSections((prevSections) => {
      return prevSections.map((sec) => {
        if (sec.id === targetSecId) {
          const questionExists = sec.questions.some((q) => q.id === savedQuestion.id);
          let updatedQuestions: Question[];
          if (questionExists) {
            updatedQuestions = sec.questions.map((q) =>
              q.id === savedQuestion.id ? savedQuestion : q,
            );
          } else {
            updatedQuestions = [...sec.questions, savedQuestion];
          }
          return { ...sec, questions: updatedQuestions };
        } else {
          return {
            ...sec,
            questions: sec.questions.filter((q) => q.id !== savedQuestion.id),
          };
        }
      });
    });

    if (!keepOpen) {
      setEditingQuestion(null);
      setActiveDialog(null);
    }
  };

  const handleSaveManyQuestions = async (questions: Question[], targetSecId: string) => {
    if (!questions || questions.length === 0) return;

    setIsSubmitting(true);
    try {
      const isRealBackendSection = !targetSecId.startsWith("sec-");
      const requiresInstructor = optionsData?.requires_instructor_selection;
      const instId = requiresInstructor
        ? Number(teacherName) || optionsData?.instructors?.[0]?.id
        : undefined;

      const addedQuestions: Question[] = [];

      for (const q of questions) {
        if (activeExamId) {
          const payload: StoreQuestionData = {
            title: { ar: q.questionName, en: q.questionName },
            body: q.questionContent ? { ar: q.questionContent, en: q.questionContent } : undefined,
            type:
              q.type === "mcq"
                ? "multiple_choice"
                : q.type === "true/false"
                  ? "true_false"
                  : "essay",
            difficulty: q.difficulty || "medium",
            classification: mapFrontendKindToBackend(q.questionType),
            score: Number(q.grade) || 1,
            has_explanation: q.hasAnswerExplanation,
            is_active: true,
            exam_id: Number(activeExamId),
            exam_section_id: isRealBackendSection ? Number(targetSecId) : undefined,
            educational_stage_id: Number(grade) || undefined,
            subject_id: Number(subject) || undefined,
            ...(requiresInstructor && instId ? { instructor_id: instId } : {}),
          };

          if (q.hasAnswerExplanation && q.answerExplanation) {
            payload.explanation = { ar: q.answerExplanation, en: q.answerExplanation };
          }

          if (q.type === "text" && q.modelAnswer) {
            payload.model_answer = { ar: q.modelAnswer, en: q.modelAnswer };
          } else if (q.type === "true/false") {
            payload.correct_answer = q.modelAnswer === "true";
          } else if (q.type === "mcq" && q.options) {
            payload.options = q.options.map((opt) => ({
              text: { ar: opt.text, en: opt.text },
              is_correct: opt.id === q.modelAnswer,
            }));
          }

          const created = await createQuestionMutation.mutateAsync(payload);
          const mapped = mapBackendQuestionToFrontend(created, locale);
          addedQuestions.push(mapped);
        } else {
          addedQuestions.push({
            ...q,
            id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          });
        }
      }

      setExamSections((prevSections) =>
        prevSections.map((sec) =>
          sec.id === targetSecId
            ? { ...sec, questions: [...sec.questions, ...addedQuestions] }
            : sec,
        ),
      );

      toast.success(
        locale === "ar"
          ? `تم إضافة ${addedQuestions.length} أسئلة بنجاح`
          : `${addedQuestions.length} questions added successfully`,
      );
      setActiveDialog(null);
      setEditingQuestion(null);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ||
          (locale === "ar" ? "فشل إضافة بعض الأسئلة" : "Failed to add questions"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (secId: string, qId: string) => {
    if (activeExamId && !qId.startsWith("q-")) {
      try {
        await deleteQuestionMutation.mutateAsync(qId);
        toast.success(locale === "ar" ? "تم حذف السؤال بنجاح" : "Question deleted successfully");
      } catch {
        toast.error(locale === "ar" ? "فشل حذف السؤال" : "Failed to delete question");
      }
    }
    setExamSections((prev) =>
      prev.map((sec) =>
        sec.id === secId ? { ...sec, questions: sec.questions.filter((q) => q.id !== qId) } : sec,
      ),
    );
  };

  const handleImportSections = (importedSections: ExamSection[]) => {
    setExamSections((prev) => {
      // If current sections list only has 1 default empty section with 0 questions, we can replace or append
      const isEmptyDefault =
        prev.length === 1 &&
        prev[0].questions.length === 0 &&
        (prev[0].title === "الفصل الأول - الأسئلة الرئيسية" ||
          prev[0].title === "Section 1 - Main Questions");

      if (isEmptyDefault) {
        return importedSections;
      }
      return [...prev, ...importedSections];
    });
  };

  const topButtons = [
    { key: "addSection", label: tStep2("buttons.addSection"), icon: Plus },
    { key: "question", label: tStep2("buttons.addQuestion"), icon: FileQuestion },
    { key: "arrange", label: tStep2("buttons.arrangeSections"), icon: ListOrdered },
    { key: "importExams", label: tStep2("buttons.importOtherExams"), icon: Import },
  ] as const;

  const timelineSteps = [
    {
      id: 1,
      label: tForm("sections.basicInfo"),
      icon: BookOpen,
      complete: currentStep > 1,
    },
    {
      id: 2,
      label: tStep2("title"),
      icon: FileQuestion,
      complete: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-28">
      {/* ── Page Header with Standard Round Back Button ──────────────────── */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/exams`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {mode === "create" ? tForm("createTitle") : tForm("editTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentStep === 1 ? tForm("createSubtitle") : tStep2("subtitle")}
          </p>
        </div>
      </div>

      {/* Main layout: Timeline Sidebar (4 cols) + Form Content (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reusable Vertical Timeline Sidebar */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <FormTimelineSidebar
            timelineTitle={tCourses("new.timelineTitle")}
            steps={timelineSteps}
            currentStep={currentStep}
            disclaimerTitle={tCourses("new.disclaimerTitle")}
            disclaimerDescription={tCourses("new.disclaimerDescription")}
            onStepClick={
              mode === "edit" || Boolean(activeExamId)
                ? (stepId) => setCurrentStep(stepId as 1 | 2)
                : undefined
            }
          />
        </div>

        {/* Main Form Content Area */}
        <main className="lg:col-span-8 order-1 lg:order-2 space-y-6">
          {/* Warning banner when editing an exam that has already been taken by students */}
          {mode === "edit" && performedCount > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-900 ">
              <AlertTriangle className="size-5 shrink-0 text-amber-600  mt-0.5" />
              <div className="space-y-1 text-sm">
                <h4 className="font-bold text-amber-800 ">{tForm("performedWarning.title")}</h4>
                <p className="text-xs sm:text-sm text-amber-700  leading-relaxed">
                  {tForm("performedWarning.description", {
                    count: performedCount,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1: EXAM SETTINGS & BASIC INFO ──────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Section 1: Basic Information */}
              <FormSectionCard
                title={tForm("sections.basicInfo")}
                description={tForm("sections.basicInfoDesc")}
                icon={BookOpen}
              >
                <div className="space-y-4">
                  {/* Exam Title */}
                  <div className="space-y-2">
                    <Label htmlFor="exam-title" className="font-semibold">
                      {tForm("fields.title")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="exam-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={tForm("fields.titlePlaceholder")}
                      required
                    />
                  </div>

                  {/* Description Markdown */}
                  <div className="space-y-2">
                    <Label className="font-semibold">{tForm("fields.description")}</Label>
                    <FormMarkdownEditor
                      value={description}
                      onChange={setDescription}
                      placeholder={tForm("fields.descriptionPlaceholder")}
                    />
                  </div>

                  {/* Numeric Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 pt-2">
                    {/* Tries Allowed */}
                    <div className="space-y-2">
                      <Label htmlFor="tries-allowed" className="text-xs font-semibold">
                        {tForm("fields.triesAllowed")}
                      </Label>
                      <Input
                        id="tries-allowed"
                        type="number"
                        min={1}
                        max={10}
                        value={triesAllowed}
                        onChange={(e) => setTriesAllowed(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>

                    {/* Exam Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="duration-minutes" className="text-xs font-semibold">
                        {tForm("fields.durationMinutes")}
                      </Label>
                      <Input
                        id="duration-minutes"
                        type="number"
                        min={5}
                        max={300}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                      />
                    </div>

                    {/* Pass Percentage */}
                    <div className="space-y-2">
                      <Label htmlFor="passing-percentage" className="text-xs font-semibold">
                        {tForm("fields.passingPercentage")}
                      </Label>
                      <Input
                        id="passing-percentage"
                        type="number"
                        min={0}
                        max={100}
                        value={passingPercentage}
                        onChange={(e) => setPassingPercentage(parseInt(e.target.value, 10) || 60)}
                      />
                    </div>

                    {/* Number of Questions (Max Cap) */}
                    <div className="space-y-2">
                      <Label htmlFor="number-of-questions" className="text-xs font-semibold">
                        {tForm("fields.numberOfQuestions")}
                      </Label>
                      <Input
                        id="number-of-questions"
                        type="number"
                        min={1}
                        max={200}
                        value={numberOfQuestions}
                        onChange={(e) => setNumberOfQuestions(parseInt(e.target.value, 10) || 10)}
                      />
                    </div>
                  </div>
                </div>
              </FormSectionCard>

              {/* Section 2: Academic & Teacher Info */}
              <FormSectionCard
                title={tForm("sections.academic")}
                description={tForm("sections.academicDesc")}
                icon={GraduationCap}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Grade Level */}
                  <GradeSelect
                    value={grade}
                    onValueChange={handleGradeChange}
                    label={tForm("fields.grade")}
                    placeholder={tForm("fields.selectGrade")}
                    grades={mappedStages}
                    disabled={isLoadingOptions}
                  />

                  {/* Subject */}
                  <SubjectSelect
                    value={subject}
                    onValueChange={setSubject}
                    label={tForm("fields.subject")}
                    placeholder={tForm("fields.selectSubject")}
                    subjects={mappedSubjects}
                    disabled={isLoadingOptions}
                  />

                  {/* Teacher Select */}
                  <TeacherSelect
                    value={teacherName}
                    onValueChange={(val) => setTeacherName(val)}
                    label={tForm("fields.teacherName")}
                    placeholder={tForm("fields.selectTeacher")}
                    teachers={mappedInstructors}
                    disabled={
                      isLoadingOptions || optionsData?.requires_instructor_selection === false
                    }
                  />

                  {/* Exam Category */}
                  <SelectWithAdd
                    value={category}
                    onValueChange={(val) => setCategory(val as ExamCategory)}
                    label={tForm("fields.category")}
                    placeholder={tForm("fields.selectCategory")}
                    options={allExamCategoryOptions}
                    allowAdd
                    onAddNewOption={handleAddExamCategory}
                    addDialogTitle="إضافة تصنيف امتحان جديد"
                    addInputLabel="اسم تصنيف الامتحان"
                    addInputPlaceholder="مثال: تقييم شهري دوري"
                  />
                </div>
              </FormSectionCard>

              {/* Section 3: Advanced Settings */}
              <FormSectionCard
                title={tForm("sections.advanced")}
                description={tForm("sections.advancedDesc")}
                icon={Settings}
              >
                <div className="space-y-4">
                  <FormToggleSetting
                    id="show-model-answers"
                    title={tForm("fields.showModelAnswers")}
                    subtitle={tForm("fields.showModelAnswersDesc")}
                    icon={Eye}
                    checked={showModelAnswers}
                    onCheckedChange={setShowModelAnswers}
                  />
                  <FormToggleSetting
                    id="randomize-questions-order"
                    title={tForm("fields.randomizeQuestionsOrder")}
                    subtitle={tForm("fields.randomizeQuestionsOrderDesc")}
                    icon={Shuffle}
                    checked={randomizeQuestionsOrder}
                    onCheckedChange={setRandomizeQuestionsOrder}
                  />
                  <FormToggleSetting
                    id="randomize-mcq-choices"
                    title={tForm("fields.randomizeMCQChoices")}
                    subtitle={tForm("fields.randomizeMCQChoicesDesc")}
                    icon={ListOrdered}
                    checked={randomizeMCQChoices}
                    onCheckedChange={setRandomizeMCQChoices}
                  />
                </div>
              </FormSectionCard>

              {/* Section 4: Independent Exam Toggle (with Venue & Publish Status) */}
              <FormSectionCard
                title={tForm("fields.isIndependent")}
                description={tForm("fields.isIndependentDesc")}
                icon={FileQuestion}
              >
                <div className="space-y-6">
                  {/* Info badge: number of courses this exam is in (edit mode only) */}
                  {mode === "edit" && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/60 border border-border/60 text-xs text-muted-foreground">
                      <Info className="size-3.5 shrink-0 text-primary" />
                      <span>{tForm("inCoursesInfo", { count: coursesCount })}</span>
                    </div>
                  )}

                  <FormToggleSetting
                    id="is-independent-exam"
                    title={tForm("fields.isIndependent")}
                    subtitle={tForm("fields.isIndependentDesc")}
                    icon={FileQuestion}
                    checked={isIndependent}
                    onCheckedChange={setIsIndependent}
                  >
                    {isIndependent && (
                      <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                        {/* Venue */}
                        <FormRadioGroup
                          name="exam-venue"
                          title={tForm("fields.venue")}
                          icon={MapPin}
                          value={venue}
                          onValueChange={(v) => setVenue(v as ExamVenue)}
                          gridClassName="sm:grid-cols-3"
                          options={[
                            {
                              id: "online",
                              label: tCourses("new.venues.online.label"),
                              desc: tCourses("new.venues.online.desc"),
                            },
                            {
                              id: "onsite",
                              label: tCourses("new.venues.onsite.label"),
                              desc: tCourses("new.venues.onsite.desc"),
                            },
                            {
                              id: "hybrid",
                              label: tCourses("new.venues.hybrid.label"),
                              desc: tCourses("new.venues.hybrid.desc"),
                            },
                          ]}
                        />
                      </div>
                    )}
                  </FormToggleSetting>
                </div>
              </FormSectionCard>

              {/* Action Buttons Step 1 */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
                <Button asChild variant="outline" disabled={isSubmitting}>
                  <Link href={`/${locale}/dashboard/exams`}>{tForm("actions.cancel")}</Link>
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleProceedToStep2}
                    disabled={isSubmitting || !title.trim()}
                    className="gap-2 font-semibold"
                  >
                    <span>{tForm("actions.nextStep")}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: SECTIONS AND QUESTIONS ────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* 4 ACTION BUTTONS AT TOP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {topButtons.map((btn) => {
                  const Icon = btn.icon;
                  const isActive = activeDialog === btn.key;
                  return (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => {
                        if (btn.key === "question") {
                          setEditingQuestion(null);
                          setTargetQuestionSectionId(examSections[0]?.id || "");
                        }
                        setActiveDialog(btn.key);
                      }}
                      className={cn(
                        "py-3.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 border shadow-2xs group cursor-pointer",
                        isActive
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-card text-primary border-input hover:bg-primary hover:text-white hover:border-primary",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sections & Questions List */}
              <FormSectionCard
                title={tStep2("title")}
                description={tStep2("subtitle")}
                icon={BookOpen}
                contentClassName="space-y-4"
              >
                {examSections.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
                    <FolderPlus className="size-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
                      {tStep2("noSections")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examSections.map((sec, sIdx) => {
                      const sectionPoints = sec.questions.reduce(
                        (acc, q) => acc + (q.grade || 1),
                        0,
                      );
                      return (
                        <div key={sec.id} className="border rounded-xl p-4 bg-muted/20 space-y-3">
                          {/* Section Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between font-semibold text-foreground text-base gap-2">
                            <span className="flex items-center gap-2">
                              <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                                {sIdx + 1}
                              </span>
                              {sec.title}
                            </span>

                            <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground self-end sm:self-center">
                              <span>
                                {tStep2("questionsCount", { count: sec.questions.length })}
                              </span>
                              <span>•</span>
                              <span>{tStep2("pointsCount", { count: sectionPoints })}</span>

                              {/* Add Question to this section */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={tStep2("buttons.addQuestion")}
                                onClick={() => {
                                  setEditingQuestion(null);
                                  setTargetQuestionSectionId(sec.id);
                                  setActiveDialog("question");
                                }}
                                className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 ms-1"
                              >
                                <Plus className="size-3.5" />
                              </Button>

                              {/* Edit Section */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleOpenEditSection(sec)}
                                className="text-muted-foreground hover:text-primary h-7 w-7"
                                title={locale === "ar" ? "تعديل القسم" : "Edit section"}
                              >
                                <Edit2 className="size-3.5" />
                              </Button>

                              {/* Delete Section */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setSectionToDelete(sec)}
                                className="text-muted-foreground hover:text-destructive h-7 w-7"
                                title={locale === "ar" ? "حذف القسم" : "Delete section"}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Section Questions */}
                          {sec.questions.length > 0 ? (
                            <div className="ps-6 rtl:ps-0 rtl:pe-6 space-y-2 border-s rtl:border-s-0 rtl:border-e border-border">
                              {sec.questions.map((q, qIdx) => (
                                <div
                                  key={q.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-background border gap-2"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    {q.type === "mcq" && (
                                      <ListOrdered className="size-4 text-primary shrink-0" />
                                    )}
                                    {q.type === "true/false" && (
                                      <HelpCircle className="size-4 text-amber-500 shrink-0" />
                                    )}
                                    {q.type === "text" && (
                                      <BookOpen className="size-4 text-emerald-500 shrink-0" />
                                    )}

                                    <span className="font-semibold text-foreground">
                                      {qIdx + 1}. {q.questionName}
                                    </span>

                                    {/* Badges */}
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-primary/5 text-primary border-primary/20"
                                    >
                                      {t(
                                        `questionDialog.types.${q.type === "mcq" ? "mcq" : q.type === "true/false" ? "trueFalse" : "text"}`,
                                      )}
                                    </Badge>

                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-muted/50 text-muted-foreground"
                                    >
                                      {t(`questionDialog.difficulties.${q.difficulty}`)}
                                    </Badge>

                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    >
                                      {tStep2("pointsCount", { count: q.grade || 1 })}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-1 self-end sm:self-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => {
                                        setEditingQuestion({ question: q, sectionId: sec.id });
                                        setActiveDialog("question");
                                      }}
                                      className="text-muted-foreground hover:text-primary"
                                    >
                                      <Edit2 className="size-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => handleDeleteQuestion(sec.id, q.id)}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic ps-6 rtl:ps-0 rtl:pe-6">
                              {tStep2("noQuestions")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </FormSectionCard>

              {/* Action Buttons Step 2 */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={isSubmitting}
                >
                  {tForm("actions.backToStep1")}
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSubmitting || !title.trim()}
                    className="gap-2 font-semibold"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>
                      {mode === "create"
                        ? tForm("actions.createExam")
                        : tForm("actions.saveChanges")}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DIALOG 1: ADD SECTION */}
      <Dialog
        open={activeDialog === "addSection"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tStep2("addSectionDialog.title")}</DialogTitle>
            <DialogDescription>{tStep2("addSectionDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sec-title-input" className="text-sm font-medium text-foreground">
                {tStep2("addSectionDialog.titleLabel")}
              </Label>
              <Input
                id="sec-title-input"
                value={newSecTitle}
                onChange={(e) => setNewSecTitle(e.target.value)}
                placeholder={tStep2("addSectionDialog.titlePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => setActiveDialog(null)}>
              {tForm("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleAddSection} disabled={!newSecTitle.trim()}>
              {tStep2("addSectionDialog.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: QUESTION DIALOG (ADD & EDIT) */}
      <QuestionDialog
        open={activeDialog === "question"}
        onOpenChange={(open) => {
          if (!open) setEditingQuestion(null);
          setActiveDialog(open ? "question" : null);
        }}
        sections={examSections}
        initialQuestion={editingQuestion?.question || null}
        initialSectionId={editingQuestion?.sectionId || targetQuestionSectionId}
        examGrade={grade}
        examSubject={subject}
        examTeacherName={teacherName}
        onSave={handleSaveQuestion}
        onSaveMany={handleSaveManyQuestions}
      />

      {/* DIALOG 3: ARRANGE SECTIONS */}
      <ArrangeSectionsDialog
        open={activeDialog === "arrange"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        items={examSections}
        onReorder={setExamSections}
      />

      {/* DIALOG 4: IMPORT FROM OTHER EXAMS */}
      <ImportFromExamsDialog
        open={activeDialog === "importExams"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        availableExams={allExams}
        onImport={handleImportSections}
      />

      {/* DIALOG 5: EDIT SECTION */}
      <Dialog
        open={Boolean(editingSection)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSection(null);
            setEditSecTitle("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tStep2("editSectionDialog.title")}</DialogTitle>
            <DialogDescription>{tStep2("editSectionDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-sec-title-input" className="text-sm font-medium text-foreground">
                {tStep2("editSectionDialog.titleLabel")}
              </Label>
              <Input
                id="edit-sec-title-input"
                value={editSecTitle}
                onChange={(e) => setEditSecTitle(e.target.value)}
                placeholder={tStep2("editSectionDialog.titlePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEditingSection(null);
                setEditSecTitle("");
              }}
            >
              {tForm("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleSaveEditSection} disabled={!editSecTitle.trim()}>
              {tStep2("editSectionDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: DELETE SECTION CONFIRMATION */}
      <Dialog
        open={Boolean(sectionToDelete)}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              <span>{tStep2("deleteSectionDialog.title")}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {tStep2("deleteSectionDialog.description", {
                title: sectionToDelete?.title || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setSectionToDelete(null)}>
              {tStep2("deleteSectionDialog.cancel")}
            </Button>
            <Button variant="destructive" type="button" onClick={handleDeleteSection}>
              {tStep2("deleteSectionDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
