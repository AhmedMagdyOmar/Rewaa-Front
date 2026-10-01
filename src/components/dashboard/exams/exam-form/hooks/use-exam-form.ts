/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useCreateExam,
  useCreateExamCategory,
  useProviderExam,
  useProviderExamOptions,
  usePublishExam,
  useScheduleExam,
  useUpdateExam,
} from "@/hooks/use-exams";
import { mapBackendCategoryToFrontend } from "@/lib/adapters/exam-adapters";
import { getErrorMessage } from "@/lib/api-utils";
import { StoreExamData } from "@/types/api-contracts";
import { Exam, ExamCategory, ExamVenue } from "@/types/exam";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseExamFormProps {
  mode: "create" | "edit";
  initialExamId?: string | number;
  initialData?: Exam | null;
}

export function useExamForm({ mode, initialExamId, initialData }: UseExamFormProps) {
  const t = useTranslations("exams");
  const locale = useLocale();
  const router = useRouter();

  // Loading & Step state
  const [isLoaded, setIsLoaded] = useState(!initialExamId);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [createdExamId, setCreatedExamId] = useState<string | number | null>(initialExamId || null);

  // Form Field State - Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triesAllowed, setTriesAllowed] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [passingPercentage, setPassingPercentage] = useState<number>(60);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);

  // Academic Info
  const [grade, setGrade] = useState("");
  const [educationalStageId, setEducationalStageId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [category, setCategory] = useState<ExamCategory>("test");

  // Advanced Settings
  const [showModelAnswers, setShowModelAnswers] = useState(true);
  const [randomizeQuestionsOrder, setRandomizeQuestionsOrder] = useState(true);
  const [randomizeMCQChoices, setRandomizeMCQChoices] = useState(false);

  // Classification & Venue / Publish Status
  const [isIndependent, setIsIndependent] = useState<boolean>(true);
  const [venue, setVenue] = useState<ExamVenue>("online");
  const [courseId, setCourseId] = useState<string>("");
  const [courseSectionId, setCourseSectionId] = useState<string>("");
  const [lessonId, setLessonId] = useState<string>("");
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const [performedCount, setPerformedCount] = useState<number>(0);
  const [examPublishStatus, setExamPublishStatus] = useState<"draft" | "published" | "scheduled">(
    "draft",
  );
  const [examScheduledPublishDate, setExamScheduledPublishDate] = useState("");

  // TanStack Query & Mutation hooks
  const { data: optionsData, isLoading: isLoadingOptions } =
    useProviderExamOptions(educationalStageId);
  const { data: initialBackendExam } = useProviderExam(createdExamId || undefined);

  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const publishExamMutation = usePublishExam();
  const scheduleExamMutation = useScheduleExam();
  const createCategoryMutation = useCreateExamCategory();

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setEducationalStageId(newGrade);
    if (newGrade !== grade) {
      setSubject("");
      setCourseId("");
      setCourseSectionId("");
      setLessonId("");
    }
  };

  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    setCourseSectionId("");
    setLessonId("");
  };

  const handleCourseSectionChange = (newSectionId: string) => {
    setCourseSectionId(newSectionId);
    setLessonId("");
  };

  // Sync initial backend exam data when editing or loaded
  useEffect(() => {
    if (initialBackendExam) {
      setTitle(
        initialBackendExam.title?.[locale] ||
          initialBackendExam.title?.ar ||
          initialBackendExam.title?.en ||
          "",
      );
      setDescription(
        initialBackendExam.description?.[locale] ||
          initialBackendExam.description?.ar ||
          initialBackendExam.description?.en ||
          "",
      );
      setTriesAllowed(initialBackendExam.max_attempts || 1);
      setDurationMinutes(initialBackendExam.duration_minutes || 30);
      setPassingPercentage(initialBackendExam.passing_percentage ?? 60);
      setNumberOfQuestions(initialBackendExam.questions_limit || 10);

      const stageIdStr = String(initialBackendExam.educational_stage_id || "");
      setGrade(stageIdStr);
      setEducationalStageId(stageIdStr);
      setSubject(String(initialBackendExam.subject_id || ""));
      setTeacherName(String(initialBackendExam.instructor_id || ""));
      setCategory(
        mapBackendCategoryToFrontend(String(initialBackendExam.classification || "test")),
      );

      setShowModelAnswers(initialBackendExam.show_correct_answers_after_submission ?? true);
      setRandomizeQuestionsOrder(initialBackendExam.shuffle_questions ?? true);
      setRandomizeMCQChoices(initialBackendExam.shuffle_answer_options ?? false);

      setIsIndependent(Boolean(initialBackendExam.is_standalone));
      setCourseId(initialBackendExam.course_id ? String(initialBackendExam.course_id) : "");
      setCourseSectionId(
        initialBackendExam.course_section_id ? String(initialBackendExam.course_section_id) : "",
      );
      setLessonId(initialBackendExam.lesson_id ? String(initialBackendExam.lesson_id) : "");

      if (initialBackendExam.delivery_mode) {
        setVenue(
          initialBackendExam.delivery_mode === "in_person"
            ? "onsite"
            : initialBackendExam.delivery_mode === "hybrid"
              ? "hybrid"
              : "online",
        );
      }
      setCoursesCount(initialBackendExam.course_id ? 1 : 0);
      setPerformedCount(initialBackendExam.students_count ?? 0);

      const status = initialBackendExam.status;
      if (status === "published" || status === "scheduled" || status === "draft") {
        setExamPublishStatus(status);
      }
      if (initialBackendExam.scheduled_publish_at) {
        setExamScheduledPublishDate(
          initialBackendExam.scheduled_publish_at.split("T")[0] ||
            initialBackendExam.scheduled_publish_at.split(" ")[0] ||
            "",
        );
      }

      setIsLoaded(true);
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
      setIsLoaded(true);
    }
  }, [initialBackendExam, initialData, locale]);

  // Map backend options
  const mappedStages = useMemo(() => {
    return (optionsData?.educational_stages || []).map((s) => ({
      id: s.id,
      name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
    }));
  }, [optionsData?.educational_stages, locale]);

  const mappedSubjects = useMemo(() => {
    return (optionsData?.subjects || []).map((s) => ({
      id: s.id,
      name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
    }));
  }, [optionsData?.subjects, locale]);

  const mappedInstructors = useMemo(() => {
    return (optionsData?.instructors || []).map((i) => ({
      id: i.id,
      full_name: i.full_name,
    }));
  }, [optionsData?.instructors]);

  const mappedCourses = useMemo(() => {
    return (optionsData?.courses || []).map((c) => ({
      id: String(c.id),
      title: locale === "ar" ? c.title?.ar || c.title?.en || "" : c.title?.en || c.title?.ar || "",
      sections: c.sections || [],
    }));
  }, [optionsData?.courses, locale]);

  const mappedSections = useMemo(() => {
    if (!courseId) return [];
    const selectedCourse = mappedCourses.find((c) => c.id === courseId);
    if (!selectedCourse) return [];
    return selectedCourse.sections.map((s) => ({
      id: String(s.id),
      title: locale === "ar" ? s.title?.ar || s.title?.en || "" : s.title?.en || s.title?.ar || "",
      lessons: s.lessons || [],
    }));
  }, [courseId, mappedCourses, locale]);

  const mappedLessons = useMemo(() => {
    if (!courseSectionId) return [];
    const selectedSection = mappedSections.find((s) => s.id === courseSectionId);
    if (!selectedSection) return [];
    return selectedSection.lessons.map((l) => ({
      id: String(l.id),
      title: locale === "ar" ? l.title?.ar || l.title?.en || "" : l.title?.en || l.title?.ar || "",
    }));
  }, [courseSectionId, mappedSections, locale]);

  // Exam categories from backend options
  const examCategoryOptions = useMemo(() => {
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

  const handleAddExamCategory = async (name: string): Promise<string | undefined> => {
    try {
      const res = await createCategoryMutation.mutateAsync({
        name: { ar: name, en: name },
        is_active: true,
      });
      const newCode = res.category.code;
      setCategory(newCode);
      toast.success(
        locale === "ar" ? "تمت إضافة تصنيف الامتحان بنجاح" : "Exam category created successfully",
      );
      return newCode;
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          locale === "ar" ? "فشل في إضافة تصنيف الامتحان" : "Failed to create exam category",
        ),
      );
      return undefined;
    }
  };

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
      course_id: isIndependent ? null : Number(courseId) || null,
      course_section_id: isIndependent ? null : Number(courseSectionId) || null,
      lesson_id: isIndependent ? null : Number(lessonId) || null,
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
      if (!createdExamId) {
        const created = await createExamMutation.mutateAsync(payload);
        setCreatedExamId(created.id);
        toast.success(
          locale === "ar"
            ? "تم حفظ إعدادات الامتحان بنجاح. يمكنك الآن إضافة الأقسام والأسئلة"
            : "Exam settings saved. You can now add sections and questions.",
        );
      } else {
        await updateExamMutation.mutateAsync({ id: createdExamId, data: payload });
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

  const handleFinish = async () => {
    if (!title.trim()) {
      toast.error(
        locale === "ar" ? "يرجى كتابة عنوان الامتحان أولاً" : "Please enter the exam title",
      );
      return;
    }

    try {
      const payload = buildStorePayload();
      let finalExamId = createdExamId;

      if (!finalExamId) {
        const created = await createExamMutation.mutateAsync(payload);
        finalExamId = created.id;
        setCreatedExamId(finalExamId);
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

  const isInfoComplete = Boolean(title.trim() && grade && subject);
  const isSubmitting =
    createExamMutation.isPending ||
    updateExamMutation.isPending ||
    publishExamMutation.isPending ||
    scheduleExamMutation.isPending;

  return {
    isLoaded,
    currentStep,
    setCurrentStep,
    createdExamId,
    title,
    setTitle,
    description,
    setDescription,
    triesAllowed,
    setTriesAllowed,
    durationMinutes,
    setDurationMinutes,
    passingPercentage,
    setPassingPercentage,
    numberOfQuestions,
    setNumberOfQuestions,
    grade,
    setGrade,
    handleGradeChange,
    subject,
    setSubject,
    teacherName,
    setTeacherName,
    category,
    setCategory,
    showModelAnswers,
    setShowModelAnswers,
    randomizeQuestionsOrder,
    setRandomizeQuestionsOrder,
    randomizeMCQChoices,
    setRandomizeMCQChoices,
    isIndependent,
    setIsIndependent,
    venue,
    setVenue,
    courseId,
    setCourseId,
    handleCourseChange,
    courseSectionId,
    setCourseSectionId,
    handleCourseSectionChange,
    lessonId,
    setLessonId,
    coursesCount,
    performedCount,
    examPublishStatus,
    setExamPublishStatus,
    examScheduledPublishDate,
    setExamScheduledPublishDate,
    mappedStages,
    mappedSubjects,
    mappedInstructors,
    mappedCourses,
    mappedSections,
    mappedLessons,
    isLoadingOptions,
    optionsData,
    examCategoryOptions,
    handleAddExamCategory,
    handleProceedToStep2,
    handleFinish,
    isInfoComplete,
    isSubmitting,
  };
}
