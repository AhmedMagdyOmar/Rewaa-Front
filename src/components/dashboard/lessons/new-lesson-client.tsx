/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ComboboxSelect,
  ExamSelect,
  GradeSelect,
  SubjectSelect,
  TeacherSelect,
} from "@/components/ui/academic-selects";
import { Button } from "@/components/ui/button";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import {
  useCreateLesson,
  useProviderLesson,
  useProviderLessonOptions,
  useUpdateLesson,
} from "@/hooks/use-lessons";
import { cn } from "@/lib/utils";
import type { StoreLessonData, UpdateLessonData } from "@/types/api-contracts";
import type { CourseVenue, LessonPublishStatus, LessonType } from "@/types/course";
import type { Exam } from "@/types/exam";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  GraduationCap,
  ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Radio,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface AttachmentItem {
  id: string;
  title: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  sizeInBytes?: number;
  file?: File;
  isExisting?: boolean;
}

interface NewLessonClientProps {
  initialLessonId?: string;
}

export function NewLessonClient({ initialLessonId }: NewLessonClientProps = {}) {
  const t = useTranslations("lessons.new");
  const tDialog = useTranslations("courses.new.step2.addLessonDialog");
  const tCourses = useTranslations("courses");
  const locale = useLocale();
  const router = useRouter();

  // Queries & Mutations
  const { data: optionsData, isLoading: isLoadingOptions } = useProviderLessonOptions();
  const {
    data: initialLesson,
    isLoading: isLoadingLesson,
    isError: isLessonError,
    error: lessonFetchError,
  } = useProviderLesson(initialLessonId);

  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Form State
  const [type, setType] = useState<LessonType>("videoAndText");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lectureVideoLink, setLectureVideoLink] = useState("");

  // Cover Image
  const [coverImage, setCoverImage] = useState<string>("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);

  // Standalone Academic Info
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [instructorId, setInstructorId] = useState("");

  // Course Dependent Info
  const [isGeneralLesson, setIsGeneralLesson] = useState<boolean>(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Venue & Publish Status
  const [venue, setVenue] = useState<CourseVenue>("hybrid");
  const [publishStatus, setPublishStatus] = useState<LessonPublishStatus>("published");
  const [scheduledPublishDate, setScheduledPublishDate] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Attachments
  const [hasPdfAttachments, setHasPdfAttachments] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<AttachmentItem[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [hasImageAttachments, setHasImageAttachments] = useState(false);
  const [imageFiles, setImageFiles] = useState<AttachmentItem[]>([]);

  // Deleted media IDs tracking (for update in backend Spatie MediaLibrary)
  const [deleteMediaIds, setDeleteMediaIds] = useState<number[]>([]);

  // Exam Linking State
  const [isLinkedToExam, setIsLinkedToExam] = useState(false);
  const [linkedExamId, setLinkedExamId] = useState("");
  const [isRequiredPassExam, setIsRequiredPassExam] = useState(false);

  // Top level submit error
  const [formError, setFormError] = useState<string | null>(null);

  // Available Exams mapped for ExamSelect (strictly filtered by academic criteria)
  const exams = optionsData?.exams;
  const availableExams: Exam[] = useMemo(() => {
    if (!exams) return [];
    return exams
      .filter((e) => {
        // Always include currently selected linked exam so it remains visible on edit
        if (linkedExamId && String(e.id) === String(linkedExamId)) {
          return true;
        }

        if (isGeneralLesson) {
          // Standalone lesson: must NOT belong to a course
          if (e.course_id) return false;
          if (grade && String(e.educational_stage_id) !== String(grade)) return false;
          if (subject && String(e.subject_id) !== String(subject)) return false;
          if (
            optionsData?.requires_instructor_selection &&
            instructorId &&
            String(e.instructor_id) !== String(instructorId)
          ) {
            return false;
          }
          return true;
        } else {
          // Course lesson: must belong to the chosen course
          if (!selectedCourseId) return false;
          return String(e.course_id) === String(selectedCourseId);
        }
      })
      .map((e) => ({
        id: String(e.id),
        title: e.title?.[locale] || e.title?.ar || e.title?.en || "",
        description: "",
        subject: String(e.subject_id),
        grade: String(e.educational_stage_id),
        teacherName: "",
        venue: "hybrid",
        category: "test",
        examType: e.course_id ? "course-dependent" : "independent",
        courseId: e.course_id ? String(e.course_id) : undefined,
        passingPercentage: e.passing_percentage,
        triesAllowed: 1,
        durationMinutes: 60,
        showModelAnswers: true,
        randomizeQuestionsOrder: false,
        randomizeMCQChoices: false,
        examSections: [],
        numberOfQuestions: 0,
        numberOfStudents: 0,
        successRate: 0,
        timesUsed: 0,
        createdAt: new Date().toISOString(),
      }));
  }, [
    exams,
    locale,
    linkedExamId,
    isGeneralLesson,
    grade,
    subject,
    instructorId,
    selectedCourseId,
    optionsData?.requires_instructor_selection,
  ]);

  // Set default academic dropdowns when options load (for new lesson)
  useEffect(() => {
    if (!initialLessonId && optionsData) {
      if (!grade && optionsData.educational_stages?.length > 0) {
        setGrade(String(optionsData.educational_stages[0].id));
      }
      if (!subject && optionsData.subjects?.length > 0) {
        setSubject(String(optionsData.subjects[0].id));
      }
      if (!instructorId && optionsData.instructors?.length > 0) {
        setInstructorId(String(optionsData.instructors[0].id));
      }
      if (!selectedCourseId && optionsData.courses?.length > 0) {
        const firstCourse = optionsData.courses[0];
        setSelectedCourseId(String(firstCourse.id));
        if (firstCourse.sections?.length > 0) {
          setSelectedSectionId(String(firstCourse.sections[0].id));
        }
      }
    }
  }, [optionsData, initialLessonId, grade, subject, instructorId, selectedCourseId]);

  // When selectedCourseId changes, adjust default selectedSectionId
  const courses = optionsData?.courses;
  const currentCourseSections = useMemo(() => {
    if (!selectedCourseId || !courses) return [];
    const course = courses.find((c) => String(c.id) === selectedCourseId);
    return course?.sections || [];
  }, [selectedCourseId, courses]);

  useEffect(() => {
    if (!isGeneralLesson && currentCourseSections.length > 0) {
      if (!currentCourseSections.some((s) => String(s.id) === selectedSectionId)) {
        setSelectedSectionId(String(currentCourseSections[0].id));
      }
    }
  }, [isGeneralLesson, currentCourseSections, selectedSectionId]);

  // Populate existing lesson on edit
  useEffect(() => {
    if (!initialLesson) return;

    const titleStr =
      typeof initialLesson.title === "string"
        ? initialLesson.title
        : locale === "ar"
          ? initialLesson.title?.ar || initialLesson.title?.en || ""
          : initialLesson.title?.en || initialLesson.title?.ar || "";

    const descStr =
      typeof initialLesson.description === "string"
        ? initialLesson.description
        : locale === "ar"
          ? initialLesson.description?.ar || initialLesson.description?.en || ""
          : initialLesson.description?.en || initialLesson.description?.ar || "";

    setTitle(titleStr);
    setDescription(descStr || "");
    setType(initialLesson.type === "text_only" ? "text" : "videoAndText");
    setLectureVideoLink(initialLesson.video_url || "");
    setCoverImage(initialLesson.cover_image || initialLesson.cover_image_url || "");
    setCoverImageFile(null);
    setRemoveCoverImage(false);

    const isStandalone = initialLesson.classification === "standalone";
    setIsGeneralLesson(isStandalone);

    if (initialLesson.course_id) {
      setSelectedCourseId(String(initialLesson.course_id));
    }
    if (initialLesson.course_section_id) {
      setSelectedSectionId(String(initialLesson.course_section_id));
    }

    if (initialLesson.educational_stage_id) {
      setGrade(String(initialLesson.educational_stage_id));
    }
    if (initialLesson.subject_id) {
      setSubject(String(initialLesson.subject_id));
    }
    if (initialLesson.instructor_id) {
      setInstructorId(String(initialLesson.instructor_id));
    }

    setVenue((initialLesson.delivery_mode as CourseVenue) || "hybrid");
    setPublishStatus((initialLesson.status as LessonPublishStatus) || "published");
    setIsActive(initialLesson.is_active ?? true);

    if (initialLesson.scheduled_publish_at) {
      setScheduledPublishDate(initialLesson.scheduled_publish_at.replace(" ", "T").slice(0, 16));
    }

    // Attachments
    setHasPdfAttachments(Boolean(initialLesson.has_pdf_attachments));
    if (initialLesson.pdf_attachments && initialLesson.pdf_attachments.length > 0) {
      setPdfFiles(
        initialLesson.pdf_attachments.map((p) => ({
          id: String(p.id),
          title: p.file_name || p.name || "PDF Document",
          fileUrl: p.url,
          fileType: "pdf",
          sizeInBytes: p.size,
          isExisting: true,
        })),
      );
    }

    setHasImageAttachments(Boolean(initialLesson.has_explanatory_images));
    if (initialLesson.explanatory_images && initialLesson.explanatory_images.length > 0) {
      setImageFiles(
        initialLesson.explanatory_images.map((img) => ({
          id: String(img.id),
          title: img.file_name || img.name || "Image",
          fileUrl: img.url,
          fileType: "image",
          sizeInBytes: img.size,
          isExisting: true,
        })),
      );
    }

    // Exam linking
    setIsLinkedToExam(Boolean(initialLesson.has_exam));
    setLinkedExamId(initialLesson.exam_id ? String(initialLesson.exam_id) : "");
    setIsRequiredPassExam(Boolean(initialLesson.requires_exam_pass_to_unlock_next_lesson));
  }, [initialLesson, locale]);

  // File handlers
  const handleAddPdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newPdf: AttachmentItem = {
        id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: "pdf",
        sizeInBytes: file.size,
        file,
      };
      setPdfFiles((prev) => [...prev, newPdf]);
      setPdfError(null);
    }
  };

  const handleRemovePdfFile = (id: string) => {
    const item = pdfFiles.find((p) => p.id === id);
    if (item?.isExisting && !isNaN(Number(item.id))) {
      setDeleteMediaIds((prev) => [...prev, Number(item.id)]);
    }
    setPdfFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newImg: AttachmentItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: "image",
        sizeInBytes: file.size,
        file,
      };
      setImageFiles((prev) => [...prev, newImg]);
    }
  };

  const handleRemoveImageFile = (id: string) => {
    const item = imageFiles.find((i) => i.id === id);
    if (item?.isExisting && !isNaN(Number(item.id))) {
      setDeleteMediaIds((prev) => [...prev, Number(item.id)]);
    }
    setImageFiles((prev) => prev.filter((i) => i.id !== id));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError(locale === "ar" ? "يرجى كتابة عنوان الدرس" : "Lesson title is required");
      return;
    }

    if (type === "videoAndText" && !lectureVideoLink.trim()) {
      setFormError(
        locale === "ar" ? "رابط فيديو المحاضرة مطلوب" : "Lecture video link is required",
      );
      return;
    }

    if (hasPdfAttachments && pdfFiles.length === 0) {
      setPdfError(tDialog("pdfRequiredError"));
      return;
    }

    if (!isGeneralLesson && (!selectedCourseId || !selectedSectionId)) {
      setFormError(
        locale === "ar"
          ? "يرجى اختيار الدورة والقسم للدرس التابع لدورة"
          : "Please select course and section for course-linked lesson",
      );
      return;
    }

    if (isGeneralLesson && publishStatus === "scheduled" && !scheduledPublishDate) {
      setFormError(
        locale === "ar"
          ? "يرجى تحديد تاريخ ووقت النشر المجدول"
          : "Please specify scheduled publish date and time",
      );
      return;
    }

    if (isLinkedToExam && !linkedExamId) {
      setFormError(
        locale === "ar"
          ? "يرجى اختيار الامتحان المرتبط بهذا الدرس أو إلغاء تفعيل ربط الامتحان"
          : "Please select an exam or disable the exam link toggle",
      );
      return;
    }

    try {
      const newPdfFiles = pdfFiles.map((p) => p.file).filter(Boolean) as File[];
      const newImageFiles = imageFiles.map((i) => i.file).filter(Boolean) as File[];

      let scheduledDateFormatted: string | undefined;
      if (isGeneralLesson && publishStatus === "scheduled" && scheduledPublishDate) {
        scheduledDateFormatted =
          scheduledPublishDate.replace("T", " ") +
          (scheduledPublishDate.length === 16 ? ":00" : "");
      }

      const hasExamFlag = Boolean(isLinkedToExam && linkedExamId);
      const examIdValue = hasExamFlag ? Number(linkedExamId) : null;
      const passToUnlockFlag = Boolean(hasExamFlag && isRequiredPassExam);

      if (initialLessonId) {
        // Update Lesson
        const updateData: UpdateLessonData = {
          classification: isGeneralLesson ? "standalone" : "course",
          type: type === "videoAndText" ? "video_and_text" : "text_only",
          title: { ar: title.trim(), en: title.trim() },
          description: description.trim()
            ? { ar: description.trim(), en: description.trim() }
            : undefined,
          video_url: type === "videoAndText" ? lectureVideoLink.trim() : undefined,
          status: isGeneralLesson ? publishStatus : "published",
          scheduled_publish_at: scheduledDateFormatted,
          is_active: isActive,
          has_pdf_attachments: hasPdfAttachments && pdfFiles.length > 0,
          has_explanatory_images: hasImageAttachments && imageFiles.length > 0,
          has_exam: hasExamFlag,
          exam_id: examIdValue,
          requires_exam_pass_to_unlock_next_lesson: passToUnlockFlag,
          cover_image: coverImageFile || undefined,
          remove_cover_image: removeCoverImage || undefined,
          pdf_files: newPdfFiles.length > 0 ? newPdfFiles : undefined,
          explanatory_images: newImageFiles.length > 0 ? newImageFiles : undefined,
          delete_media_ids: deleteMediaIds.length > 0 ? deleteMediaIds : undefined,
        };

        if (isGeneralLesson) {
          updateData.educational_stage_id =
            Number(grade) || (optionsData?.educational_stages[0]?.id ?? 1);
          updateData.subject_id = Number(subject) || (optionsData?.subjects[0]?.id ?? 1);
          updateData.delivery_mode = venue;
          if (optionsData?.requires_instructor_selection && instructorId) {
            updateData.instructor_id = Number(instructorId);
          }
        } else {
          updateData.course_id = Number(selectedCourseId);
          updateData.course_section_id = Number(selectedSectionId);
        }

        await updateMutation.mutateAsync({
          id: initialLessonId,
          data: updateData,
        });

        toast.success(locale === "ar" ? "تم تعديل الدرس بنجاح" : "Lesson updated successfully");
      } else {
        // Create Lesson
        const createData: StoreLessonData = {
          classification: isGeneralLesson ? "standalone" : "course",
          type: type === "videoAndText" ? "video_and_text" : "text_only",
          title: { ar: title.trim(), en: title.trim() },
          description: description.trim()
            ? { ar: description.trim(), en: description.trim() }
            : undefined,
          video_url: type === "videoAndText" ? lectureVideoLink.trim() : undefined,
          status: isGeneralLesson ? publishStatus : "published",
          scheduled_publish_at: scheduledDateFormatted,
          is_active: isActive,
          has_pdf_attachments: hasPdfAttachments && pdfFiles.length > 0,
          has_explanatory_images: hasImageAttachments && imageFiles.length > 0,
          has_exam: hasExamFlag,
          exam_id: examIdValue,
          requires_exam_pass_to_unlock_next_lesson: passToUnlockFlag,
          cover_image: coverImageFile || undefined,
          pdf_files: newPdfFiles,
          explanatory_images: newImageFiles,
        };

        if (isGeneralLesson) {
          createData.educational_stage_id =
            Number(grade) || (optionsData?.educational_stages[0]?.id ?? 1);
          createData.subject_id = Number(subject) || (optionsData?.subjects[0]?.id ?? 1);
          createData.delivery_mode = venue;
          if (optionsData?.requires_instructor_selection && instructorId) {
            createData.instructor_id = Number(instructorId);
          }
        } else {
          createData.course_id = Number(selectedCourseId);
          createData.course_section_id = Number(selectedSectionId);
        }

        await createMutation.mutateAsync(createData);

        toast.success(locale === "ar" ? "تم إنشاء الدرس بنجاح" : "Lesson created successfully");
      }

      router.push(`/${locale}/dashboard/lessons`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : locale === "ar"
            ? "حدث خطأ أثناء حفظ الدرس"
            : "An error occurred while saving the lesson";
      setFormError(msg);
      toast.error(msg);
    }
  };

  if (initialLessonId && isLoadingLesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-87.5 gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {locale === "ar" ? "جاري تحميل بيانات الدرس..." : "Loading lesson data..."}
        </p>
      </div>
    );
  }

  if (initialLessonId && isLessonError) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border bg-card text-center space-y-4">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">
          {locale === "ar" ? "تعذر تحميل الدرس" : "Failed to load lesson"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {lessonFetchError instanceof Error
            ? lessonFetchError.message
            : locale === "ar"
              ? "الدرس المطلوب غير موجود أو تم حذفه."
              : "The requested lesson was not found."}
        </p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/lessons`}>
            {locale === "ar" ? "العودة إلى قائمة الدروس" : "Back to Lessons"}
          </Link>
        </Button>
      </div>
    );
  }

  // Stages, subjects, instructors list mapped for selects
  const mappedStages = (optionsData?.educational_stages || []).map((s) => ({
    id: s.id,
    name:
      locale === "ar"
        ? s.name.ar || s.name.en || String(s.id)
        : s.name.en || s.name.ar || String(s.id),
  }));

  const mappedSubjects = (optionsData?.subjects || []).map((s) => ({
    id: s.id,
    name:
      locale === "ar"
        ? s.name.ar || s.name.en || String(s.id)
        : s.name.en || s.name.ar || String(s.id),
  }));

  const courseOptions = (optionsData?.courses || []).map((c) => ({
    value: String(c.id),
    label:
      locale === "ar"
        ? c.title.ar || c.title.en || String(c.id)
        : c.title.en || c.title.ar || String(c.id),
  }));

  const sectionOptions = currentCourseSections.map((s) => ({
    value: String(s.id),
    label:
      locale === "ar"
        ? s.title.ar || s.title.en || String(s.id)
        : s.title.en || s.title.ar || String(s.id),
  }));

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Row with Standard Round Back Button */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/lessons`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {initialLessonId ? t("editTitle") : t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {formError && (
        <div className="flex items-center gap-2 p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertCircle className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. LESSON TYPE */}
        <FormSectionCard
          title={tDialog("groups.type")}
          description={tDialog("groupDescriptions.type")}
          icon={Video}
          contentClassName="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("videoAndText")}
              className={cn(
                "p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-1.5",
                type === "videoAndText"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Video className="size-4 text-primary" />
                <span>{tDialog("typeOptions.videoAndText")}</span>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                {tDialog("typeOptions.videoAndTextDesc")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType("text")}
              className={cn(
                "p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-1.5",
                type === "text"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <FileText className="size-4 text-primary" />
                <span>{tDialog("typeOptions.text")}</span>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                {tDialog("typeOptions.textDesc")}
              </span>
            </button>
          </div>
        </FormSectionCard>

        {/* 2. MAIN INFORMATION */}
        <FormSectionCard
          title={tDialog("groups.mainInfo")}
          description={tDialog("groupDescriptions.mainInfo")}
          icon={BookOpen}
          contentClassName="space-y-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="standalone-les-title" className="text-sm font-medium text-foreground">
              {tDialog("lessonTitle")} <span className="text-destructive">*</span>
            </label>
            <Input
              id="standalone-les-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tDialog("lessonTitlePlaceholder")}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="standalone-les-desc" className="text-sm font-medium text-foreground">
              {tDialog("description")}
            </label>
            <FormMarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder={tDialog("descriptionPlaceholder")}
            />
          </div>
        </FormSectionCard>

        {/* 3. MEDIA (VIDEO & COVER) */}
        <FormSectionCard
          title={tDialog("groups.media")}
          description={tDialog("groupDescriptions.media")}
          icon={ImageIcon}
          contentClassName="space-y-4"
        >
          {type === "videoAndText" && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
              <label
                htmlFor="standalone-video-link"
                className="text-sm font-medium text-foreground"
              >
                {tDialog("lectureVideoLink")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="standalone-video-link"
                type="url"
                value={lectureVideoLink}
                onChange={(e) => setLectureVideoLink(e.target.value)}
                placeholder={tDialog("lectureVideoLinkPlaceholder")}
                required={type === "videoAndText"}
              />
            </div>
          )}

          <ImageUploadField
            id="standalone-cover-image"
            label={tDialog("coverImage")}
            labelIcon={<ImageIcon className="size-4 text-muted-foreground" />}
            value={coverImage}
            onChange={(dataUrl, file) => {
              setCoverImage(dataUrl);
              if (file) {
                setCoverImageFile(file);
                setRemoveCoverImage(false);
              }
            }}
            onClear={() => {
              setCoverImage("");
              setCoverImageFile(null);
              setRemoveCoverImage(true);
            }}
            aspectRatio="auto"
            prompt={tCourses("new.fields.coverImageDrag")}
            hint={tCourses("new.fields.coverImageNote")}
            changePrompt={tCourses("new.fields.coverImageDrag")}
            previewAlt="Lesson cover preview"
          />
        </FormSectionCard>

        {/* 4. ACADEMIC INFORMATION / COURSE LINK */}
        {isGeneralLesson ? (
          <FormSectionCard
            title={tDialog("groups.academic")}
            description={tDialog("groupDescriptions.academic")}
            icon={GraduationCap}
            contentClassName="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <GradeSelect
              id="academic-grade"
              value={grade}
              onValueChange={setGrade}
              label={tDialog("gradeLevel")}
              grades={mappedStages}
              disabled={isLoadingOptions}
            />

            <SubjectSelect
              id="academic-subject"
              value={subject}
              onValueChange={setSubject}
              label={tDialog("subject")}
              subjects={mappedSubjects}
              disabled={isLoadingOptions}
            />

            <TeacherSelect
              id="academic-teacher-select"
              value={instructorId}
              onValueChange={setInstructorId}
              label={tDialog("teacherName")}
              placeholder={tDialog("selectTeacher")}
              showIcon
              teachers={optionsData?.instructors || []}
              disabled={isLoadingOptions || optionsData?.requires_instructor_selection === false}
            />
          </FormSectionCard>
        ) : (
          <FormSectionCard
            title={locale === "ar" ? "بيانات الدورة والقسم" : "Course and Section Details"}
            description={
              locale === "ar"
                ? "حدد الدورة والقسم التابع لهما هذا الدرس"
                : "Select the parent course and section for this lesson"
            }
            icon={Layers}
            contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <ComboboxSelect
                id="course-select"
                label={locale === "ar" ? "الدورة التابع لها" : "Parent Course"}
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
                options={courseOptions}
                placeholder={locale === "ar" ? "اختر دورة..." : "Select a course..."}
                emptyLabel={locale === "ar" ? "لا توجد دورات" : "No courses found"}
                disabled={isLoadingOptions}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <ComboboxSelect
                id="section-select"
                label={locale === "ar" ? "القسم / الفصل" : "Section / Unit"}
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                options={sectionOptions}
                placeholder={locale === "ar" ? "اختر قسماً..." : "Select a section..."}
                emptyLabel={
                  locale === "ar" ? "لا توجد أقسام في هذه الدورة" : "No sections in this course"
                }
                disabled={isLoadingOptions || currentCourseSections.length === 0}
                required
              />
            </div>
          </FormSectionCard>
        )}

        {/* 5. ATTACHMENTS & EXAMS */}
        <FormSectionCard
          title={tDialog("groups.attachmentsAndExams")}
          description={tDialog("groupDescriptions.attachmentsAndExams")}
          icon={FileCheck}
          contentClassName="space-y-4"
        >
          {/* PDF Attachments */}
          <FormToggleSetting
            id="standalone-pdf-toggle"
            title={tDialog("hasPdfAttachments")}
            subtitle={tDialog("hasPdfAttachmentsSubtitle")}
            checked={hasPdfAttachments}
            onCheckedChange={(val) => {
              setHasPdfAttachments(val);
              if (!val) setPdfError(null);
            }}
          >
            {hasPdfAttachments && (
              <div className="space-y-3 pt-1">
                {pdfError && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{pdfError}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {tDialog("pdfFilesCount", { count: pdfFiles.length })}
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors">
                    <Upload className="size-3.5" />
                    <span>{tDialog("uploadPdf")}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleAddPdfFile}
                    />
                  </label>
                </div>
                {pdfFiles.length > 0 ? (
                  <div className="space-y-2">
                    {pdfFiles.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs"
                      >
                        <span className="font-medium truncate max-w-xs flex items-center gap-1.5">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          {pdf.title}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemovePdfFile(pdf.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-2 border border-dashed rounded-md">
                    {tDialog("noPdfFiles")}
                  </p>
                )}
              </div>
            )}
          </FormToggleSetting>

          {/* Image Attachments */}
          <FormToggleSetting
            id="standalone-img-toggle"
            title={tDialog("hasImageAttachments")}
            subtitle={tDialog("hasImageAttachmentsSubtitle")}
            checked={hasImageAttachments}
            onCheckedChange={setHasImageAttachments}
          >
            {hasImageAttachments && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {tDialog("explanatoryImagesCount", { count: imageFiles.length })}
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors">
                    <Upload className="size-3.5" />
                    <span>{tDialog("uploadImage")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddImageFile}
                    />
                  </label>
                </div>
                {imageFiles.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imageFiles.map((img) => (
                      <div
                        key={img.id}
                        className="relative group rounded-lg overflow-hidden border bg-muted/40 h-20 flex items-center justify-center"
                      >
                        <Image
                          src={img.fileUrl}
                          alt={img.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageFile(img.id)}
                          className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-2 border border-dashed rounded-md">
                    {tDialog("noExplanatoryImages")}
                  </p>
                )}
              </div>
            )}
          </FormToggleSetting>

          {/* Exam Linking Setting */}
          <FormToggleSetting
            id="standalone-exam-toggle"
            title={tDialog("isLinkedToExam")}
            subtitle={tDialog("isLinkedToExamSubtitle")}
            checked={isLinkedToExam}
            onCheckedChange={setIsLinkedToExam}
          >
            {isLinkedToExam && (
              <div className="space-y-3 pt-1">
                <ExamSelect
                  id="standalone-exam-select"
                  value={linkedExamId}
                  onValueChange={setLinkedExamId}
                  label={tDialog("selectExam")}
                  placeholder={tDialog("selectExam")}
                  required={isLinkedToExam}
                  exams={availableExams}
                  emptyLabel={
                    locale === "ar"
                      ? isGeneralLesson
                        ? "لا توجد امتحانات مستقلة مطابقة"
                        : "لا توجد امتحانات لهذه الدورة"
                      : "No matching exams"
                  }
                />

                {availableExams.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    {locale === "ar"
                      ? isGeneralLesson
                        ? "لا توجد امتحانات مستقلة متاحة تطابق المرحلة والمادة والمعلم المحدد. يمكنك إنشاء امتحان مستقل أولاً من قسم إدارة الامتحانات."
                        : "لا توجد امتحانات مرتبطة بهذه الدورة حتى الآن. يمكنك إنشاء امتحان للدورة من قسم إدارة الامتحانات."
                      : isGeneralLesson
                        ? "No standalone exams match the selected stage, subject and instructor. Please create an exam in the Exams section first."
                        : "No exams found for this course yet. Please create an exam for this course in the Exams section."}
                  </p>
                )}

                <FormToggleSetting
                  id="standalone-pass-exam-toggle"
                  title={tDialog("isRequiredPassExam")}
                  subtitle={tDialog("isRequiredPassExamSubtitle")}
                  checked={isRequiredPassExam}
                  onCheckedChange={setIsRequiredPassExam}
                  className="mt-2"
                />
              </div>
            )}
          </FormToggleSetting>

          {/* General vs Course Lesson Toggle */}
          <FormToggleSetting
            id="standalone-is-general-toggle"
            title={t("isGeneralLesson")}
            subtitle={t("isGeneralLessonSubtitle")}
            checked={isGeneralLesson}
            onCheckedChange={setIsGeneralLesson}
          >
            {isGeneralLesson && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                {/* Venue */}
                <FormRadioGroup
                  name="lesson-venue"
                  title={tDialog("venue")}
                  icon={MapPin}
                  value={venue}
                  onValueChange={(val) => setVenue(val as CourseVenue)}
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

                {/* Publish Status */}
                <div className="space-y-4 pt-2 border-t border-border/40">
                  <FormRadioGroup
                    name="lesson-publish-status"
                    title={tDialog("publishStatus")}
                    icon={Radio}
                    value={publishStatus}
                    onValueChange={(val) => setPublishStatus(val as LessonPublishStatus)}
                    gridClassName="sm:grid-cols-3"
                    options={[
                      {
                        id: "published",
                        label: tDialog("statusOptions.published"),
                        desc: tDialog("statusOptions.publishedDesc"),
                      },
                      {
                        id: "draft",
                        label: tDialog("statusOptions.draft"),
                        desc: tDialog("statusOptions.draftDesc"),
                      },
                      {
                        id: "scheduled",
                        label: tDialog("statusOptions.scheduled"),
                        desc: tDialog("statusOptions.scheduledDesc"),
                      },
                    ]}
                  />

                  {publishStatus === "scheduled" && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 pt-2">
                      <label
                        htmlFor="standalone-scheduled-date"
                        className="text-sm font-medium text-foreground flex items-center gap-1.5"
                      >
                        <Calendar className="size-4 text-primary" />
                        {tDialog("scheduledPublishDate")}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="standalone-scheduled-date"
                        type="datetime-local"
                        value={scheduledPublishDate}
                        onChange={(e) => setScheduledPublishDate(e.target.value)}
                        required={publishStatus === "scheduled"}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </FormToggleSetting>

          {/* Active Status Setting */}
          <FormToggleSetting
            id="standalone-is-active-toggle"
            title={locale === "ar" ? "تفعيل الدرس في المنصة" : "Activate Lesson on Platform"}
            subtitle={
              locale === "ar"
                ? "عند إلغاء التفعيل، يتم إخفاء الدرس عن جميع الطلاب حتى وإن كان منشوراً"
                : "When deactivated, the lesson is hidden from all students even if published"
            }
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </FormSectionCard>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button asChild variant="outline" type="button" disabled={isSubmitting}>
            <Link href={`/${locale}/dashboard/lessons`}>{tDialog("cancel")}</Link>
          </Button>
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{locale === "ar" ? "جاري الحفظ..." : "Saving..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>{initialLessonId ? tDialog("saveChanges") : tDialog("createLesson")}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
