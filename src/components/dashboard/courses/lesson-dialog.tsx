/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ExamSelect, MultiLessonSelect } from "@/components/ui/academic-selects";
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
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProviderLessonOptions, useProviderLessons } from "@/hooks/use-lessons";
import { cn } from "@/lib/utils";
import { CourseSection, Lesson, LessonAttachment, LessonType } from "@/types/course";
import { Exam } from "@/types/exam";
import {
  AlertCircle,
  BookOpen,
  FileCheck,
  FileQuestion,
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: CourseSection[];
  initialLesson?: Lesson | null;
  initialSectionId?: string;
  parentCourseContext: {
    courseId?: string;
    educationalStageId?: number | string;
    subjectId?: number | string;
    grade: string;
    subject: string;
    teacherName: string;
  };
  availableExams?: Exam[];
  hideLessonCategory?: boolean;
  isSectionLocked?: boolean;
  onSave: (sectionId: string, lesson: Lesson) => Promise<void> | void;
  onSaveMany?: (sectionId: string, lessons: Lesson[]) => Promise<void> | void;
  onOpenExamDialog?: (sectionId: string, lessonId?: string) => void;
}

export function LessonDialog({
  open,
  onOpenChange,
  sections,
  initialLesson,
  initialSectionId,
  parentCourseContext,
  availableExams: passedExams,
  hideLessonCategory: _hideLessonCategory = true,
  isSectionLocked = false,
  onSave,
  onSaveMany,
}: LessonDialogProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("courses.new.step2.addLessonDialog");
  const tCourses = useTranslations("courses");

  // Tab State: "create" | "bank"
  const [activeTab, setActiveTab] = useState<"create" | "bank">("create");

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  // Form State (Create New Lesson)
  const [targetSectionId, setTargetSectionId] = useState("");
  const [type, setType] = useState<LessonType>("videoAndText");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lectureVideoLink, setLectureVideoLink] = useState("");
  const [videoLinkError, setVideoLinkError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string>("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState<boolean>(false);

  // Attachments and Exams
  const [hasPdfAttachments, setHasPdfAttachments] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<LessonAttachment[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [hasImageAttachments, setHasImageAttachments] = useState(false);
  const [imageFiles, setImageFiles] = useState<LessonAttachment[]>([]);
  const [deleteMediaIds, setDeleteMediaIds] = useState<number[]>([]);

  const [isLinkedToExam, setIsLinkedToExam] = useState(false);
  const [linkedExamId, setLinkedExamId] = useState("");
  const [isRequiredPassExam, setIsRequiredPassExam] = useState(false);

  // Bank Form State
  const [bankSectionId, setBankSectionId] = useState("");
  const [selectedBankLessonIds, setSelectedBankLessonIds] = useState<string[]>([]);

  // Embedded Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examSelectedId, setExamSelectedId] = useState("");
  const [examIsReqPass, setExamIsReqPass] = useState(false);
  const [examTargetLessonId, setExamTargetLessonId] = useState<string | null>(null);

  const { data: optionsData } = useProviderLessonOptions();
  const { data: lessonsData } = useProviderLessons({
    per_page: 50,
    classification: "standalone",
    educational_stage_id: parentCourseContext.educationalStageId,
    subject_id: parentCourseContext.subjectId,
  });

  // Stored / Available exams & lessons bank
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [bankLessons, setBankLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (passedExams !== undefined) {
      setAvailableExams(passedExams);
      return;
    }

    if (optionsData?.exams) {
      const filtered = optionsData.exams.filter((e) => {
        if (
          parentCourseContext.educationalStageId &&
          e.educational_stage_id &&
          Number(e.educational_stage_id) !== Number(parentCourseContext.educationalStageId)
        ) {
          return false;
        }
        if (
          parentCourseContext.subjectId &&
          e.subject_id &&
          Number(e.subject_id) !== Number(parentCourseContext.subjectId)
        ) {
          return false;
        }
        if (
          parentCourseContext.grade &&
          e.educational_stage_id &&
          String(e.educational_stage_id) !== String(parentCourseContext.grade)
        ) {
          return false;
        }
        if (
          parentCourseContext.subject &&
          e.subject_id &&
          String(e.subject_id) !== String(parentCourseContext.subject)
        ) {
          return false;
        }
        return true;
      });

      setAvailableExams(
        filtered.map((e) => ({
          id: String(e.id),
          title: e.title?.[locale] || e.title?.ar || e.title?.en || "",
          description: "",
          subject: parentCourseContext.subject || "General",
          grade: parentCourseContext.grade || "General",
          teacherName: parentCourseContext.teacherName || "Teacher",
          category: "test",
          examType: e.course_id ? "course-dependent" : "independent",
          triesAllowed: 1,
          durationMinutes: 60,
          passingPercentage: e.passing_percentage,
          showModelAnswers: true,
          randomizeQuestionsOrder: false,
          randomizeMCQChoices: false,
          examSections: [],
          numberOfQuestions: 0,
          numberOfStudents: 0,
          successRate: 0,
          timesUsed: 0,
          createdAt: new Date().toISOString(),
        })),
      );
    } else {
      setAvailableExams([]);
    }
  }, [passedExams, optionsData, locale, parentCourseContext]);

  useEffect(() => {
    if (lessonsData?.lessons) {
      setBankLessons(
        lessonsData.lessons
          .filter((b) => {
            if (
              parentCourseContext.educationalStageId &&
              b.educational_stage_id &&
              Number(b.educational_stage_id) !== Number(parentCourseContext.educationalStageId)
            ) {
              return false;
            }
            if (
              parentCourseContext.subjectId &&
              b.subject_id &&
              Number(b.subject_id) !== Number(parentCourseContext.subjectId)
            ) {
              return false;
            }
            return true;
          })
          .map((b) => ({
            id: String(b.id),
            title: b.title?.[locale] || b.title?.ar || b.title?.en || "",
            description: b.description?.[locale] || b.description?.ar || "",
            writtenText: b.description?.[locale] || b.description?.ar || "",
            type: b.type === "text_only" ? "text" : "videoAndText",
            coverImage: b.cover_image || b.cover_image_url || undefined,
            lectureVideoLink: b.video_url || undefined,
            lessonCategory: b.classification === "standalone" ? "independent" : "course-dependent",
            educational_stage_id: b.educational_stage_id || undefined,
            subject_id: b.subject_id || undefined,
            hasPdfAttachments: Boolean(b.has_pdf_attachments),
            pdfFiles: (b.pdf_attachments || []).map((p) => ({
              id: String(p.id),
              title: p.name || "PDF",
              fileUrl: p.url,
              fileType: "pdf" as const,
              sizeInBytes: p.size,
            })),
            hasImageAttachments: Boolean(b.has_explanatory_images),
            imageFiles: (b.explanatory_images || []).map((img) => ({
              id: String(img.id),
              title: img.name || "Image",
              fileUrl: img.url,
              fileType: "image" as const,
              sizeInBytes: img.size,
            })),
            isLinkedToExam: Boolean(b.has_exam),
            linkedExamId: b.exam_id ? String(b.exam_id) : undefined,
            linkedExamTitle: b.exam?.title?.[locale] || b.exam?.title?.ar || undefined,
            isRequiredPassExam: Boolean(b.requires_exam_pass_to_unlock_next_lesson),
          })),
      );
    }
  }, [lessonsData, locale, parentCourseContext]);

  const handleSaveInternalExam = () => {
    if (!examSelectedId || !examTargetLessonId) return;
    const finalExamTitle = availableExams.find((e) => e.id === examSelectedId)?.title;

    setBankLessons((prev) =>
      prev.map((l) => {
        if (l.id === examTargetLessonId) {
          return {
            ...l,
            isLinkedToExam: true,
            linkedExamId: examSelectedId,
            linkedExamTitle: finalExamTitle,
            isRequiredPassExam: examIsReqPass,
          };
        }
        return l;
      }),
    );

    setIsExamModalOpen(false);
  };

  // Selected exams are cloned into the course on save, so linked exams stay selectable
  const selectableExams = availableExams;

  // Populate state on open / initialLesson change
  useEffect(() => {
    if (open) {
      setActiveTab("create");
      if (initialLesson) {
        const lessonVideo =
          initialLesson.lectureVideoLink || initialLesson.video_url || initialLesson.videoUrl || "";
        setType(initialLesson.type || (lessonVideo ? "videoAndText" : "text"));
        setTitle(initialLesson.title || "");
        setDescription(initialLesson.description || initialLesson.writtenText || "");
        setLectureVideoLink(lessonVideo);
        setCoverImage(
          initialLesson.coverImage ||
            initialLesson.cover_image ||
            initialLesson.cover_image_url ||
            "",
        );
        setCoverImageFile(initialLesson.coverImageFile || null);
        setRemoveCoverImage(Boolean(initialLesson.removeCoverImage));

        const hasPdfs = Boolean(
          initialLesson.hasPdfAttachments ||
          (initialLesson.pdfFiles && initialLesson.pdfFiles.length > 0),
        );
        setHasPdfAttachments(hasPdfs);
        setPdfFiles(
          (initialLesson.pdfFiles || []).map((p) => ({
            ...p,
            isExisting: p.isExisting ?? !p.rawFile,
          })),
        );

        const hasImgs = Boolean(
          initialLesson.hasImageAttachments ||
          (initialLesson.imageFiles && initialLesson.imageFiles.length > 0),
        );
        setHasImageAttachments(hasImgs);
        setImageFiles(
          (initialLesson.imageFiles || []).map((img) => ({
            ...img,
            isExisting: img.isExisting ?? !img.rawFile,
          })),
        );
        setDeleteMediaIds(initialLesson.deleteMediaIds || []);

        setIsLinkedToExam(Boolean(initialLesson.isLinkedToExam));
        setLinkedExamId(initialLesson.linkedExamId || "");
        setIsRequiredPassExam(Boolean(initialLesson.isRequiredPassExam));
        setVideoLinkError(null);

        setTargetSectionId(initialSectionId || sections[0]?.id || "");
      } else {
        // Reset to default
        setType("videoAndText");
        setTitle("");
        setDescription("");
        setLectureVideoLink("");
        setVideoLinkError(null);
        setCoverImage("");
        setCoverImageFile(null);
        setRemoveCoverImage(false);
        setHasPdfAttachments(false);
        setPdfFiles([]);
        setPdfError(null);
        setHasImageAttachments(false);
        setImageFiles([]);
        setDeleteMediaIds([]);
        setIsLinkedToExam(false);
        setLinkedExamId("");
        setIsRequiredPassExam(false);

        setTargetSectionId(initialSectionId || sections[0]?.id || "");
        setBankSectionId(initialSectionId || sections[0]?.id || "");
        setSelectedBankLessonIds([]);
      }
    }
  }, [open, initialLesson, initialSectionId, sections]);

  // Handle PDF upload simulation
  const handleAddPdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newPdf: LessonAttachment = {
        id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: "pdf",
        sizeInBytes: file.size,
        rawFile: file,
        isExisting: false,
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

  // Handle Image upload simulation
  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newImg: LessonAttachment = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: "image",
        sizeInBytes: file.size,
        rawFile: file,
        isExisting: false,
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

  // Save submit handler with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "bank") {
      if (selectedBankLessonIds.length === 0 || !bankSectionId) return;

      const lessonsToSave: Lesson[] = selectedBankLessonIds
        .map((bId) => {
          const found = bankLessons.find((l) => l.id === bId);
          if (!found) return null;
          return {
            ...found,
            id: `les-${Math.floor(1000 + Math.random() * 9000)}`,
            original_lesson_id: !Number.isNaN(Number(found.id)) ? Number(found.id) : undefined,
            lessonCategory: "course-dependent",
          } as Lesson;
        })
        .filter(Boolean) as Lesson[];

      try {
        setIsSubmittingBank(true);
        if (onSaveMany) {
          await onSaveMany(bankSectionId, lessonsToSave);
        } else {
          // Fallback (single-lesson callers): call onSave once per lesson
          for (const l of lessonsToSave) {
            await onSave(bankSectionId, l);
          }
        }
        onOpenChange(false);
      } catch {
        // Error handled in parent handler toast
      } finally {
        setIsSubmittingBank(false);
      }
      return;
    }

    if (!title.trim() || !targetSectionId) return;

    setVideoLinkError(null);
    if (type === "videoAndText" && !lectureVideoLink.trim()) {
      setVideoLinkError(
        locale === "ar" ? "رابط فيديو المحاضرة مطلوب" : "Lecture video link is required",
      );
      return;
    }

    // Validation: PDF files required if toggle is true
    if (hasPdfAttachments && pdfFiles.length === 0) {
      setPdfError(t("pdfRequiredError"));
      return;
    }

    const selectedExamObj = availableExams.find((e) => e.id === linkedExamId);
    const updatedLesson: Lesson = {
      id: initialLesson?.id || `les-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      title: title.trim(),
      description: description.trim(),
      writtenText: description.trim(),
      lectureVideoLink: type === "videoAndText" ? lectureVideoLink.trim() : undefined,
      coverImage: coverImage.trim() || undefined,
      coverImageFile: coverImageFile || undefined,
      removeCoverImage: removeCoverImage,

      // Auto-filled course info
      grade: parentCourseContext.grade,
      subject: parentCourseContext.subject,
      teacherName: parentCourseContext.teacherName,

      // Attachments & Exams
      hasPdfAttachments,
      pdfFiles: hasPdfAttachments ? pdfFiles : [],
      hasImageAttachments,
      imageFiles: hasImageAttachments ? imageFiles : [],
      deleteMediaIds: deleteMediaIds.length > 0 ? deleteMediaIds : undefined,
      isLinkedToExam,
      linkedExamId: isLinkedToExam ? linkedExamId : undefined,
      linkedExamTitle: isLinkedToExam && selectedExamObj ? selectedExamObj.title : undefined,
      isRequiredPassExam: isLinkedToExam ? isRequiredPassExam : false,

      // Organization
      lessonCategory: "course-dependent",
    };

    try {
      setIsSubmitting(true);
      await onSave(targetSectionId, updatedLesson);
      onOpenChange(false);
    } catch {
      // Error handled in parent handler toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableBankLessons = bankLessons.filter((l) => {
    // Exclude lessons already present in any section of this course
    const isAlreadyInSection = sections.some((s) =>
      s.lessons.some(
        (existing) => existing.title.trim().toLowerCase() === l.title.trim().toLowerCase(),
      ),
    );
    return !isAlreadyInSection;
  });

  const selectedBankLessonsList = bankLessons.filter((l) => selectedBankLessonIds.includes(l.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-primary" />
            {initialLesson ? t("editTitle") : t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>

          {!initialLesson && (
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "create" | "bank")}
              className="w-full mt-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">
                  {locale === "ar" ? "إنشاء درس جديد" : "Create New Lesson"}
                </TabsTrigger>
                <TabsTrigger value="bank">
                  {locale === "ar" ? "اختيار من بنك الدروس" : "Choose from Lessons Bank"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {activeTab === "bank" ? (
            <div className="space-y-5">
              {/* Linked Section Select */}
              <div className="flex flex-col gap-2 p-4 rounded-xl border bg-muted/20">
                <label htmlFor="bank-sec" className="text-sm font-semibold text-foreground">
                  {locale === "ar" ? "القسم المرتبط" : "Linked Section"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={bankSectionId}
                  onValueChange={setBankSectionId}
                  disabled={isSectionLocked}
                  required
                >
                  <SelectTrigger
                    id="bank-sec"
                    className={cn(
                      "w-full",
                      isSectionLocked && "opacity-75 cursor-not-allowed bg-muted",
                    )}
                  >
                    <SelectValue placeholder={t("selectSection")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Multi Lesson Select */}
              <div className="flex flex-col gap-2 p-4 rounded-xl border bg-muted/20">
                <MultiLessonSelect
                  value={selectedBankLessonIds}
                  onValueChange={setSelectedBankLessonIds}
                  label={locale === "ar" ? "اختر الدروس" : "Select Lessons"}
                  placeholder={locale === "ar" ? "اختر الدروس..." : "Select lessons..."}
                  lessons={availableBankLessons.map((l) => ({ id: l.id, title: l.title }))}
                  required
                />
              </div>

              {/* Chosen Lessons List View with Plus Button for Exam */}
              {selectedBankLessonsList.length > 0 && (
                <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                  <h4 className="text-sm font-bold text-foreground">
                    {locale === "ar" ? "الدروس المختارة" : "Chosen Lessons"} (
                    {selectedBankLessonsList.length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {selectedBankLessonsList.map((les) => (
                      <div
                        key={les.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <BookOpen className="size-4 text-primary shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {les.title}
                            </span>
                          </div>
                          {(les.isLinkedToExam || les.linkedExamTitle) && (
                            <div className="flex items-center gap-1.5 ms-6">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 font-semibold"
                              >
                                <FileQuestion className="size-3 text-amber-600" />
                                <span>
                                  {les.linkedExamTitle ||
                                    (locale === "ar" ? "امتحان مرتبط" : "Linked Exam")}
                                </span>
                              </Badge>
                            </div>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                className="h-7 w-7 rounded-full text-primary hover:bg-primary/10 shrink-0"
                                onClick={() => {
                                  setExamTargetLessonId(les.id);
                                  setIsExamModalOpen(true);
                                }}
                              >
                                <Plus className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {locale === "ar"
                                ? "إضافة امتحان لهذا الدرس"
                                : "Add exam to this lesson"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* GROUP 1: LESSON TYPE */}
              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Video className="size-4 text-primary" />
                  {t("groups.type")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("videoAndText")}
                    className={cn(
                      "p-3.5 rounded-lg border text-start transition-all cursor-pointer flex flex-col gap-1",
                      type === "videoAndText"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Video className="size-4 text-primary" />
                      <span>{t("typeOptions.videoAndText")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {t("typeOptions.videoAndTextDesc")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("text")}
                    className={cn(
                      "p-3.5 rounded-lg border text-start transition-all cursor-pointer flex flex-col gap-1",
                      type === "text"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <FileText className="size-4 text-primary" />
                      <span>{t("typeOptions.text")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {t("typeOptions.textDesc")}
                    </span>
                  </button>
                </div>
              </div>

              {/* GROUP 2: MAIN INFORMATION */}
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  {t("groups.mainInfo")}
                </h3>

                {/* Target Section Selection */}
                <div className="flex flex-col gap-2 pb-2 border-b border-border/40">
                  <label htmlFor="les-target-sec" className="text-sm font-semibold text-foreground">
                    {t("targetSection")} <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={targetSectionId}
                    onValueChange={setTargetSectionId}
                    disabled={isSectionLocked}
                    required={activeTab === "create"}
                  >
                    <SelectTrigger
                      id="les-target-sec"
                      className={cn(
                        "w-full",
                        isSectionLocked && "opacity-75 cursor-not-allowed bg-muted",
                      )}
                    >
                      <SelectValue placeholder={t("selectSection")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="les-title-input" className="text-sm font-medium text-foreground">
                    {t("lessonTitle")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="les-title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("lessonTitlePlaceholder")}
                    required={activeTab === "create"}
                  />
                </div>

                {/* Description (Markdown) */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="les-desc-input" className="text-sm font-medium text-foreground">
                    {t("description")}
                  </label>
                  <FormMarkdownEditor
                    value={description}
                    onChange={setDescription}
                    placeholder={t("descriptionPlaceholder")}
                  />
                </div>
              </div>

              {/* GROUP 3: VIDEO & COVER IMAGE */}
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" />
                  {t("groups.media")}
                </h3>

                {/* Video link if videoAndText */}
                {type === "videoAndText" && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                    <label htmlFor="les-video-link" className="text-sm font-medium text-foreground">
                      {t("lectureVideoLink")} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="les-video-link"
                      type="url"
                      value={lectureVideoLink}
                      onChange={(e) => {
                        setLectureVideoLink(e.target.value);
                        if (videoLinkError) setVideoLinkError(null);
                      }}
                      placeholder={t("lectureVideoLinkPlaceholder")}
                      required={type === "videoAndText"}
                    />
                    {videoLinkError && (
                      <p className="text-xs text-destructive font-medium animate-in fade-in">
                        {videoLinkError}
                      </p>
                    )}
                  </div>
                )}

                {/* Cover Image */}
                <ImageUploadField
                  id="les-cover-image"
                  label={t("coverImage")}
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
                  previewAlt="Cover preview"
                />
              </div>

              {/* GROUP 5: ATTACHMENTS AND EXAMS */}
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCheck className="size-4 text-primary" />
                  {t("groups.attachmentsAndExams")}
                </h3>

                {/* Toggle PDF Attachments */}
                <FormToggleSetting
                  id="les-pdf-toggle"
                  title={t("hasPdfAttachments")}
                  subtitle={t("hasPdfAttachmentsSubtitle")}
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
                          {t("pdfFilesCount", { count: pdfFiles.length })}
                        </span>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors">
                          <Upload className="size-3.5" />
                          <span>{t("uploadPdf")}</span>
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
                          {t("noPdfFiles")}
                        </p>
                      )}
                    </div>
                  )}
                </FormToggleSetting>

                {/* Toggle Image Attachments */}
                <FormToggleSetting
                  id="les-img-toggle"
                  title={t("hasImageAttachments")}
                  subtitle={t("hasImageAttachmentsSubtitle")}
                  checked={hasImageAttachments}
                  onCheckedChange={setHasImageAttachments}
                >
                  {hasImageAttachments && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {t("explanatoryImagesCount", { count: imageFiles.length })}
                        </span>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors">
                          <Upload className="size-3.5" />
                          <span>{t("uploadImage")}</span>
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
                          {t("noExplanatoryImages")}
                        </p>
                      )}
                    </div>
                  )}
                </FormToggleSetting>

                {/* Toggle Link to Exam */}
                <FormToggleSetting
                  id="les-exam-toggle"
                  title={t("isLinkedToExam")}
                  subtitle={t("isLinkedToExamSubtitle")}
                  checked={isLinkedToExam}
                  onCheckedChange={setIsLinkedToExam}
                >
                  {isLinkedToExam && (
                    <div className="space-y-3 pt-1">
                      <ExamSelect
                        id="les-exam-select"
                        value={linkedExamId}
                        onValueChange={setLinkedExamId}
                        label={t("selectExam")}
                        placeholder={t("selectExam")}
                        required={isLinkedToExam && activeTab === "create"}
                        exams={selectableExams}
                        emptyLabel={
                          availableExams.length === 0
                            ? locale === "ar"
                              ? "لا توجد امتحانات متاحة لنفس المرحلة والمادة"
                              : "No exams available for this stage and subject"
                            : locale === "ar"
                              ? "جميع الامتحانات المتاحة مستخدمة بالفعل"
                              : "All available exams are already linked"
                        }
                      />

                      {availableExams.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                          {locale === "ar"
                            ? "لا توجد امتحانات مخصصة لهذه المرحلة الدراسية والمادة حتى الآن. يمكنك إنشاء امتحان من قسم إدارة الامتحانات."
                            : "No exams found for this stage and subject yet. You can create an exam from the Exams section."}
                        </p>
                      ) : selectableExams.length === 0 && !linkedExamId ? (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                          {locale === "ar"
                            ? "جميع الامتحانات المتاحة مستخدمة بالفعل في أقسام أو دروس أخرى (لا يمكن ربط نفس الامتحان بأكثر من درس أو قسم)."
                            : "All available exams are already linked to other sections or lessons (an exam can only be linked once)."}
                        </p>
                      ) : null}

                      {/* Toggle Have to pass exam */}
                      <FormToggleSetting
                        id="les-pass-exam-toggle"
                        title={t("isRequiredPassExam")}
                        subtitle={t("isRequiredPassExamSubtitle")}
                        checked={isRequiredPassExam}
                        onCheckedChange={setIsRequiredPassExam}
                        className="mt-2"
                      />
                    </div>
                  )}
                </FormToggleSetting>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isSubmittingBank}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                activeTab === "bank"
                  ? selectedBankLessonIds.length === 0 || !bankSectionId || isSubmittingBank
                  : !title.trim() || !targetSectionId || isSubmitting
              }
              className="gap-2 font-semibold min-w-36"
            >
              {activeTab === "bank" ? (
                isSubmittingBank ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{isAr ? "جاري الإضافة..." : "Adding..."}</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    <span>
                      {isAr
                        ? `إضافة المحدد (${selectedBankLessonIds.length})`
                        : `Add Selected (${selectedBankLessonIds.length})`}
                    </span>
                  </>
                )
              ) : isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{isAr ? "جاري الحفظ..." : "Saving..."}</span>
                </>
              ) : (
                <span>{initialLesson ? t("saveChanges") : t("createLesson")}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* EMBEDDED EXAM DIALOG (Prevent parent unmount / form reset) */}
      <Dialog
        open={isExamModalOpen}
        onOpenChange={(openVal) => {
          setIsExamModalOpen(openVal);
          if (!openVal) {
            setExamSelectedId("");
            setExamIsReqPass(false);
            setExamTargetLessonId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tCourses("new.step2.addExamDialog.title")}</DialogTitle>
            <DialogDescription>{tCourses("new.step2.addExamDialog.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Exam Select */}
            <div className="flex flex-col gap-2">
              <ExamSelect
                value={examSelectedId}
                onValueChange={setExamSelectedId}
                label={locale === "ar" ? "اختر الامتحان" : "Select Exam"}
                placeholder={
                  t("selectExam") || (locale === "ar" ? "اختر الامتحان..." : "Select exam...")
                }
                required
                exams={selectableExams}
                emptyLabel={
                  availableExams.length === 0
                    ? locale === "ar"
                      ? "لا توجد امتحانات متاحة لنفس المرحلة والمادة"
                      : "No exams available for this stage and subject"
                    : locale === "ar"
                      ? "جميع الامتحانات المتاحة مستخدمة بالفعل"
                      : "All available exams are already linked"
                }
              />

              {availableExams.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  {locale === "ar"
                    ? "لا توجد امتحانات مخصصة لهذه المرحلة الدراسية والمادة حتى الآن. يمكنك إنشاء امتحان من قسم الامتحانات."
                    : "No exams found for this stage and subject yet. You can create an exam from the Exams section."}
                </p>
              ) : selectableExams.length === 0 && !examSelectedId ? (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                  {locale === "ar"
                    ? "جميع الامتحانات المتاحة مستخدمة بالفعل في أقسام أو دروس أخرى."
                    : "All available exams are already linked to other sections or lessons."}
                </p>
              ) : null}
            </div>

            {/* Passing Required */}
            <FormToggleSetting
              id="embed-exam-req-pass"
              title={tCourses("new.step2.addSectionDialog.isRequiredPassExam")}
              checked={examIsReqPass}
              onCheckedChange={setExamIsReqPass}
              className="bg-transparent border-0 p-0"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => setIsExamModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleSaveInternalExam} disabled={!examSelectedId}>
              {locale === "ar" ? "حفظ وتعيين" : "Save & Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
