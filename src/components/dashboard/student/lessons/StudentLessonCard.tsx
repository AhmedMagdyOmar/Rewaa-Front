"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { BackendStudentLessonDetail } from "@/types/api-contracts";
import {
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  User,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

interface StudentLessonCardProps {
  lesson: BackendStudentLessonDetail;
}

export function StudentLessonCard({ lesson }: StudentLessonCardProps) {
  const t = useTranslations("studentDashboard.lessonsPage");
  const locale = useLocale();

  const getLocalized = (val?: Record<string, string> | null, fallback = "") => {
    if (!val) return fallback;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || fallback;
  };

  const title = getLocalized(lesson.title, `Lesson ${lesson.position || lesson.id}`);
  const stageName = getLocalized(lesson.educational_stage?.name);
  const subjectName = getLocalized(lesson.subject?.name);

  const subjectAndStageText = [subjectName, stageName].filter(Boolean).join(" • ");
  const isVideoLesson = lesson.type === "video_and_text" || lesson.type === "video";

  const lessonHref = `/student-dashboard/lessons/${lesson.id}`;

  return (
    <div
      className={cn(
        "group flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200",
      )}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
        {lesson.cover_image ? (
          <Image
            src={lesson.cover_image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <BookOpen className="size-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

        {/* Status Badge */}
        {lesson.is_completed ? (
          <div className="absolute top-2.5 inset-s-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="size-3" />
              <span>{t("card.completed") || "Completed"}</span>
            </span>
          </div>
        ) : (
          <div className="absolute top-2.5 inset-s-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-xs">
              {subjectName || t("card.enrolled") || "Lesson"}
            </span>
          </div>
        )}

        {/* Lesson Type Icon Badge on top-end */}
        <div className="absolute top-2.5 inset-e-2.5 flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-xs"
            title={!isVideoLesson ? t("card.textOnly") : t("card.videoText")}
          >
            {!isVideoLesson ? (
              <FileText className="h-3.5 w-3.5" />
            ) : (
              <Video className="h-3.5 w-3.5" />
            )}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Title */}
          <Link
            href={lessonHref}
            className="block font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
          >
            {title}
          </Link>

          {/* Teacher & Grade/Subject */}
          <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
            {lesson.instructor?.full_name && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span className="truncate font-medium">{lesson.instructor.full_name}</span>
              </div>
            )}

            {subjectAndStageText && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span className="truncate">{subjectAndStageText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Badges: Exam Linked */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {lesson.exam && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border bg-amber-500/10 text-amber-600 border-amber-500/20",
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              <span>{t("card.examLinked")}</span>
            </span>
          )}
        </div>

        {/* Card Footer: View Lesson CTA */}
        <div className="pt-3 border-t border-border/40">
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full h-9 gap-1.5 text-xs font-semibold rounded-xl"
          >
            <Link href={lessonHref}>
              <span>{t("card.viewLesson")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
