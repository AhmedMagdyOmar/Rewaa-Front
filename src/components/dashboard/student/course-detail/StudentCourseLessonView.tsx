"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import { BackendCourseContent, BackendStudentLessonDetail } from "@/types/api-contracts";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Lock,
  Paperclip,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

interface StudentCourseLessonViewProps {
  lesson: BackendStudentLessonDetail;
  content: BackendCourseContent;
  isCompleted: boolean;
  onToggleCompletion: (lessonId: number) => void;
  isTogglingCompletion?: boolean;
  onSelectLesson: (lessonId: number | null) => void;
  onNextLesson?: () => void;
  onPreviousLesson?: () => void;
  hasNextLesson?: boolean;
  hasPreviousLesson?: boolean;
  isNextLessonLocked?: boolean;
}

function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.includes("youtube.com/embed/")) return trimmed;
  if (trimmed.includes("youtube.com/watch")) {
    const videoId = trimmed.split("v=")[1]?.split("&")[0];
    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : trimmed.replace("watch?v=", "embed/");
  }
  if (trimmed.includes("youtu.be/")) {
    const videoId = trimmed.split("youtu.be/")[1]?.split("?")[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
  }
  if (trimmed.includes("vimeo.com/")) {
    const videoId = trimmed.split("vimeo.com/")[1]?.split("?")[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : trimmed;
  }
  return null;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function StudentCourseLessonView({
  lesson,
  content,
  isCompleted,
  onToggleCompletion,
  isTogglingCompletion,
  onSelectLesson,
  onNextLesson,
  onPreviousLesson,
  hasNextLesson,
  hasPreviousLesson,
  isNextLessonLocked,
}: StudentCourseLessonViewProps) {
  const t = useTranslations("studentDashboard.courseDetails");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const getLocalized = (val?: Record<string, string> | null, fallback = "") => {
    if (!val) return fallback;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || fallback;
  };

  const title = getLocalized(lesson.title, `Lesson ${lesson.position}`);
  const description = getLocalized(lesson.description);
  const isVideoLesson = Boolean(lesson.video_url);
  const embedUrl = getEmbedUrl(lesson.video_url);

  const pdfAttachments = lesson.pdf_attachments || [];
  const explanatoryImages = lesson.explanatory_images || [];
  const lessonExam = lesson.exam;

  // Check section exam if section has one
  const currentSection = content.sections?.find((s) => s.lessons?.some((l) => l.id === lesson.id));
  const sectionExam = currentSection?.exam;

  const hasLinkedExam = Boolean(lessonExam || sectionExam);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Top Header: Back to Overview & Completion Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onSelectLesson(null)}
              className="h-9 w-9 rounded-full shrink-0"
              title={t("backToCourses")}
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[11px] font-semibold">
                  {isVideoLesson ? t("itemTypes.video") : t("itemTypes.reading")}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1 text-[11px]">
                    <CheckCircle2 className="size-3" />
                    <span>{t("lesson.completed")}</span>
                  </Badge>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate mt-1 cursor-default">
                    {title}
                  </h1>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md text-xs">
                  {title}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Completion Checkbox */}
          <div className="flex items-center gap-3 self-end sm:self-center bg-muted/40 px-3.5 py-2 rounded-xl border border-border/60 shrink-0">
            <Checkbox
              id="lesson-completion-toggle"
              checked={isCompleted}
              disabled={isTogglingCompletion}
              onCheckedChange={() => onToggleCompletion(lesson.id)}
              className="size-4.5 rounded-lg data-checked:bg-emerald-600 data-checked:border-emerald-600"
            />
            <label
              htmlFor="lesson-completion-toggle"
              className="text-xs sm:text-sm font-bold text-foreground cursor-pointer select-none"
            >
              {t("lesson.completed")}
            </label>
          </div>
        </div>

        {/* Video Player (if video lesson) */}
        {isVideoLesson && (
          <div className="space-y-3">
            <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black/95 flex items-center justify-center border border-border/80 shadow-md">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6 space-y-3 text-white">
                  <Video className="size-12 mx-auto text-primary animate-pulse" />
                  <p className="text-sm font-medium">{title}</p>
                  {lesson.video_url && (
                    <a
                      href={lesson.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span>{t("overview.startFirstLesson")}</span>
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs: Description / Files / Images / Linked Exam */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs overflow-hidden">
          <Tabs defaultValue="description" className="w-full">
            {/* Tabs Header */}
            <div className="p-3 sm:p-4 border-b border-border/80 bg-muted/20">
              <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/80 gap-1 h-auto scrollbar-none">
                <TabsTrigger
                  value="description"
                  className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="size-4" />
                  <span>{t("lesson.description")}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="attachments"
                  className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Paperclip className="size-4" />
                  <span>{t("lesson.attachedFiles")}</span>
                  {pdfAttachments.length > 0 && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-background/60 font-semibold">
                      {pdfAttachments.length}
                    </span>
                  )}
                </TabsTrigger>

                {explanatoryImages.length > 0 && (
                  <TabsTrigger
                    value="images"
                    className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <ImageIcon className="size-4" />
                    <span>{locale === "ar" ? "الصور التوضيحية" : "Images"}</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-background/60 font-semibold">
                      {explanatoryImages.length}
                    </span>
                  </TabsTrigger>
                )}

                {hasLinkedExam && (
                  <TabsTrigger
                    value="exams"
                    className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileSpreadsheet className="size-4" />
                    <span>{t("lesson.linkedExam")}</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tabs Content */}
            <div className="p-4 sm:p-6">
              {/* Tab 1: Description */}
              <TabsContent
                value="description"
                className="space-y-4 mt-0 focus-visible:outline-hidden"
              >
                {description ? (
                  <div className="prose prose-sm sm:prose-base max-w-none text-foreground leading-relaxed">
                    <MarkdownViewer content={description} isRtl={isRtl} />
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                    {t("lesson.noMediaOrNotes")}
                  </p>
                )}
              </TabsContent>

              {/* Tab 2: Attachments */}
              <TabsContent
                value="attachments"
                className="space-y-4 mt-0 focus-visible:outline-hidden"
              >
                {pdfAttachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pdfAttachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold text-foreground wrap-break-word leading-snug">
                              {file.name || file.file_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {t("lesson.fileSize", {
                                size: formatFileSize(file.size),
                              })}
                            </div>
                          </div>
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs font-semibold shrink-0 mt-0.5"
                        >
                          <a href={file.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="size-3.5" />
                            <span>{t("lesson.downloadFile")}</span>
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                    {locale === "ar"
                      ? "لا توجد ملفات مرفقة لهذا الدرس."
                      : "No attachments available for this lesson."}
                  </p>
                )}
              </TabsContent>

              {/* Tab 3: Explanatory Images */}
              {explanatoryImages.length > 0 && (
                <TabsContent value="images" className="space-y-4 mt-0 focus-visible:outline-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {explanatoryImages.map((img) => (
                      <div
                        key={img.id}
                        className="group relative rounded-2xl overflow-hidden border border-border/80 bg-muted/30 flex flex-col"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black/5">
                          <Image
                            src={img.url}
                            alt={img.name || "Explanatory Image"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2 border-t border-border/60 bg-card">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {img.name || img.file_name}
                          </span>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg shrink-0"
                          >
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View full size"
                            >
                              <Download className="size-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Tab 4: Linked Exam */}
              {hasLinkedExam && (
                <TabsContent value="exams" className="space-y-4 mt-0 focus-visible:outline-hidden">
                  {lessonExam && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border text-foreground bg-amber-500/10 border-amber-500/30">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-3 rounded-xl shrink-0 bg-amber-500/20 text-amber-700">
                          <FileSpreadsheet className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-amber-700">
                            {t("lesson.linkedExam")}
                          </div>
                          <div className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate">
                            {getLocalized(lessonExam.title)}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {locale === "ar"
                              ? `درجة النجاح: ${lessonExam.passing_percentage}%`
                              : `Passing grade: ${lessonExam.passing_percentage}%`}
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shadow-xs shrink-0 self-end sm:self-center"
                      >
                        <Link href={`/student-dashboard/exams/${lessonExam.id}`}>
                          <span>{t("lesson.takeLinkedExam")}</span>
                          <FileCheck className="size-4 rtl:rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  )}

                  {sectionExam && (!lessonExam || sectionExam.id !== lessonExam.id) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border text-foreground bg-blue-500/10 border-blue-500/30">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-3 rounded-xl shrink-0 bg-blue-500/20 text-blue-700">
                          <FileSpreadsheet className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-blue-700">
                            {locale === "ar" ? "امتحان الفصل الشامل" : "Section Exam"}
                          </div>
                          <div className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate">
                            {getLocalized(sectionExam.title)}
                          </div>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-xs shrink-0 self-end sm:self-center"
                      >
                        <Link href={`/student-dashboard/exams/${sectionExam.id}`}>
                          <span>{t("lesson.takeLinkedExam")}</span>
                          <FileCheck className="size-4 rtl:rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        {/* Bottom Navigation (Previous / Next Lesson) */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPreviousLesson}
            disabled={!hasPreviousLesson}
            className="gap-2 font-semibold text-xs sm:text-sm rounded-xl py-5 shadow-xs"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            <span>{t("lesson.previousLesson")}</span>
          </Button>

          {isNextLessonLocked ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    type="button"
                    onClick={onNextLesson}
                    className="gap-2 font-semibold text-xs sm:text-sm rounded-xl py-5 shadow-xs bg-amber-600/90 hover:bg-amber-600 text-white"
                  >
                    <Lock className="size-3.5" />
                    <span>{t("lesson.nextLesson")}</span>
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {t("locked.tooltip")}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              onClick={onNextLesson}
              disabled={!hasNextLesson}
              className="gap-2 font-semibold text-xs sm:text-sm rounded-xl py-5 shadow-xs"
            >
              <span>{t("lesson.nextLesson")}</span>
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
