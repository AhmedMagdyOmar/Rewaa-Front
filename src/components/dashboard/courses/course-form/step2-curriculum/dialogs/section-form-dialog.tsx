"use client";

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
            <div className="animate-in fade-in slide-in-from-top-1">
              <ExamSelect
                value={newSecLinkedExamId}
                onValueChange={onLinkedExamIdChange}
                label={locale === "ar" ? "اختر الامتحان" : "Select Exam"}
                placeholder={
                  t("step2.addLessonDialog.selectExam") ||
                  (locale === "ar" ? "اختر الامتحان..." : "Select exam...")
                }
                exams={availableExams}
                emptyLabel={locale === "ar" ? "لا توجد امتحانات متاحة" : "No exams available"}
              />
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
