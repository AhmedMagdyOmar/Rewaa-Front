"use client";

import { useLocale, useTranslations } from "next-intl";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { GradeSelect, SubjectSelect, TeacherSelect } from "@/components/ui/academic-selects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "lucide-react";
import { BackendCourseOptions } from "@/types/api-contracts";

interface CategoryInfoSectionProps {
  grade: string;
  onGradeChange: (val: string) => void;
  subject: string;
  onSubjectChange: (val: string) => void;
  teacherName: string;
  onTeacherNameChange: (val: string) => void;
  period: string;
  onPeriodChange: (val: string) => void;
  courseOptions?: BackendCourseOptions;
}

export function CategoryInfoSection({
  grade,
  onGradeChange,
  subject,
  onSubjectChange,
  teacherName,
  onTeacherNameChange,
  period,
  onPeriodChange,
  courseOptions,
}: CategoryInfoSectionProps) {
  const t = useTranslations("courses.new");
  const locale = useLocale();

  return (
    <FormSectionCard
      title={t("sections.categoryInfo.title")}
      description={t("sections.categoryInfo.description")}
      icon={<Tag className="size-5" />}
      contentClassName="w-full grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6"
    >
      {/* Grade Select */}
      <GradeSelect
        value={grade}
        onValueChange={onGradeChange}
        label={t("fields.grade")}
        placeholder={t("fields.selectGrade")}
        required
        grades={courseOptions?.educational_stages?.map((stage) => ({
          id: stage.id,
          name: stage.name[locale] || stage.name.ar || stage.name.en || `Stage #${stage.id}`,
        }))}
      />

      {/* Subject Select */}
      <SubjectSelect
        value={subject}
        onValueChange={onSubjectChange}
        label={t("fields.subject")}
        placeholder={t("fields.selectSubject")}
        required
        subjects={courseOptions?.subjects?.map((subj) => ({
          id: subj.id,
          name: subj.name[locale] || subj.name.ar || subj.name.en || `Subject #${subj.id}`,
        }))}
      />

      {/* Teacher Select (only displayed if user needs to select an instructor) */}

      <TeacherSelect
        value={teacherName}
        onValueChange={onTeacherNameChange}
        label={t("fields.teacherName")}
        placeholder={t("fields.selectTeacher")}
        required
        showIcon
        teachers={courseOptions?.instructors || []}
        disabled={courseOptions?.requires_instructor_selection === false}
      />

      {/* Period */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("fields.period")} <span className="text-destructive">*</span>
        </label>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("fields.selectPeriod")} />
          </SelectTrigger>
          <SelectContent>
            {courseOptions?.subscription_periods ? (
              Object.entries(courseOptions.subscription_periods).map(([key, label]) => {
                const localizedLabel =
                  key === "monthly"
                    ? t("periodOptions.monthly")
                    : key === "yearly"
                      ? t("periodOptions.yearly")
                      : key === "term"
                        ? t("periodOptions.term")
                        : String(label);
                return (
                  <SelectItem key={key} value={key}>
                    {localizedLabel}
                  </SelectItem>
                );
              })
            ) : (
              <>
                <SelectItem value="monthly">{t("periodOptions.monthly")}</SelectItem>
                <SelectItem value="yearly">{t("periodOptions.yearly")}</SelectItem>
                <SelectItem value="term">{t("periodOptions.term")}</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </FormSectionCard>
  );
}
