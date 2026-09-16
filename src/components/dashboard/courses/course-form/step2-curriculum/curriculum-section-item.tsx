"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CourseSection, Lesson } from "@/types/course";
import { Exam } from "@/types/exam";
import {
  Check,
  Edit2,
  FileQuestion,
  FileText as FileTextIcon,
  Paperclip,
  Plus as PlusIcon,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";

interface CurriculumSectionItemProps {
  section: CourseSection;
  index: number;
  locale: string;
  availableExams: Exam[];
  onAddLessonToSection: (sectionId: string) => void;
  onEditSection: (section: CourseSection) => void;
  onDeleteSection: (section: CourseSection) => void;
  onEditLesson: (lesson: Lesson, sectionId: string) => void;
  onDeleteLesson: (lesson: Lesson, sectionId: string) => void;
}

export function CurriculumSectionItem({
  section,
  index,
  locale,
  availableExams,
  onAddLessonToSection,
  onEditSection,
  onDeleteSection,
  onEditLesson,
  onDeleteLesson,
}: CurriculumSectionItemProps) {
  const t = useTranslations("courses.new");
  const secPublishStatus = section.status || (section.isDraft ? "draft" : "published");

  return (
    <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-semibold text-foreground text-base">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
            {index + 1}
          </span>
          <span className="text-sm sm:text-base font-semibold">{section.title}</span>

          {/* Publish Status Badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium capitalize",
              secPublishStatus === "published" &&
                "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              secPublishStatus === "draft" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
              secPublishStatus === "scheduled" &&
                "bg-purple-500/10 text-purple-600 border-purple-500/20",
            )}
          >
            {secPublishStatus === "published"
              ? locale === "ar"
                ? "منشور"
                : "Published"
              : secPublishStatus === "scheduled"
                ? locale === "ar"
                  ? "مجدول"
                  : "Scheduled"
                : locale === "ar"
                  ? "مسودة"
                  : "Draft"}
          </Badge>

          {/* Linked to Exam indicator (Icon + Check without circle) */}
          {section.isLinkedToExam && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1"
            >
              <FileQuestion className="size-3 shrink-0" />
              <Check className="size-3 text-amber-600 shrink-0 stroke-[2.5]" />
            </Badge>
          )}

          {section.isLinkedToExam && !section.linkedExamId && (
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-md bg-warning-bg/10 text-warning border border-warning/20">
              {t("step2.pleaseAddExamBadge")}
            </span>
          )}
        </div>

        {/* Section Header Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onAddLessonToSection(section.id)}
            className="gap-1 text-xs text-primary hover:bg-none"
            title={locale === "ar" ? "إضافة درس لهذا القسم" : "Add lesson to this section"}
          >
            <PlusIcon className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onEditSection(section)}
            className="text-muted-foreground hover:text-primary h-7 w-7"
            title={locale === "ar" ? "تعديل القسم" : "Edit section"}
          >
            <Edit2 className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onDeleteSection(section)}
            className="text-muted-foreground hover:text-destructive h-7 w-7"
            title={locale === "ar" ? "حذف القسم" : "Delete section"}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Section Lessons & Linked Exam */}
      {section.lessons.length > 0 || (section.isLinkedToExam && section.linkedExamId) ? (
        <div className="pl-6 rtl:pl-0 rtl:pr-6 space-y-2 border-l rtl:border-l-0 rtl:border-r border-border">
          {section.lessons.map((les, lIdx) => {
            const lesPublishStatus = les.publishStatus || "published";
            const isDifferentStatus = lesPublishStatus !== secPublishStatus;

            return (
              <div
                key={les.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-lg bg-background border gap-2"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  {les.type === "text" ? (
                    <FileTextIcon className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <VideoIcon className="size-4 text-primary shrink-0" />
                  )}
                  <span className="font-semibold text-foreground">
                    {lIdx + 1}. {les.title}
                  </span>

                  {/* Lesson Type Icon Badge with Tooltip */}
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          tabIndex={0}
                          className={cn(
                            "size-5 rounded-full flex items-center justify-center shrink-0 cursor-help",
                            les.type === "text"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {les.type === "text" ? (
                            <FileTextIcon className="size-3 shrink-0" />
                          ) : (
                            <VideoIcon className="size-3 shrink-0" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {les.type === "text"
                          ? t("step2.addLessonDialog.typeOptions.text")
                          : t("step2.addLessonDialog.typeOptions.videoAndText")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {(les.hasPdfAttachments || (les.pdfFiles && les.pdfFiles.length > 0)) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium flex items-center gap-1">
                      <Paperclip className="size-3" />
                      {t("step2.pdfsBadge", {
                        count: (les.pdfFiles || []).length || 1,
                      })}
                    </span>
                  )}

                  {les.isLinkedToExam && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1"
                    >
                      <FileQuestion className="size-3 shrink-0" />
                      <span>{t("step2.examLinkedBadge")}</span>
                    </Badge>
                  )}

                  {/* Publish Status Badge if different from parent section */}
                  {isDifferentStatus && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium capitalize",
                        lesPublishStatus === "published" &&
                          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        lesPublishStatus === "draft" &&
                          "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        lesPublishStatus === "scheduled" &&
                          "bg-purple-500/10 text-purple-600 border-purple-500/20",
                      )}
                    >
                      {lesPublishStatus === "published"
                        ? locale === "ar"
                          ? "منشور"
                          : "Published"
                        : lesPublishStatus === "scheduled"
                          ? locale === "ar"
                            ? "مجدول"
                            : "Scheduled"
                          : locale === "ar"
                            ? "مسودة"
                            : "Draft"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onEditLesson(les, section.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDeleteLesson(les, section.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Linked Exam item under lessons */}
          {section.isLinkedToExam && section.linkedExamId && (
            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-warning/10 border border-warning/20">
              <span className="font-medium text-warning flex items-center gap-2">
                <FileQuestion className="size-3.5 text-warning" />
                {t("step2.addSectionDialog.isLinkedToExam")}:{" "}
                {availableExams.find((e) => e.id === section.linkedExamId)?.title ||
                  section.linkedExamTitle ||
                  `#${section.linkedExamId}`}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic pl-6 rtl:pl-0 rtl:pr-6">
          {t("step2.noLessons")}
        </p>
      )}
    </div>
  );
}
