"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/routing";
import type { AvailableCourse } from "@/types/api-contracts";
import { BookOpen, Calendar, Globe, Globe2, House, Tag, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";

interface StudentAvailableCourseCardProps {
  course: AvailableCourse;
  enrollHref?: string;
  isEnrolled?: boolean;
}

export function StudentAvailableCourseCard({
  course,
  enrollHref,
  isEnrolled = false,
}: StudentAvailableCourseCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tCourses = useTranslations("courses");
  const tStudent = useTranslations("studentDashboard.latestCourses");
  const [imageError, setImageError] = React.useState(false);

  // Resolve bilingual field by active locale
  const resolveText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const title = resolveText(course.title);
  const stageName = resolveText(course.educational_stage?.name);
  const subjectName = resolveText(course.subject?.name);

  // Pricing calculations
  const isFree = course.is_free || course.final_price === 0;
  const hasActiveDiscount =
    course.has_discount && course.is_discount_active && course.discount_percentage > 0;
  const currency = course.currency_code || "EGP";

  const formatPrice = (price: number) => {
    if (isFree || price === 0) {
      return tCourses("card.free");
    }
    return `${price.toLocaleString(isAr ? "ar-EG" : "en-US")} ${
      isAr ? (currency === "EGP" ? tCourses("card.egp") : currency) : currency
    }`;
  };

  // Format a date string for display
  const formatPublishedDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const showImage = Boolean(course.cover_image) && !imageError;
  const targetEnrollHref = enrollHref || `/student-dashboard/courses/${course.id}`;

  return (
    <div className="group flex flex-col bg-card rounded-xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      {/* Cover Image Container with Badge */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
        {showImage ? (
          <Image
            src={course.cover_image!}
            alt={title || "Course cover"}
            fill
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <BookOpen className="size-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />

        {/* Offer / Discount Badge on top-start */}
        {hasActiveDiscount && (
          <div className="absolute top-2.5 inset-s-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-xs backdrop-blur-xs bg-rose-500/90 text-white">
              <Tag className="size-3 shrink-0" />
              <span>{course.discount_percentage}%</span>
            </span>
          </div>
        )}

        {/* Free Badge if course is free and no discount */}
        {isFree && !hasActiveDiscount && (
          <div className="absolute top-2.5 inset-s-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-xs backdrop-blur-xs bg-emerald-500/90 text-white">
              {tCourses("card.free")}
            </span>
          </div>
        )}

        {/* Published Date Strip — bottom of image */}
        {course.published_at && (
          <div className="absolute bottom-0 inset-x-0 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-xs text-white">
            <Calendar className="h-3 w-3 shrink-0 opacity-80" />
            <span className="text-[10px] font-medium truncate">
              {formatPublishedDate(course.published_at)}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Course Title with Venue Icon */}
        <div className="flex items-start gap-1.5 mb-2 group-hover:text-primary transition-colors">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-1 shrink-0 cursor-default text-muted-foreground hover:text-primary transition-colors">
                  {course.delivery_mode === "online" ? (
                    <Globe className="h-4 w-4" />
                  ) : course.delivery_mode === "onsite" ? (
                    <House className="h-4 w-4" />
                  ) : (
                    <Globe2 className="h-4 w-4" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {course.delivery_mode === "hybrid"
                  ? tCourses("venue.hybrid")
                  : course.delivery_mode === "online"
                    ? tCourses("venue.online")
                    : tCourses("venue.onsite")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <h3 className="font-bold text-foreground line-clamp-2 text-base leading-snug">{title}</h3>
        </div>

        {/* Subject & Educational Stage */}
        {(subjectName || stageName) && (
          <div className="text-xs font-semibold text-primary/80 mb-1">
            {[subjectName, stageName].filter(Boolean).join(" / ")}
          </div>
        )}

        {/* Teacher Info */}
        {course.instructor?.full_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 truncate">
            <div className="relative size-5 rounded-full overflow-hidden bg-primary/10 border border-border/60 shrink-0 flex items-center justify-center">
              <User className="size-3 text-primary/70" />
            </div>
            <span className="font-medium truncate text-foreground/80">
              {course.instructor.full_name}
            </span>
          </div>
        )}

        {/* Info Row: Lessons count */}
        <div className="mt-auto pt-3 border-t border-border/40 flex flex-row gap-1 justify-between text-xs text-muted-foreground">
          <div className="flex flex-row gap-3">
            {/* Number of Lessons */}
            <div
              className="flex items-center gap-1.5 truncate"
              title={tCourses("card.lessons", { count: course.lessons_count })}
            >
              <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium">
                {tCourses("card.lessonsShort", { count: course.lessons_count })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Price Row (Student Mode style) */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-1">
          <Button
            asChild
            variant={isEnrolled ? "outline" : "default"}
            size="sm"
            className={
              isEnrolled
                ? "w-full font-bold text-sm py-3.5! cursor-pointer border border-primary! text-primary hover:text-primary"
                : "flex-1 font-bold text-sm py-3.5! cursor-pointer shadow-xs"
            }
          >
            <Link href={targetEnrollHref}>
              {isEnrolled ? tStudent("goToCourse") : tStudent("enrollNow")}
            </Link>
          </Button>
          {!isEnrolled && (
            <div className="font-bold text-sm sm:text-base text-foreground shrink-0 flex flex-col items-end">
              {hasActiveDiscount ? (
                <>
                  <span>{formatPrice(course.final_price)}</span>
                  <span className="text-xs text-muted-foreground line-through font-normal">
                    {formatPrice(course.base_price)}
                  </span>
                </>
              ) : (
                <span>{formatPrice(course.final_price)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
