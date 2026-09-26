"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { ExamSelect } from "@/components/ui/academic-selects";
import { CourseSection, LessonPublishStatus } from "@/types/course";
import { Exam } from "@/types/exam";

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections?: CourseSection[];
  editingSection: CourseSection | null;
  newSecTitle: string;
  onTitleChange: (val: string) => void;
  newSecStatus: LessonPublishStatus;
  onStatusChange: (val: LessonPublishStatus) => void;
  newSecScheduledDate: string;
  onScheduledDateChange: (val: string) => void;
  newSecIsLinkedExam: boolean;
  onIsLinkedExamChange: (val: boolean) => void;
  newSecLinkedExamId: string;
  onLinkedExamIdChange: (val: string) => void;
  newSecIsReqPass: boolean;
  onIsReqPassChange: (val: boolean) => void;
  newSecScheduleDateError: string | null;
  availableExams: Exam[];
  courseId: string;
  locale: string;
  onSave: () => void;
  onCancel: () => void;
}

export function SectionFormDialog({
  open,
  onOpenChange,
  sections = [],
  editingSection,
  newSecTitle,
  onTitleChange,
  newSecStatus,
  onStatusChange,
  newSecScheduledDate,
  onScheduledDateChange,
  newSecIsLinkedExam,
  onIsLinkedExamChange,
  newSecLinkedExamId,
  onLinkedExamIdChange,
  newSecIsReqPass,
  onIsReqPassChange,
  newSecScheduleDateError,
  availableExams,
  courseId: _courseId,
  locale,
  onSave,
  onCancel,
}: SectionFormDialogProps) {
  const t = useTranslations("courses.new");

  // Filter out exams already used in other sections or lessons
  const selectableExams = useMemo(() => {
    const takenExamIds = new Set<string>();
    sections.forEach((sec) => {
      if (sec.linkedExamId && sec.id !== editingSection?.id) {
        takenExamIds.add(String(sec.linkedExamId));
      }
      (sec.lessons || []).forEach((les) => {
        if (les.linkedExamId) {
          takenExamIds.add(String(les.linkedExamId));
        }
      });
    });

    return availableExams.filter(
      (exam) =>
        !takenExamIds.has(String(exam.id)) ||
        (editingSection?.linkedExamId && String(exam.id) === String(editingSection.linkedExamId)),
    );
  }, [availableExams, sections, editingSection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSection
              ? t("step2.addSectionDialog.editTitle")
              : t("step2.addSectionDialog.title")}
          </DialogTitle>
          <DialogDescription>{t("step2.addSectionDialog.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sec-title" className="text-sm font-medium text-foreground">
              {t("step2.addSectionDialog.sectionTitle")}
            </label>
            <Input
              id="sec-title"
              value={newSecTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t("step2.addSectionDialog.sectionTitlePlaceholder")}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {locale === "ar" ? "إعدادات النشر" : "Publish Status"}
            </label>
            <Select
              value={newSecStatus}
              onValueChange={(val) => onStatusChange(val as LessonPublishStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{locale === "ar" ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="published">{locale === "ar" ? "منشور" : "Published"}</SelectItem>
                <SelectItem value="scheduled">{locale === "ar" ? "مجدول" : "Scheduled"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Date (Only if status is scheduled) */}
          {newSecStatus === "scheduled" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="sec-schedule-date"
                  className="text-sm font-medium text-foreground flex items-center gap-1"
                >
                  {locale === "ar" ? "تاريخ النشر المجدول" : "Scheduled Publish Date"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="sec-schedule-date"
                  type="date"
                  value={newSecScheduledDate}
                  onChange={(e) => onScheduledDateChange(e.target.value)}
                  required
                />
              </div>

              {newSecScheduleDateError && (
                <p className="text-xs text-destructive font-medium animate-in fade-in">
                  {newSecScheduleDateError}
                </p>
              )}
            </div>
          )}

          {/* Toggle: Link to Exam */}
          <FormToggleSetting
            id="link-exam-toggle"
            title={t("step2.addSectionDialog.isLinkedToExam")}
            checked={newSecIsLinkedExam}
            onCheckedChange={onIsLinkedExamChange}
            className="bg-transparent border-0 p-0!"
          />

          {/* Select Exam (shown when link to exam is on) */}
          {newSecIsLinkedExam && (
            <div className="animate-in fade-in slide-in-from-top-1 space-y-2">
              <ExamSelect
                value={newSecLinkedExamId}
                onValueChange={onLinkedExamIdChange}
                label={locale === "ar" ? "اختر الامتحان" : "Select Exam"}
                placeholder={
                  t("step2.addLessonDialog.selectExam") ||
                  (locale === "ar" ? "اختر الامتحان..." : "Select exam...")
                }
                exams={selectableExams}
                emptyLabel={
                  availableExams.length === 0
                    ? locale === "ar"
                      ? "لا توجد امتحانات متاحة لهذه الدورة"
                      : "No exams available for this course"
                    : locale === "ar"
                      ? "جميع امتحانات الدورة مستخدمة بالفعل"
                      : "All course exams are already linked"
                }
              />

              {availableExams.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  {locale === "ar"
                    ? "لا توجد امتحانات مخصصة لهذه الدورة حتى الآن. يمكنك إنشاء امتحان وربطه بهذه الدورة من قسم إدارة الامتحانات."
                    : "No exams found for this course yet. You can create an exam linked to this course from the Exams section."}
                </p>
              ) : selectableExams.length === 0 && !newSecLinkedExamId ? (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                  {locale === "ar"
                    ? "جميع الامتحانات المخصصة لهذه الدورة مستخدمة بالفعل في أقسام أو دروس أخرى (لا يمكن ربط نفس الامتحان بأكثر من قسم أو درس)."
                    : "All exams assigned to this course are already linked to other sections or lessons (an exam can only be linked once)."}
                </p>
              ) : null}
            </div>
          )}

          {/* Toggle: Exam pass required */}
          {newSecIsLinkedExam && (
            <FormToggleSetting
              id="req-pass-toggle"
              title={t("step2.addSectionDialog.isRequiredPassExam")}
              checked={newSecIsReqPass}
              onCheckedChange={onIsReqPassChange}
              className="bg-transparent border-0 p-0 animate-in fade-in slide-in-from-top-1"
            />
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
          <Button type="button" onClick={onSave} disabled={!newSecTitle.trim()}>
            {editingSection
              ? locale === "ar"
                ? "حفظ التعديلات"
                : "Save Changes"
              : t("actions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
