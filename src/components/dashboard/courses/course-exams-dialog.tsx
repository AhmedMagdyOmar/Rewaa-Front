"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  Pencil,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseExams } from "@/hooks/use-courses";
import { BackendExam } from "@/types/api-contracts";
import { Course } from "@/types/course";

interface CourseExamsDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseExamsDialog({ course, open, onOpenChange }: CourseExamsDialogProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("courses");

  const courseId = course?.id;
  const {
    data: exams,
    isLoading,
    isError,
  } = useCourseExams(open && courseId ? courseId : undefined);

  const getBoundLocationBadge = (exam: BackendExam) => {
    if (exam.lesson) {
      const lessonTitle =
        exam.lesson.title?.[locale] || exam.lesson.title?.ar || exam.lesson.title?.en || "";
      const sectionTitle =
        exam.course_section?.title?.[locale] || exam.course_section?.title?.ar || "";
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <FileText className="size-3.5 shrink-0" />
            <span>
              {isAr ? "درس:" : "Lesson:"} {lessonTitle}
            </span>
          </span>
          {sectionTitle && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Layers className="size-3 shrink-0" />
              <span>
                {isAr ? "ضمن قسم:" : "In section:"} {sectionTitle}
              </span>
            </span>
          )}
        </div>
      );
    }

    if (exam.course_section) {
      const sectionTitle =
        exam.course_section.title?.[locale] ||
        exam.course_section.title?.ar ||
        exam.course_section.title?.en ||
        "";
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Layers className="size-3.5 shrink-0" />
          <span>
            {isAr ? "قسم:" : "Section:"} {sectionTitle}
          </span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
        <GraduationCap className="size-3.5 shrink-0" />
        <span>{isAr ? "الدورة كاملة" : "Full Course"}</span>
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>{isAr ? "إحصائيات امتحانات الدورة" : "Course Exam Statistics"}</span>
                {exams && (
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {exams.length}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {course?.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/60 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              <p className="font-medium">
                {isAr ? "حدث خطأ أثناء تحميل بيانات الامتحانات" : "Failed to load course exams"}
              </p>
            </div>
          ) : !exams || exams.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <HelpCircle className="size-6" />
              </div>
              <h4 className="font-bold text-foreground text-base mb-1">
                {isAr ? "لا توجد امتحانات مرتبطة بهذه الدورة" : "No exams linked to this course"}
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {isAr
                  ? "يمكنك ربط الامتحانات بالدروس أو الأقسام من خلال تعديل محتوى الدورة."
                  : "You can bind exams to lessons or sections via the course curriculum editor."}
              </p>
              {course && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${locale}/dashboard/courses/${course.id}/edit`}>
                    <Pencil className="size-3.5 me-1.5" />
                    <span>{t("card.edit")}</span>
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const title = exam.title?.[locale] || exam.title?.ar || exam.title?.en || "";
                const attemptsCount = exam.attempts_count ?? 0;
                const studentsCount = exam.students_count ?? 0;
                const successRate = exam.success_rate ?? 0;
                const avgScore = exam.average_score ?? null;

                return (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Info & Bound Target */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className="font-bold text-foreground text-base leading-snug truncate">
                          {title}
                        </h4>
                        {exam.duration_minutes > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-normal shrink-0 gap-1"
                          >
                            <Clock className="size-3" />
                            <span>
                              {exam.duration_minutes} {isAr ? "دقيقة" : "min"}
                            </span>
                          </Badge>
                        )}
                      </div>

                      {/* Bound location */}
                      <div>{getBoundLocationBadge(exam)}</div>
                    </div>

                    {/* Middle: Metrics Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 bg-muted/40 p-2.5 rounded-lg border border-border/40 text-xs">
                      {/* Attempts */}
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? "الطلاب / المحاولات" : "Students / Attempts"}
                          </p>
                          <p className="font-bold text-foreground">
                            {studentsCount} / {attemptsCount}
                          </p>
                        </div>
                      </div>

                      {/* Success Rate */}
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? "نسبة النجاح" : "Pass Rate"}
                          </p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {attemptsCount > 0 ? `${successRate}%` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Average Score */}
                      <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                        <TrendingUp className="size-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? "متوسط الدرجة" : "Avg Score"}
                          </p>
                          <p className="font-bold text-foreground">
                            {avgScore !== null && attemptsCount > 0 ? `${avgScore}%` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <Button asChild size="sm" className="font-medium text-xs gap-1.5 shadow-xs">
                        <Link href={`/${locale}/dashboard/exams/${exam.id}`}>
                          <BarChart3 className="size-3.5" />
                          <span>{isAr ? "عرض الإحصائيات" : "View Stats"}</span>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="font-medium text-xs gap-1.5"
                      >
                        <Link href={`/${locale}/dashboard/exams/${exam.id}/edit`}>
                          <Pencil className="size-3.5" />
                          <span>{isAr ? "تعديل" : "Edit"}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
