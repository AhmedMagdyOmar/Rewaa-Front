/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { GradeSelect, SubjectSelect, TeacherSelect } from "@/components/ui/academic-selects";
import { Button } from "@/components/ui/button";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { getStoredLessons, saveStoredLessons } from "@/lib/lessons-storage";
import { getStoredTeachers } from "@/lib/settings-storage";
import { cn } from "@/lib/utils";
import {
  CourseVenue,
  Lesson,
  LessonAttachment,
  LessonPublishStatus,
  LessonType,
} from "@/types/course";
import { Teacher } from "@/types/settings";
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
import { useEffect, useState } from "react";

interface NewLessonClientProps {
  initialLessonId?: string;
}

export function NewLessonClient({ initialLessonId }: NewLessonClientProps = {}) {
  const t = useTranslations("lessons.new");
  const tDialog = useTranslations("courses.new.step2.addLessonDialog");
  const tCourses = useTranslations("courses");
  const locale = useLocale();
  const router = useRouter();

  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const loadTeachers = () => {
      setAvailableTeachers(getStoredTeachers());
    };
    loadTeachers();
    window.addEventListener("rewaa_teachers_updated", loadTeachers);
    return () => window.removeEventListener("rewaa_teachers_updated", loadTeachers);
  }, []);

  // Form State
  const [type, setType] = useState<LessonType>("videoAndText");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lectureVideoLink, setLectureVideoLink] = useState("");
  const [coverImage, setCoverImage] = useState<string>("");

  // Academic info
  const [grade, setGrade] = useState("grade1");
  const [subject, setSubject] = useState("physics");
  const [teacherName, setTeacherName] = useState("");

  // Attachments
  const [hasPdfAttachments, setHasPdfAttachments] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<LessonAttachment[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [hasImageAttachments, setHasImageAttachments] = useState(false);
  const [imageFiles, setImageFiles] = useState<LessonAttachment[]>([]);

  // Is general lesson toggle & conditional Venue / Publish status
  const [isGeneralLesson, setIsGeneralLesson] = useState<boolean>(true);
  const [venue, setVenue] = useState<CourseVenue>("all");
  const [publishStatus, setPublishStatus] = useState<LessonPublishStatus>("published");
  const [scheduledPublishDate, setScheduledPublishDate] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch existing lesson data on mount
  useEffect(() => {
    if (initialLessonId) {
      const storedLessons = getStoredLessons(locale);
      const existing = storedLessons.find((l) => l.id === initialLessonId);
      if (existing) {
        setType(existing.type || (existing.lectureVideoLink ? "videoAndText" : "text"));
        setTitle(existing.title || "");
        setDescription(existing.description || existing.writtenText || "");
        setLectureVideoLink(existing.lectureVideoLink || "");
        setCoverImage(existing.coverImage || "");

        const isGeneral = existing.lessonCategory !== "course-dependent" && !existing.courseId;
        setIsGeneralLesson(isGeneral);

        setGrade(existing.grade || "grade1");
        setSubject(existing.subject || "physics");
        setTeacherName(existing.teacherName || "");
        setVenue(existing.venue || "all");

        const hasPdfs = Boolean(
          existing.hasPdfAttachments || (existing.pdfFiles && existing.pdfFiles.length > 0),
        );
        setHasPdfAttachments(hasPdfs);
        setPdfFiles(existing.pdfFiles || []);

        const hasImgs = Boolean(
          existing.hasImageAttachments || (existing.imageFiles && existing.imageFiles.length > 0),
        );
        setHasImageAttachments(hasImgs);
        setImageFiles(existing.imageFiles || []);

        setPublishStatus(existing.publishStatus || "published");
        setScheduledPublishDate(existing.scheduledPublishDate || "");
      }
    }
    setIsLoaded(true);
  }, [initialLessonId, locale]);

  // File upload handlers
  const handleAddPdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newPdf: LessonAttachment = {
        id: `pdf-${Date.now()}`,
        title: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: "pdf",
        sizeInBytes: file.size,
      };
      setPdfFiles((prev) => [...prev, newPdf]);
      setPdfError(null);
    }
  };

  const handleRemovePdfFile = (id: string) => {
    setPdfFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newImg: LessonAttachment = {
        id: `img-${Date.now()}`,
        title: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: "image",
        sizeInBytes: file.size,
      };
      setImageFiles((prev) => [...prev, newImg]);
    }
  };

  const handleRemoveImageFile = (id: string) => {
    setImageFiles((prev) => prev.filter((i) => i.id !== id));
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    if (hasPdfAttachments && pdfFiles.length === 0) {
      setPdfError(tDialog("pdfRequiredError"));
      return;
    }

    const currentLessons = getStoredLessons(locale);
    const existing = initialLessonId
      ? currentLessons.find((l) => l.id === initialLessonId)
      : undefined;
    const generatedId = initialLessonId || `les-standalone-${crypto.randomUUID()}`;

    const lessonData: Lesson = {
      ...existing,
      id: generatedId,
      type,
      title: title.trim(),
      description: description.trim(),
      writtenText: description.trim(),
      lectureVideoLink: type === "videoAndText" ? lectureVideoLink.trim() : undefined,
      coverImage: coverImage.trim() || undefined,

      lessonCategory: isGeneralLesson ? "independent" : "course-dependent",

      grade,
      subject,
      teacherName: teacherName.trim(),
      venue: isGeneralLesson ? venue : undefined,

      hasPdfAttachments,
      pdfFiles: hasPdfAttachments ? pdfFiles : [],
      hasImageAttachments,
      imageFiles: hasImageAttachments ? imageFiles : [],

      publishStatus: isGeneralLesson ? publishStatus : "published",
      scheduledPublishDate:
        isGeneralLesson && publishStatus === "scheduled" ? scheduledPublishDate : undefined,
    };

    let updatedLessons: Lesson[];
    if (initialLessonId) {
      updatedLessons = currentLessons.map((l) => (l.id === initialLessonId ? lessonData : l));
    } else {
      updatedLessons = [lessonData, ...currentLessons];
    }

    saveStoredLessons(locale, updatedLessons);
    router.push(`/${locale}/dashboard/lessons`);
  };

  if (!isLoaded) {
    return null;
  }

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
            onChange={(dataUrl) => setCoverImage(dataUrl)}
            onClear={() => setCoverImage("")}
            aspectRatio="auto"
            prompt={tCourses("new.fields.coverImageDrag")}
            hint={tCourses("new.fields.coverImageNote")}
            changePrompt={tCourses("new.fields.coverImageDrag")}
            previewAlt="Lesson cover preview"
          />
        </FormSectionCard>

        {/* 4. ACADEMIC INFORMATION */}
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
          />

          <SubjectSelect
            id="academic-subject"
            value={subject}
            onValueChange={setSubject}
            label={tDialog("subject")}
          />

          <TeacherSelect
            id="academic-teacher-select"
            value={teacherName}
            onValueChange={(val) => setTeacherName(val)}
            label={tDialog("teacherName")}
            placeholder={tDialog("selectTeacher")}
            showIcon
            teachers={availableTeachers}
          />
        </FormSectionCard>

        {/* 5. ATTACHMENTS & SETTINGS */}
        <FormSectionCard
          title={tDialog("groups.attachmentsAndExams")}
          description={tDialog("groupDescriptions.attachmentsAndExams")}
          icon={FileCheck}
          contentClassName="space-y-4"
        >
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
                      id: "center",
                      label: tCourses("new.venues.center.label"),
                      desc: tCourses("new.venues.center.desc"),
                    },
                    {
                      id: "all",
                      label: tCourses("new.venues.all.label"),
                      desc: tCourses("new.venues.all.desc"),
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
        </FormSectionCard>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button asChild variant="outline" type="button">
            <Link href={`/${locale}/dashboard/lessons`}>{tDialog("cancel")}</Link>
          </Button>
          <Button type="submit" className="gap-2">
            <CheckCircle2 className="size-4" />
            {initialLessonId ? tDialog("saveChanges") : tDialog("createLesson")}
          </Button>
        </div>
      </form>
    </div>
  );
}
