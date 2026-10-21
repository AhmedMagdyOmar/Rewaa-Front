"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomVideoPlayer } from "@/components/ui/custom-video-player";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import type { BackendStudentCourseDetails } from "@/types/api-contracts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  KeyRound,
  Lock,
  PlayCircle,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";
import { formatDurationDetail } from "@/lib/utils";
import { StudentRedeemCodeDialog } from "../courses/StudentRedeemCodeDialog";
import { myCoursesService } from "@/lib/api/my-courses-service";
import type { BackendStudentLessonDetail } from "@/types/api-contracts";

interface StudentCoursePreviewViewProps {
  course: BackendStudentCourseDetails;
  onEnroll: (courseId: number) => void;
  isEnrolling?: boolean;
}

export function StudentCoursePreviewView({
  course,
  onEnroll,
  isEnrolling = false,
}: StudentCoursePreviewViewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("studentDashboard.coursePreview");
  const tCourses = useTranslations("courses");
  const tRedeem = useTranslations("studentDashboard.activationCodeRedemption");
  const [redeemDialogOpen, setRedeemDialogOpen] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Free Preview Modal State
  const [previewLessonId, setPreviewLessonId] = React.useState<number | null>(null);
  const [previewLessonTitle, setPreviewLessonTitle] = React.useState<string>("");
  const [previewLessonDetail, setPreviewLessonDetail] =
    React.useState<BackendStudentLessonDetail | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);

  const handleOpenFreePreview = async (lessonId: number, lessonTitle: string) => {
    setPreviewLessonId(lessonId);
    setPreviewLessonTitle(lessonTitle);
    setPreviewLessonDetail(null);
    setIsPreviewLoading(true);

    try {
      const res = await myCoursesService.getLessonDetail(course.id, lessonId);
      setPreviewLessonDetail(res.lesson);
    } catch (err) {
      console.error("Failed to load free preview lesson:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Helper to extract bilingual record
  const resolveText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const title = resolveText(course.title);
  const description = resolveText(course.description);
  const stageName = resolveText(course.educational_stage?.name);
  const subjectName = resolveText(course.subject?.name);

  // Pricing & Discounts
  const isFree = course.is_free || course.final_price === 0;
  const originalPrice = course.base_price;
  const finalPrice = course.final_price;
  const hasDiscount = !isFree && finalPrice < originalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;
  const currency = course.currency_code || "EGP";

  const formatPrice = (price: number) => {
    if (isFree || price === 0) {
      return t("free");
    }
    const currencyStr = isRtl ? (currency === "EGP" ? tCourses("card.egp") : currency) : currency;
    return `${price.toLocaleString(isRtl ? "ar-EG" : "en-US")} ${currencyStr}`;
  };

  const showCover = Boolean(course.cover_image) && !imageError;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full space-y-6">
        {/* Header Back Button Row */}
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href="/student-dashboard/courses/explore">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <span className="text-sm font-medium text-muted-foreground">{t("backToExplore")}</span>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ────────────────────────────────────────────────────────────────────────
              COLUMN 1: MAIN INFO & TABS (7 Cols on LG)
          ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Header Badges, Title & Teacher info */}
            <div className="space-y-4 bg-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs">
              {/* Badges for Grade, Subject */}
              <div className="flex flex-wrap items-center gap-2">
                {stageName && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs px-3 py-1">
                    {stageName}
                  </Badge>
                )}
                {subjectName && (
                  <Badge
                    variant="outline"
                    className="bg-muted/60 text-foreground border-border/80 text-xs font-semibold px-3 py-1"
                  >
                    {subjectName}
                  </Badge>
                )}
              </div>

              {/* Course Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {title}
              </h1>

              {/* Teacher Info */}
              {course.instructor?.full_name && (
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 rounded-full overflow-hidden bg-primary/10 border border-border shrink-0 flex items-center justify-center">
                      <User className="size-5 text-primary/70" />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {tCourses("details.teacher")}
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {course.instructor.full_name}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Tabbed Content Container */}
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs overflow-hidden">
              <Tabs defaultValue="description" className="w-full">
                {/* Tabs List */}
                <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20">
                  <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/80 gap-1 h-auto scrollbar-none">
                    <TabsTrigger
                      value="description"
                      className="gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <FileText className="size-4" />
                      <span>{t("tabs.description")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="sections"
                      className="gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <BookOpen className="size-4" />
                      <span>{t("tabs.sections")}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 sm:p-8">
                  {/* TAB 1: MARKDOWN DESCRIPTION */}
                  <TabsContent
                    value="description"
                    className="space-y-4 mt-0 focus-visible:outline-hidden"
                  >
                    <div className="prose prose-sm sm:prose-base max-w-none">
                      {description ? (
                        <MarkdownViewer content={description} isRtl={isRtl} />
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-xl">
                          {t("descriptionTab.noDescription")}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 2: SECTIONS & CONTENT PREVIEW NOTICE */}
                  <TabsContent
                    value="sections"
                    className="space-y-4 mt-0 focus-visible:outline-hidden"
                  >
                    {/* Header Summary */}
                    <div className="p-4 sm:p-5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between flex-wrap gap-3">
                      <div className="font-semibold text-foreground text-sm flex items-center gap-3 flex-wrap">
                        <span>
                          {tCourses("details.totalSections", { count: course.sections_count })}
                        </span>
                        <span>•</span>
                        <span>
                          {tCourses("details.totalLessons", { count: course.lessons_count })}
                        </span>
                        {Boolean(course.duration_in_minutes && course.duration_in_minutes > 0) && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1.5 text-primary">
                              <Clock className="size-3.5" />
                              <span>
                                {formatDurationDetail(course.duration_in_minutes, locale)}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("sectionsTab.previewNotice")}
                      </p>
                    </div>

                    {/* Accordion List */}
                    {course.sections && course.sections.length > 0 ? (
                      <Accordion
                        type="multiple"
                        defaultValue={course.sections.map((s) => `section-${s.id}`)}
                        className="space-y-3"
                      >
                        {course.sections.map((section, idx) => {
                          const sectionTitle = resolveText(section.title) || `الفصل ${idx + 1}`;
                          return (
                            <AccordionItem
                              key={section.id}
                              value={`section-${section.id}`}
                              className="border border-border/80 rounded-xl overflow-hidden bg-card/60 shadow-xs px-3 sm:px-4"
                            >
                              <AccordionTrigger className="py-3 hover:no-underline">
                                <div className="flex items-center gap-2.5 text-start font-bold text-sm sm:text-base">
                                  <BookOpen className="size-4 text-primary shrink-0" />
                                  <span>{sectionTitle}</span>
                                  <span className="text-xs font-normal text-muted-foreground">
                                    ({section.lessons?.length || 0} {isRtl ? "دروس" : "lessons"})
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-1 pb-3 space-y-2 border-t border-border/40">
                                {section.lessons && section.lessons.length > 0 ? (
                                  section.lessons.map((lesson) => {
                                    const lessonTitle = resolveText(lesson.title);
                                    const isFreeLesson = Boolean(lesson.is_free);

                                    return (
                                      <div
                                        key={lesson.id}
                                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-colors ${
                                          isFreeLesson
                                            ? "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                                            : "bg-muted/20 border-border/40 opacity-80"
                                        }`}
                                        onClick={() => {
                                          if (isFreeLesson) {
                                            handleOpenFreePreview(lesson.id, lessonTitle);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          {isFreeLesson ? (
                                            <PlayCircle className="size-4 text-emerald-600 shrink-0" />
                                          ) : (
                                            <Lock className="size-4 text-muted-foreground shrink-0" />
                                          )}
                                          <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                            {lessonTitle}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {Boolean(lesson.duration_in_minutes) && (
                                            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-flex items-center gap-1">
                                              <Clock className="size-3" />
                                              {lesson.duration_in_minutes} {isRtl ? "دقيقة" : "min"}
                                            </span>
                                          )}

                                          {isFreeLesson ? (
                                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold gap-1 py-0.5">
                                              <Sparkles className="size-3" />
                                              <span>{t("sectionsTab.freePreview")}</span>
                                            </Badge>
                                          ) : (
                                            <span className="text-[11px] text-muted-foreground font-medium">
                                              {t("sectionsTab.lockedLesson")}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                                    {tCourses("details.noLessons")}
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl space-y-2">
                        <p>{tCourses("details.noSections")}</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────
              COLUMN 2: PURCHASE & COURSE CONTENTS SIDEBAR (5 Cols on LG)
          ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
            <div className="rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md overflow-hidden p-5 sm:p-6 space-y-6">
              {/* 1. Video Preview or Cover Image */}
              <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-xs flex items-center justify-center">
                {course.intro_video_url ? (
                  <CustomVideoPlayer
                    url={course.intro_video_url}
                    title={title || "Course Intro Video"}
                    poster={course.cover_image || undefined}
                  />
                ) : showCover ? (
                  <>
                    <Image
                      src={course.cover_image!}
                      alt={title || "Course cover"}
                      fill
                      priority
                      unoptimized
                      onError={() => setImageError(true)}
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                    <BookOpen className="size-12 opacity-60" />
                  </div>
                )}
              </div>

              {/* 2. Cost & Active Offers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    {hasDiscount ? (
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                          {formatPrice(finalPrice)}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground line-through decoration-destructive/70 decoration-2">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                        {formatPrice(finalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Offer badge at the other end */}
                  {hasDiscount && discountPercentage > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2.5 py-1 gap-1 shadow-xs animate-pulse">
                      <Tag className="size-3" />
                      <span>{discountPercentage}%</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* 3. CTA Button: Full Width "Enroll in Course", "Complete Payment", or "Under Review" */}
              {course.has_pending_order ? (
                <Button
                  type="button"
                  size="lg"
                  disabled
                  className="w-full font-bold text-base py-6 rounded-xl shadow-md gap-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-not-allowed opacity-90"
                >
                  <Clock className="size-5 shrink-0 animate-pulse text-amber-500" />
                  <span>
                    {locale === "ar" ? "طلب الاشتراك قيد المراجعة" : "Enrollment Under Review"}
                  </span>
                </Button>
              ) : course.has_unpaid_order ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => onEnroll(course.id)}
                  disabled={isEnrolling}
                  className="w-full font-bold text-base py-6 rounded-xl shadow-md cursor-pointer gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Sparkles className="size-4.5 fill-current" />
                  <span>{isEnrolling ? t("enrolling") : t("completePayment")}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => onEnroll(course.id)}
                  disabled={isEnrolling}
                  className="w-full font-bold text-base py-6 rounded-xl shadow-md cursor-pointer gap-2"
                >
                  <Sparkles className="size-4.5 fill-current" />
                  <span>{isEnrolling ? t("enrolling") : t("enrollInCourse")}</span>
                </Button>
              )}

              {/* Activation Code Prompt */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setRedeemDialogOpen(true)}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-muted/50"
                >
                  <KeyRound className="size-4 sm:size-5 text-primary" />
                  <span>{tRedeem("haveCodePrompt")}</span>
                  <span className="text-primary underline font-bold">{tRedeem("redeemHere")}</span>
                </button>
              </div>

              <StudentRedeemCodeDialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen} />

              {/* 4. "Course Contents" Feature List */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("courseContents")}
                </h3>

                <ul className="space-y-3 text-xs sm:text-sm text-foreground">
                  {/* Number of Lessons */}
                  {course.lessons_count > 0 && (
                    <li className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <span className="font-medium">
                        {tCourses("card.lessons", { count: course.lessons_count })}
                      </span>
                    </li>
                  )}

                  {/* Total Duration */}
                  {typeof course.duration_in_minutes === "number" &&
                    course.duration_in_minutes > 0 && (
                      <li className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                          <Clock className="size-4" />
                        </div>
                        <span className="font-medium">
                          {formatDurationDetail(course.duration_in_minutes, locale)}
                        </span>
                      </li>
                    )}

                  {/* Number of Sections */}
                  {course.sections_count > 0 && (
                    <li className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <span className="font-medium">
                        {tCourses("details.totalSections", { count: course.sections_count })}
                      </span>
                    </li>
                  )}

                  {/* Duration of permitted access */}
                  <li className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <span className="font-medium">
                      {course.has_limited_access && course.access_duration_days
                        ? t("accessDuration", { days: course.access_duration_days })
                        : t("unlimitedAccess")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Preview Video & Content Modal */}
      <Dialog
        open={previewLessonId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewLessonId(null);
            setPreviewLessonDetail(null);
          }
        }}
      >
        <DialogContent className="md:min-w-3xl max-w-5xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white text-xs gap-1">
                <Sparkles className="size-3" />
                <span>{t("sectionsTab.freePreview")}</span>
              </Badge>
              <DialogTitle className="text-base sm:text-lg font-bold">
                {previewLessonTitle}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {isPreviewLoading ? (
              <div className="aspect-video w-full rounded-xl bg-muted/60 flex items-center justify-center animate-pulse">
                <span className="text-xs text-muted-foreground">
                  {isRtl ? "جاري تحميل الدرس..." : "Loading preview..."}
                </span>
              </div>
            ) : previewLessonDetail?.video_url ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-border/60">
                <CustomVideoPlayer
                  url={previewLessonDetail.video_url}
                  poster={previewLessonDetail.cover_image || course.cover_image || undefined}
                />
              </div>
            ) : previewLessonDetail ? (
              <div className="p-8 text-center bg-muted/20 border border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? "هذا درس قراءة بدون فيديو."
                    : "This is a reading lesson without a video."}
                </p>
              </div>
            ) : null}

            {previewLessonDetail?.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {isRtl ? "وصف الدرس" : "Lesson Overview"}
                </h4>
                <div className="prose prose-sm max-w-none text-foreground text-xs sm:text-sm">
                  <MarkdownViewer
                    content={resolveText(previewLessonDetail.description)}
                    isRtl={isRtl}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
