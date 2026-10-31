"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { formatDuration } from "@/lib/utils";
import type { AvailableCourse } from "@/types/api-contracts";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Calculator,
  Clock,
  Dna,
  FlaskConical,
  Languages,
  Tag,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";

export function renderSubjectIcon(subjectName: string, className = "size-3.5"): React.ReactNode {
  if (subjectName.includes("فيزياء")) return <Atom className={className} />;
  if (subjectName.includes("كيمياء")) return <FlaskConical className={className} />;
  if (subjectName.includes("أحياء") || subjectName.includes("علوم"))
    return <Dna className={className} />;
  if (
    subjectName.includes("رياضيات") ||
    subjectName.includes("تفاضل") ||
    subjectName.includes("جبر")
  )
    return <Calculator className={className} />;
  if (
    subjectName.includes("إنجليزي") ||
    subjectName.includes("فرنسي") ||
    subjectName.includes("لغات")
  )
    return <Languages className={className} />;
  return <BookOpen className={className} />;
}

interface StudentAvailableCourseCardProps {
  course: AvailableCourse;
  enrollHref?: string;
  isEnrolled?: boolean;
  hasPendingOrder?: boolean;
}

export function StudentAvailableCourseCard({
  course,
  enrollHref,
  isEnrolled = false,
  hasPendingOrder = false,
}: StudentAvailableCourseCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tCourses = useTranslations("courses");
  const tStudent = useTranslations("studentDashboard.latestCourses");
  const [imageError, setImageError] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(false);

  // Resolve bilingual field by active locale
  const resolveText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const title = resolveText(course.title);
  const description = resolveText(course.description);
  const stageName = resolveText(course.educational_stage?.name);
  const subjectName = resolveText(course.subject?.name);

  // Category / Feature Type
  const categoryLabel =
    course.category_label || (course.category ? resolveText(course.category) : "");

  // Pricing calculations
  const isFree = course.is_free || course.final_price === 0;
  const hasActiveDiscount =
    course.has_discount && course.is_discount_active && course.discount_percentage > 0;
  const currency = course.currency_code || "EGP";

  const showImage = Boolean(course.cover_image) && !imageError;
  const targetHref = enrollHref || `/student-dashboard/courses/${course.id}`;

  // Teacher initials
  const instructorName = course.instructor?.full_name || "";
  const nameParts = instructorName.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
      : instructorName.slice(0, 2);

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border/70 shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden text-right h-full">
      {/* ────────────────────────────────────────────────────────────────────────
          Top Half: Cover Image & Floating Badges (Landing style)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="group flex flex-col bg-card rounded-xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
        <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
          {showImage ? (
            <Image
              src={course.cover_image!}
              alt={title || "Course cover"}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-95"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50 w-full h-full">
              <BookOpen className="size-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />

          {/* Badges Overlay (Subject + Category/Discount on start, Subject icon on end) */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {subjectName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-bold shadow-xs">
                  {subjectName}
                </span>
              )}
              {stageName && !subjectName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-bold shadow-xs">
                  {stageName}
                </span>
              )}
              {categoryLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400/90 dark:bg-amber-500/90 backdrop-blur-md text-[#4A3900] dark:text-slate-950 text-[11px] font-extrabold shadow-xs">
                  {categoryLabel}
                </span>
              )}
              {hasActiveDiscount && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/90 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs">
                  <Tag className="size-3 shrink-0" />
                  <span>{course.discount_percentage}%</span>
                </span>
              )}
            </div>

            <div className="size-7 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
              {renderSubjectIcon(subjectName || title)}
            </div>
          </div>

          {/* Duration or Lessons Pill (Bottom-start) */}
          {(Boolean(course.duration_in_minutes && course.duration_in_minutes > 0) ||
            course.lessons_count > 0) && (
            <div className="absolute bottom-2.5 inset-s-2.5 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium shadow-xs">
                {course.duration_in_minutes && course.duration_in_minutes > 0 ? (
                  <>
                    <Clock className="size-3 text-amber-400" />
                    <span>{formatDuration(course.duration_in_minutes, locale)}</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="size-3 text-amber-400" />
                    <span>{tCourses("card.lessonsShort", { count: course.lessons_count })}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Title & Stage / Description */}
        <div className="p-4 pb-3">
          <Link href={targetHref}>
            <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug mb-1.5 cursor-pointer">
              {title}
            </h3>
          </Link>
          {stageName && subjectName && (
            <p className="text-xs text-primary/80 font-medium mb-1">{stageName}</p>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Card Footer: Teacher Avatar & Price + Action CTA Button
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 pt-0 mt-auto">
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
          {/* Teacher Avatar & Name */}
          {course.instructor?.full_name ? (
            <Link
              href={`/student-dashboard/teachers/${course.instructor.id}`}
              className="flex items-center gap-2.5 min-w-0 group/teacher"
            >
              <div className="relative size-8 rounded-full overflow-hidden bg-primary/10 border border-border/60 shrink-0 flex items-center justify-center">
                {course.instructor.avatar && !avatarError ? (
                  <Image
                    src={course.instructor.avatar}
                    alt={course.instructor.full_name}
                    fill
                    unoptimized
                    onError={() => setAvatarError(true)}
                    className="object-cover group-hover/teacher:scale-105 transition-transform duration-300"
                  />
                ) : initials ? (
                  <span className="text-xs font-bold text-primary">{initials}</span>
                ) : (
                  <User className="size-4 text-primary/70" />
                )}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-xs font-bold text-foreground truncate group-hover/teacher:text-primary transition-colors">
                  {course.instructor.full_name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {subjectName || tCourses("card.teacher")}
                </p>
              </div>
            </Link>
          ) : (
            <div className="text-xs text-muted-foreground">{subjectName}</div>
          )}

          {/* Price Tag */}
          <div className="text-left shrink-0">
            {isFree ? (
              <span className="inline-block text-sm font-black text-emerald-600 dark:text-emerald-400">
                {tCourses("card.free")}
              </span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-extrabold text-primary">
                  {course.final_price.toLocaleString(isAr ? "ar-EG" : "en-US")}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {isAr ? (currency === "EGP" ? tCourses("card.egp") : currency) : currency}
                </span>
                {hasActiveDiscount && (
                  <span className="text-[11px] text-muted-foreground line-through ms-1">
                    {course.base_price.toLocaleString(isAr ? "ar-EG" : "en-US")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action CTA Button */}
        <Button
          asChild
          variant={
            isEnrolled
              ? "outline"
              : hasPendingOrder || course.has_pending_order
                ? "secondary"
                : "default"
          }
          className={`mt-3.5 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
            isEnrolled
              ? "border-primary text-primary hover:bg-primary/10"
              : hasPendingOrder || course.has_pending_order
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs group-hover:shadow-md"
          }`}
        >
          <Link href={targetHref}>
            {isEnrolled ? (
              <span>{tStudent("goToCourse")}</span>
            ) : hasPendingOrder || course.has_pending_order ? (
              <span className="flex items-center justify-center gap-1.5">
                <Clock className="size-4 shrink-0 animate-pulse text-amber-500" />
                <span>{tStudent("underReview")}</span>
              </span>
            ) : course.has_unpaid_order ? (
              <span>{tStudent("completePayment")}</span>
            ) : (
              <>
                <span>{tStudent("enrollNow")}</span>
                <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180 group-hover:-translate-x-1 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Link>
        </Button>
      </div>
    </article>
  );
}
