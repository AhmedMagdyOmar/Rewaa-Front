"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import type { BackendStudentCourseDetails } from "@/types/api-contracts";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Globe,
  Globe2,
  House,
  Lock,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";

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
  const [imageError, setImageError] = React.useState(false);

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
              COLUMN 1: MAIN INFO & TABS (8 Cols on LG)
          ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Header Badges, Title & Teacher info */}
            <div className="space-y-4 bg-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs">
              {/* Badges for Grade, Subject & Venue */}
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
                {course.delivery_mode && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium text-muted-foreground px-2.5 py-1"
                  >
                    {tCourses(`venue.${course.delivery_mode}` as Parameters<typeof tCourses>[0])}
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
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-foreground">
                      <Lock className="size-4 text-primary mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{t("sectionsTab.previewNotice")}</p>
                    </div>

                    <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl space-y-2">
                      <div className="font-semibold text-foreground">
                        {course.sections_count > 0 || course.lessons_count > 0 ? (
                          <div className="flex items-center justify-center gap-4 text-sm">
                            <span>
                              {tCourses("details.totalSections", { count: course.sections_count })}
                            </span>
                            <span>•</span>
                            <span>
                              {tCourses("details.totalLessons", { count: course.lessons_count })}
                            </span>
                          </div>
                        ) : (
                          tCourses("details.noSections")
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("sectionsTab.lockedLesson")}
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────
              COLUMN 2: PURCHASE & COURSE CONTENTS SIDEBAR (4 Cols on LG)
          ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
            <div className="rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md overflow-hidden p-5 sm:p-6 space-y-6">
              {/* 1. Cover Image */}
              <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-xs flex items-center justify-center">
                {showCover ? (
                  <Image
                    src={course.cover_image!}
                    alt={title || "Course cover"}
                    fill
                    priority
                    unoptimized
                    onError={() => setImageError(true)}
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                    <BookOpen className="size-12 opacity-60" />
                  </div>
                )}
                {/* Venue Badge on top-end */}
                {course.delivery_mode && (
                  <div className="absolute top-3 inset-e-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-xs">
                      {course.delivery_mode === "online" ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : course.delivery_mode === "onsite" ? (
                        <House className="h-3.5 w-3.5" />
                      ) : (
                        <Globe2 className="h-3.5 w-3.5" />
                      )}
                      {tCourses(`venue.${course.delivery_mode}` as Parameters<typeof tCourses>[0])}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
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

              {/* 3. CTA Button: Full Width "Enroll in Course" */}
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

                  {/* Number of Sections */}
                  {course.sections_count > 0 && (
                    <li className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
                        <Clock className="size-4" />
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
    </TooltipProvider>
  );
}
