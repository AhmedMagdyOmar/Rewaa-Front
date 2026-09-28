/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  AlertTriangle,
  ArrowLeft,
  FileQuestion,
  FolderPlus,
  Import,
  ListOrdered,
  Plus,
  Shuffle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { FormTimelineSidebar } from "@/components/dashboard/common/form-timeline-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateExam,
  useExamSectionMutations,
  useProviderExam,
  useProviderExamOptions,
  useProviderExams,
  usePublishExam,
  useScheduleExam,
  useUpdateExam,
} from "@/hooks/use-exams";
import { useCreateQuestion, useDeleteQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import {
  mapBackendExamToFrontend,
  mapBackendQuestionToFrontend,
  mapBackendSectionToFrontend,
  mapFrontendKindToBackend,
} from "@/lib/adapters/exam-adapters";
import { getErrorMessage } from "@/lib/api-utils";
import type { StoreExamData, StoreQuestionData } from "@/types/api-contracts";
import type { Exam, ExamCategory, ExamSection, ExamVenue, Question } from "@/types/exam";
import { ExamSettingsStep } from "@/components/dashboard/exams/exam-settings-step";
import { ExamSectionsStep } from "@/components/dashboard/exams/exam-sections-step";
import { ExamFormDialogs } from "@/components/dashboard/exams/exam-form-dialogs";

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
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const [educationalStageId, setEducationalStageId] = React.useState<string>("");
  const { data: optionsData, isLoading: isLoadingOptionsRaw } =
    useProviderExamOptions(educationalStageId);
  const isLoadingOptions = isMounted && isLoadingOptionsRaw;

  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const publishExamMutation = usePublishExam();
  const scheduleExamMutation = useScheduleExam();
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

  // Advanced Settings
  const [showModelAnswers, setShowModelAnswers] = React.useState(true);
  const [randomizeQuestionsOrder, setRandomizeQuestionsOrder] = React.useState(true);
  const [randomizeMCQChoices, setRandomizeMCQChoices] = React.useState(false);

  // Classification & Venue / Publish Status
  const [isIndependent, setIsIndependent] = React.useState<boolean>(true);
  const [venue, setVenue] = React.useState<ExamVenue>("online");
  const [coursesCount, setCoursesCount] = React.useState<number>(0);
  const [performedCount, setPerformedCount] = React.useState<number>(0);
  const [examPublishStatus, setExamPublishStatus] = React.useState<
    "draft" | "published" | "scheduled"
  >("draft");
  const [examScheduledPublishDate, setExamScheduledPublishDate] = React.useState("");

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

      const status = fetchedBackendExam.status;
      if (status === "published" || status === "scheduled" || status === "draft") {
        setExamPublishStatus(status);
      }
      if (fetchedBackendExam.scheduled_publish_at) {
        setExamScheduledPublishDate(
          fetchedBackendExam.scheduled_publish_at.split("T")[0] ||
            fetchedBackendExam.scheduled_publish_at.split(" ")[0] ||
            "",
        );
      }

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

  // Map backend options
  const mappedStages = React.useMemo(() => {
    return (optionsData?.educational_stages || []).map((s) => ({
      id: s.id,
      name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
    }));
  }, [optionsData?.educational_stages, locale]);

  const mappedSubjects = React.useMemo(() => {
    return (optionsData?.subjects || []).map((s) => ({
      id: s.id,
      name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
    }));
  }, [optionsData?.subjects, locale]);

  const mappedInstructors = React.useMemo(() => {
    return (optionsData?.instructors || []).map((i) => ({
      id: i.id,
      full_name: i.full_name,
    }));
  }, [optionsData?.instructors]);

  // Exam categories from backend options (ExamClassificationEnum)
  const examCategoryOptions = React.useMemo(() => {
    if (optionsData?.classifications) {
      return Object.entries(optionsData.classifications).map(([value, label]) => ({
        value,
        label: label as string,
      }));
    }

    return [
      { value: "quiz", label: t("category.quiz") },
      { value: "midterm", label: t("category.midterm") },
      { value: "final", label: t("category.final") },
      { value: "test", label: t("category.test") },
    ];
  }, [optionsData, t]);

  // Submissions and Dialog states
  const [activeDialog, setActiveDialog] = React.useState<string | null>(null);
  const [newSecTitle, setNewSecTitle] = React.useState("");
  const [editingSection, setEditingSection] = React.useState<ExamSection | null>(null);
  const [editSecTitle, setEditSecTitle] = React.useState("");
  const [sectionToDelete, setSectionToDelete] = React.useState<ExamSection | null>(null);
  const [editingQuestion, setEditingQuestion] = React.useState<{
    question: Question;
    sectionId: string;
  } | null>(null);
  const [targetQuestionSectionId, setTargetQuestionSectionId] = React.useState<string>("");

  const { data: allExamsData } = useProviderExams({ per_page: 50 });
  const allExams: Exam[] = React.useMemo(() => {
    if (!allExamsData?.exams) return [];
    return allExamsData.exams.map((be) => mapBackendExamToFrontend(be, locale));
  }, [allExamsData, locale]);

  const isSubmitting =
    createExamMutation.isPending ||
    updateExamMutation.isPending ||
    publishExamMutation.isPending ||
    scheduleExamMutation.isPending ||
    sectionMutations.createSection.isPending ||
    createQuestionMutation.isPending;

  const buildStorePayload = (): StoreExamData => {
    const requiresInstructor = optionsData?.requires_instructor_selection ?? true;
    const instId = requiresInstructor ? Number(teacherName) || undefined : undefined;

    return {
      title: { ar: title.trim(), en: title.trim() },
      description: description.trim()
        ? { ar: description.trim(), en: description.trim() }
        : undefined,
      educational_stage_id: Number(grade) || 1,
      subject_id: Number(subject) || 1,
      ...(requiresInstructor && instId ? { instructor_id: instId } : {}),
      classification: category,
      duration_minutes: Number(durationMinutes) || 30,
      passing_percentage: Number(passingPercentage) || 60,
      max_attempts: Number(triesAllowed) || 1,
      questions_limit: Number(numberOfQuestions) || 10,
      show_correct_answers_after_submission: showModelAnswers,
      shuffle_questions: randomizeQuestionsOrder,
      shuffle_answer_options: randomizeMCQChoices,
      delivery_mode: isIndependent
        ? venue === "hybrid"
          ? "mixed"
          : venue === "onsite"
            ? "center"
            : "online"
        : "online",
      is_active: true,
    };
  };

  const handleProceedToStep2 = async () => {
    if (!title.trim()) {
      toast.error(
        locale === "ar" ? "يرجى كتابة عنوان الامتحان أولاً" : "Please enter the exam title",
      );
      return;
    }

    try {
      const payload = buildStorePayload();
      if (!activeExamId) {
        const created = await createExamMutation.mutateAsync(payload);
        setActiveExamId(created.id);
        toast.success(
          locale === "ar"
            ? "تم حفظ إعدادات الامتحان بنجاح. يمكنك الآن إضافة الأقسام والأسئلة"
            : "Exam settings saved. You can now add sections and questions.",
        );
      } else {
        await updateExamMutation.mutateAsync({ id: activeExamId, data: payload });
        toast.success(
          locale === "ar" ? "تم تحديث إعدادات الامتحان" : "Exam settings updated successfully",
        );
      }
      setCurrentStep(2);
    } catch (err) {
      toast.error(
        getErrorMessage(err) ||
          (locale === "ar" ? "فشل حفظ إعدادات الامتحان" : "Failed to save exam settings"),
      );
    }
  };

  const handleAddSection = async () => {
    if (!newSecTitle.trim()) return;

    if (activeExamId) {
      try {
        const created = await sectionMutations.createSection.mutateAsync({
          title: { ar: newSecTitle.trim(), en: newSecTitle.trim() },
        });
        const mappedSec = mapBackendSectionToFrontend(created, locale);
        setExamSections((prev) => [...prev, mappedSec]);
        setNewSecTitle("");
        setActiveDialog(null);
        toast.success(locale === "ar" ? "تم إنشاء القسم بنجاح" : "Section created successfully");
        return;
      } catch (err) {
        toast.error(
          getErrorMessage(err) ||
            (locale === "ar" ? "فشل إنشاء القسم" : "Failed to create section"),
        );
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
    toast.success(locale === "ar" ? "تم إضافة القسم محلياً" : "Section added locally");
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
          data: {
            title: { ar: editSecTitle.trim(), en: editSecTitle.trim() },
          },
        });
        const mappedSec = mapBackendSectionToFrontend(updated, locale);
        setExamSections((prev) =>
          prev.map((sec) =>
            sec.id === editingSection.id ? { ...mappedSec, questions: sec.questions } : sec,
          ),
        );
        setEditingSection(null);
        setEditSecTitle("");
        toast.success(locale === "ar" ? "تم تعديل القسم بنجاح" : "Section updated successfully");
        return;
      } catch (err) {
        toast.error(
          getErrorMessage(err) ||
            (locale === "ar" ? "فشل تعديل القسم" : "Failed to update section"),
        );
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
          const updated = await updateQuestionMutation.mutateAsync({
            id: savedQuestion.id,
            data: payload,
          });
          syncedQuestion = mapBackendQuestionToFrontend(updated, locale);
          toast.success(
            locale === "ar" ? "تم تحديث السؤال بنجاح" : "Question updated successfully",
          );
        } else {
          const created = await createQuestionMutation.mutateAsync(payload);
          syncedQuestion = mapBackendQuestionToFrontend(created, locale);
          toast.success(locale === "ar" ? "تم إضافة السؤال بنجاح" : "Question added successfully");
        }

        setExamSections((prev) =>
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
        return;
      } catch (err) {
        toast.error(
          getErrorMessage(err) || (locale === "ar" ? "فشل حفظ السؤال" : "Failed to save question"),
        );
        return;
      }
    }

    setExamSections((prev) =>
      prev.map((sec) => {
        if (sec.id === targetSecId) {
          const existingIdx = sec.questions.findIndex((q) => q.id === savedQuestion.id);
          if (existingIdx >= 0) {
            const updated = [...sec.questions];
            updated[existingIdx] = savedQuestion;
            return { ...sec, questions: updated };
          }
          return { ...sec, questions: [...sec.questions, savedQuestion] };
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
  };

  const handleSaveManyQuestions = async (questions: Question[], targetSecId: string) => {
    for (const q of questions) {
      await handleSaveQuestion(q, targetSecId, true);
    }
    setActiveDialog(null);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (secId: string, qId: string) => {
    if (!qId.startsWith("q-")) {
      try {
        await deleteQuestionMutation.mutateAsync(qId);
        toast.success(locale === "ar" ? "تم حذف السؤال بنجاح" : "Question deleted successfully");
      } catch (err) {
        toast.error(
          getErrorMessage(err) ||
            (locale === "ar" ? "فشل حذف السؤال" : "Failed to delete question"),
        );
        return;
      }
    }

    setExamSections((prev) =>
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

  const handleImportSections = (importedSections: ExamSection[]) => {
    setExamSections((prev) => [...prev, ...importedSections]);
    setActiveDialog(null);
    toast.success(locale === "ar" ? "تم استيراد الأسئلة بنجاح" : "Questions imported successfully");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(
        locale === "ar" ? "يرجى كتابة عنوان الامتحان أولاً" : "Please enter the exam title",
      );
      return;
    }

    try {
      const payload = buildStorePayload();
      let finalExamId = activeExamId;

      if (!finalExamId) {
        const created = await createExamMutation.mutateAsync(payload);
        finalExamId = created.id;
      } else {
        await updateExamMutation.mutateAsync({ id: finalExamId, data: payload });
      }

      if (examPublishStatus === "published") {
        await publishExamMutation.mutateAsync(finalExamId);
      } else if (examPublishStatus === "scheduled" && examScheduledPublishDate) {
        await scheduleExamMutation.mutateAsync({
          id: finalExamId,
          scheduledAt: examScheduledPublishDate,
        });
      }

      toast.success(
        mode === "create"
          ? locale === "ar"
            ? "تم إنشاء الامتحان وحفظه بنجاح"
            : "Exam created and saved successfully"
          : locale === "ar"
            ? "تم حفظ التعديلات بنجاح"
            : "Changes saved successfully",
      );

      router.push(`/${locale}/dashboard/exams`);
    } catch (err) {
      toast.error(
        getErrorMessage(err) ||
          (locale === "ar" ? "فشل حفظ بيانات الامتحان" : "Failed to save exam"),
      );
    }
  };

  const topButtons = [
    { key: "question", label: tStep2("buttons.addQuestion"), icon: Plus },
    { key: "addSection", label: tStep2("buttons.addSection"), icon: FolderPlus },
    { key: "arrange", label: tStep2("buttons.arrangeSections"), icon: Shuffle },
    { key: "importExams", label: tStep2("buttons.importOtherExams"), icon: Import },
  ];

  const timelineSteps = [
    {
      id: 1,
      label: tCourses("new.steps.infoAndPrice"),
      title: tCourses("new.steps.infoAndPrice"),
      description: tForm("sections.basicInfoDesc"),
      icon: ListOrdered,
      complete: currentStep > 1,
    },
    {
      id: 2,
      label: tStep2("title"),
      title: tStep2("title"),
      description: tStep2("subtitle"),
      icon: FileQuestion,
      complete: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-28">
      {/* ── Page Header with Standard Round Back Button & Step 2 Publish Status ──────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard/exams`}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {currentStep === 2 && title.trim()
                ? title
                : mode === "create"
                  ? tForm("createTitle")
                  : tForm("editTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentStep === 1 ? tForm("createSubtitle") : tStep2("subtitle")}
            </p>
          </div>
        </div>

        {/* Step 2 Header: Exam Publish Status Select & Schedule Dates */}
        {currentStep === 2 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select
              value={examPublishStatus}
              onValueChange={(val: "draft" | "published" | "scheduled") =>
                setExamPublishStatus(val)
              }
            >
              <SelectTrigger className="w-36 h-9 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{locale === "ar" ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="published">{locale === "ar" ? "منشور" : "Published"}</SelectItem>
                <SelectItem value="scheduled">{locale === "ar" ? "مجدول" : "Scheduled"}</SelectItem>
              </SelectContent>
            </Select>

            {examPublishStatus === "scheduled" && (
              <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="exam-scheduled-publish-date"
                    className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {locale === "ar" ? "تاريخ النشر:" : "Publish Date:"}
                  </label>
                  <Input
                    id="exam-scheduled-publish-date"
                    type="date"
                    value={examScheduledPublishDate}
                    onChange={(e) => setExamScheduledPublishDate(e.target.value)}
                    className="h-9 w-36 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main layout: Timeline Sidebar (4 cols) + Form Content (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

        <main className="lg:col-span-8 order-1 lg:order-2 space-y-6">
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

          {currentStep === 1 && (
            <ExamSettingsStep
              mode={mode}
              title={title}
              onTitleChange={setTitle}
              description={description}
              onDescriptionChange={setDescription}
              triesAllowed={triesAllowed}
              onTriesAllowedChange={setTriesAllowed}
              durationMinutes={durationMinutes}
              onDurationMinutesChange={setDurationMinutes}
              passingPercentage={passingPercentage}
              onPassingPercentageChange={setPassingPercentage}
              numberOfQuestions={numberOfQuestions}
              onNumberOfQuestionsChange={setNumberOfQuestions}
              grade={grade}
              onGradeChange={handleGradeChange}
              subject={subject}
              onSubjectChange={setSubject}
              teacherName={teacherName}
              onTeacherNameChange={setTeacherName}
              category={category}
              onCategoryChange={setCategory}
              allExamCategoryOptions={examCategoryOptions}
              mappedStages={mappedStages}
              mappedSubjects={mappedSubjects}
              mappedInstructors={mappedInstructors}
              isLoadingOptions={isLoadingOptions}
              requiresInstructorSelection={optionsData?.requires_instructor_selection}
              showModelAnswers={showModelAnswers}
              onShowModelAnswersChange={setShowModelAnswers}
              randomizeQuestionsOrder={randomizeQuestionsOrder}
              onRandomizeQuestionsOrderChange={setRandomizeQuestionsOrder}
              randomizeMCQChoices={randomizeMCQChoices}
              onRandomizeMCQChoicesChange={setRandomizeMCQChoices}
              isIndependent={isIndependent}
              onIsIndependentChange={setIsIndependent}
              venue={venue}
              onVenueChange={setVenue}
              coursesCount={coursesCount}
              isSubmitting={isSubmitting}
              locale={locale}
              tForm={tForm}
              tCourses={tCourses}
              onProceedToStep2={handleProceedToStep2}
            />
          )}

          {currentStep === 2 && (
            <ExamSectionsStep
              examSections={examSections}
              activeDialog={activeDialog}
              topButtons={topButtons}
              onTopButtonClick={(key) => {
                if (key === "question") {
                  setEditingQuestion(null);
                  setTargetQuestionSectionId(examSections[0]?.id || "");
                }
                setActiveDialog(key);
              }}
              onOpenAddQuestion={(secId) => {
                setEditingQuestion(null);
                setTargetQuestionSectionId(secId);
                setActiveDialog("question");
              }}
              onOpenEditQuestion={(q, secId) => {
                setEditingQuestion({ question: q, sectionId: secId });
                setActiveDialog("question");
              }}
              onDeleteQuestion={handleDeleteQuestion}
              onOpenEditSection={handleOpenEditSection}
              onOpenDeleteSection={setSectionToDelete}
              onBackToStep1={() => setCurrentStep(1)}
              onSave={handleSave}
              isSubmitting={isSubmitting}
              title={title}
              mode={mode}
              locale={locale}
              t={t}
              tForm={tForm}
              tStep2={tStep2}
            />
          )}
        </main>
      </div>

      <ExamFormDialogs
        activeDialog={activeDialog}
        onActiveDialogChange={setActiveDialog}
        newSecTitle={newSecTitle}
        onNewSecTitleChange={setNewSecTitle}
        onAddSection={handleAddSection}
        editingSection={editingSection}
        editSecTitle={editSecTitle}
        onEditSecTitleChange={setEditSecTitle}
        onSaveEditSection={handleSaveEditSection}
        onCancelEditSection={() => {
          setEditingSection(null);
          setEditSecTitle("");
        }}
        sectionToDelete={sectionToDelete}
        onCancelDeleteSection={() => setSectionToDelete(null)}
        onConfirmDeleteSection={handleDeleteSection}
        examSections={examSections}
        onReorderSections={setExamSections}
        editingQuestion={editingQuestion}
        targetQuestionSectionId={targetQuestionSectionId}
        onEditingQuestionChange={setEditingQuestion}
        grade={grade}
        subject={subject}
        teacherName={teacherName}
        onSaveQuestion={handleSaveQuestion}
        onSaveManyQuestions={handleSaveManyQuestions}
        allExams={allExams}
        onImportSections={handleImportSections}
        tForm={tForm}
        tStep2={tStep2}
      />
    </div>
  );
}
