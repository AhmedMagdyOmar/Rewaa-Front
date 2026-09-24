"use client";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useStudentStandaloneLessonDetail,
  useToggleStandaloneLessonCompletion,
} from "@/hooks/use-student-lesson";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  ImageIcon,
  Paperclip,
  User,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

interface StudentLessonDetailsClientProps {
  lessonId: string;
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

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StudentLessonDetailsClient({ lessonId }: StudentLessonDetailsClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.lessonsPage");

  // Query Backend for Standalone Lesson Details
  const { data: lesson, isLoading, isError, refetch } = useStudentStandaloneLessonDetail(lessonId);

  // Mutation for completion toggle
  const toggleMutation = useToggleStandaloneLessonCompletion(lessonId);

  const getLocalized = (val?: Record<string, string> | null, fallback = "") => {
    if (!val) return fallback;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || fallback;
  };

  const title = getLocalized(lesson?.title, `Lesson ${lesson?.position || lessonId}`);
  const description = getLocalized(lesson?.description, "");
  const subjectName = getLocalized(lesson?.subject?.name);
  const stageName = getLocalized(lesson?.educational_stage?.name);
  const subjectAndStageText = [subjectName, stageName].filter(Boolean).join(" • ");

  const isVideoLesson = lesson?.type === "video_and_text" || lesson?.type === "video";
  const embedUrl = lesson?.video_url ? getEmbedUrl(lesson.video_url) : null;
  const isDirectVideo =
    lesson?.video_url && !embedUrl && /\.(mp4|webm|ogg)$/i.test(lesson.video_url);

  const handleToggleCompletion = () => {
    if (!lesson) return;
    toggleMutation.mutate({
      id: lesson.id,
      isCompleted: !lesson.is_completed,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-6 w-1/3 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="p-8 bg-destructive/5 border border-destructive/20 rounded-2xl space-y-3">
          <p className="text-sm text-destructive font-medium">
            {t("error.loadFailed") || "Failed to load lesson details."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl text-xs"
            >
              {t("error.retry") || "Retry"}
            </Button>
            <Button asChild size="sm" className="rounded-xl text-xs">
              <Link href="/student-dashboard/lessons">
                {isAr ? (
                  <ArrowRight className="size-3.5 me-1" />
                ) : (
                  <ArrowLeft className="size-3.5 me-1" />
                )}
                <span>{t("viewDetails.backToLessons") || "Back to Lessons"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pdfAttachments = lesson.pdf_attachments || [];
  const explanatoryImages = lesson.explanatory_images || [];
  const linkedExam = lesson.exam;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-border/60">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Link href="/student-dashboard/lessons">
              {isAr ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              <span>{t("viewDetails.backToLessons") || "Back to Lessons"}</span>
            </Link>
          </Button>

          {/* Completion Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={toggleMutation.isPending}
              onClick={handleToggleCompletion}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors shadow-2xs select-none disabled:opacity-60 disabled:cursor-not-allowed",
                lesson.is_completed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted/70",
              )}
            >
              <div
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                  lesson.is_completed
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-muted-foreground/40 bg-background",
                )}
              >
                {lesson.is_completed && <CheckCircle2 className="size-3.5" />}
              </div>
              <span>
                {lesson.is_completed
                  ? t("card.completed") || "Completed"
                  : t("viewDetails.markAsCompleted") || "Mark as complete"}
              </span>
            </button>
          </div>
        </div>

        {/* Lesson Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge variant="outline" className="rounded-lg font-medium">
              {isVideoLesson ? (
                <Video className="size-3 me-1 text-primary" />
              ) : (
                <FileText className="size-3 me-1 text-primary" />
              )}
              {isVideoLesson ? t("card.videoText") : t("card.textOnly")}
            </Badge>

            {lesson.is_completed && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white rounded-lg">
                <CheckCircle2 className="size-3 me-1" />
                {t("card.completed") || "Completed"}
              </Badge>
            )}

            {subjectAndStageText && (
              <span className="text-muted-foreground flex items-center gap-1">
                <GraduationCap className="size-3.5" />
                {subjectAndStageText}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>

          {lesson.instructor?.full_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <User className="size-3.5 text-primary/70" />
              <span>{lesson.instructor.full_name}</span>
            </p>
          )}
        </div>

        {/* Video Player (If video exists) */}
        {isVideoLesson && lesson.video_url && (
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-md border border-border/40">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : isDirectVideo ? (
              <video
                src={lesson.video_url}
                controls
                className="w-full h-full"
                poster={lesson.cover_image || undefined}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white/80 space-y-3">
                <Video className="size-12 text-white/50" />
                <p className="text-sm font-medium">
                  {t("viewDetails.videoStreamLink") || "External Video Source"}
                </p>
                <Button asChild variant="outline" size="sm" className="rounded-xl text-white">
                  <a href={lesson.video_url} target="_blank" rel="noopener noreferrer">
                    {t("viewDetails.openVideoInNewTab") || "Open video in new tab"}
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Lesson Description and Attachments Tabs */}
        <DashboardCard className="p-6 rounded-2xl">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="content" className="rounded-lg text-xs gap-1.5 font-semibold">
                <FileText className="size-3.5" />
                <span>{t("viewDetails.tabs.overview") || "Lesson Content"}</span>
              </TabsTrigger>

              {pdfAttachments.length > 0 && (
                <TabsTrigger
                  value="attachments"
                  className="rounded-lg text-xs gap-1.5 font-semibold"
                >
                  <Paperclip className="size-3.5" />
                  <span>{t("viewDetails.tabs.resources") || "Attachments"}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
                    {pdfAttachments.length}
                  </span>
                </TabsTrigger>
              )}

              {explanatoryImages.length > 0 && (
                <TabsTrigger value="images" className="rounded-lg text-xs gap-1.5 font-semibold">
                  <ImageIcon className="size-3.5" />
                  <span>{t("viewDetails.tabs.images") || "Images"}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
                    {explanatoryImages.length}
                  </span>
                </TabsTrigger>
              )}

              {linkedExam && (
                <TabsTrigger value="exam" className="rounded-lg text-xs gap-1.5 font-semibold">
                  <FileSpreadsheet className="size-3.5 text-amber-600" />
                  <span>{t("viewDetails.tabs.exam") || "Lesson Exam"}</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 pt-2">
              {description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownViewer content={description} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {t("viewDetails.noDescription") || "No text content provided for this lesson."}
                </p>
              )}
            </TabsContent>

            {/* Attachments Tab */}
            {pdfAttachments.length > 0 && (
              <TabsContent value="attachments" className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pdfAttachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {file.name || file.file_name || "PDF Document"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.file_name || file.name}
                        >
                          <Download className="size-3.5 me-1" />
                          <span>{t("viewDetails.download") || "Download"}</span>
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* Images Tab */}
            {explanatoryImages.length > 0 && (
              <TabsContent value="images" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {explanatoryImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl border border-border/60 overflow-hidden bg-muted/20 aspect-4/3 flex items-center justify-center"
                    >
                      <Image
                        src={img.url}
                        alt={img.name || "Explanatory image"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1"
                      >
                        <Download className="size-4" />
                        <span>{t("viewDetails.viewFullImage") || "View full image"}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* Exam Tab */}
            {linkedExam && (
              <TabsContent value="exam" className="space-y-4 pt-2">
                <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">
                      {getLocalized(linkedExam.title, "Lesson Exam")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t("viewDetails.examRequirementText", {
                        percent: linkedExam.passing_percentage,
                      }) || `Passing score requirement: ${linkedExam.passing_percentage}%`}
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-xl text-xs gap-1.5 font-semibold">
                    <Link href={`/student-dashboard/exams/${linkedExam.id}`}>
                      <FileSpreadsheet className="size-3.5" />
                      <span>{t("viewDetails.takeExam") || "Take Exam"}</span>
                    </Link>
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DashboardCard>
      </div>
    </TooltipProvider>
  );
}
