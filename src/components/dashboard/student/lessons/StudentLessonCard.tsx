"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getPassedExams } from "@/lib/student-course-progress";
import { cn } from "@/lib/utils";
import { Lesson } from "@/types/course";
import {
  Check,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Paperclip,
  User,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface StudentLessonCardProps {
  lesson: Lesson;
  isExamPassed?: boolean;
}

export function StudentLessonCard({
  lesson,
  isExamPassed: isExamPassedProp,
}: StudentLessonCardProps) {
  const t = useTranslations("studentDashboard.lessonsPage");
  const tGrades = useTranslations("courses.new.grades");
  const tSubjects = useTranslations("courses.new.subjects");

  const isExamPassed =
    isExamPassedProp ??
    Boolean(
      lesson.isLinkedToExam &&
      lesson.linkedExamId &&
      getPassedExams().includes(lesson.linkedExamId),
    );

  const formatGrade = (g?: string) => {
    if (!g) return "";
    return tGrades.has(g as Parameters<typeof tGrades.has>[0])
      ? tGrades(g as Parameters<typeof tGrades>[0])
      : g;
  };

  const formatSubject = (s?: string) => {
    if (!s) return "";
    return tSubjects.has(s as Parameters<typeof tSubjects.has>[0])
      ? tSubjects(s as Parameters<typeof tSubjects>[0])
      : s;
  };

  const fallbackCover =
    lesson.coverImage ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

  const pdfCount = (lesson.pdfFiles || []).length || (lesson.hasPdfAttachments ? 1 : 0);
  const subjectAndGradeText = [formatSubject(lesson.subject), formatGrade(lesson.grade)]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="group flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      {/* Cover Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={fallbackCover}
          alt={lesson.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

        {/* Independent Tag */}
        <div className="absolute top-2.5 inset-s-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-xs">
            {t("card.independent")}
          </span>
        </div>

        {/* Lesson Type Icon Badge on top-end */}
        <div className="absolute top-2.5 inset-e-2.5 flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-xs"
            title={lesson.type === "text" ? t("card.textOnly") : t("card.videoText")}
          >
            {lesson.type === "text" ? (
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
            href={`/student-dashboard/lessons/${lesson.id}`}
            className="block font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
          >
            {lesson.title}
          </Link>

          {/* Description snippet */}
          {lesson.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Teacher & Grade/Subject */}
          <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
            {lesson.teacherName && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span className="truncate font-medium">{lesson.teacherName}</span>
              </div>
            )}

            {subjectAndGradeText && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span className="truncate">{subjectAndGradeText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Badges: PDFs & Linked Exam */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {pdfCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20 font-medium"
              title={t("card.pdfsCount", { count: pdfCount })}
            >
              <Paperclip className="h-3 w-3" />
              <span>{pdfCount}</span>
            </span>
          )}

          {lesson.isLinkedToExam && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border",
                isExamPassed
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20",
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              <span>{t("card.examLinked")}</span>
              {isExamPassed && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
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
            <Link href={`/student-dashboard/lessons/${lesson.id}`}>
              <span>{t("card.viewLesson")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
