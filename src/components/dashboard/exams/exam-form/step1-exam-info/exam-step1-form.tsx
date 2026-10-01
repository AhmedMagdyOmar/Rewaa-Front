"use client";

import { GradeSelect, SubjectSelect, TeacherSelect } from "@/components/ui/academic-selects";
import { Button } from "@/components/ui/button";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectWithAdd } from "@/components/ui/select-with-add";
import { ExamVenue } from "@/types/exam";
import {
  BookOpen,
  Eye,
  FileQuestion,
  GraduationCap,
  Info,
  ListOrdered,
  MapPin,
  Settings,
  Shuffle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useExamForm } from "../hooks/use-exam-form";

interface ExamStep1FormProps {
  form: ReturnType<typeof useExamForm>;
  mode: "create" | "edit";
  locale: string;
}

export function ExamStep1Form({ form, mode, locale }: ExamStep1FormProps) {
  const tForm = useTranslations("exams.form");
  const tCourses = useTranslations("courses");

  return (
    <div className="space-y-6">
      {/* ── 1. Basic Information ─────────────────────────────────────────── */}
      <FormSectionCard
        title={tForm("sections.basicInfo")}
        description={tForm("sections.basicInfoDesc")}
        icon={BookOpen}
        contentClassName="space-y-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-title-input" className="text-sm font-medium text-foreground">
            {tForm("fields.title")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="exam-title-input"
            value={form.title}
            onChange={(e) => form.setTitle(e.target.value)}
            placeholder={tForm("fields.titlePlaceholder")}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-description-input" className="text-sm font-medium text-foreground">
            {tForm("fields.description")}
          </Label>
          <FormMarkdownEditor
            value={form.description}
            onChange={form.setDescription}
            placeholder={tForm("fields.descriptionPlaceholder")}
          />
        </div>
      </FormSectionCard>

      {/* ── 2. Academic Info ────────────────────────────────────────────── */}
      <FormSectionCard
        title={tForm("sections.academic")}
        description={tForm("sections.academicDesc")}
        icon={GraduationCap}
        contentClassName="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GradeSelect
            value={form.grade}
            onValueChange={form.handleGradeChange}
            grades={form.mappedStages}
            disabled={form.isLoadingOptions}
            label={tForm("fields.grade")}
            placeholder={tForm("fields.selectGrade")}
          />

          <SubjectSelect
            value={form.subject}
            onValueChange={form.setSubject}
            subjects={form.mappedSubjects}
            disabled={!form.grade || form.isLoadingOptions}
            label={tForm("fields.subject")}
            placeholder={!form.grade ? tForm("fields.selectGrade") : tForm("fields.selectSubject")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.optionsData?.requires_instructor_selection !== false && (
            <TeacherSelect
              value={form.teacherName}
              onValueChange={form.setTeacherName}
              teachers={form.mappedInstructors}
              disabled={form.isLoadingOptions}
              label={tForm("fields.teacherName")}
              placeholder={tForm("fields.selectTeacher")}
            />
          )}

          <div className="flex flex-col gap-2">
            <SelectWithAdd
              value={form.category}
              onValueChange={(val) => form.setCategory(val)}
              options={form.examCategoryOptions}
              allowAdd={Boolean(form.handleAddExamCategory)}
              onAddNewOption={form.handleAddExamCategory}
              label={tForm("fields.category")}
              placeholder={tForm("fields.selectCategory")}
              addDialogTitle={locale === "ar" ? "إضافة تصنيف جديد" : "Add New Category"}
              addInputLabel={locale === "ar" ? "اسم التصنيف" : "Category Name"}
              addInputPlaceholder={
                locale === "ar" ? "مثال: تدريب أسبوعي" : "e.g. Weekly Assessment"
              }
            />
          </div>
        </div>
      </FormSectionCard>

      {/* ── 3. Exam System & Performance Settings ─────────────────────────── */}
      <FormSectionCard
        title={tForm("sections.advanced")}
        description={tForm("sections.advancedDesc")}
        icon={Settings}
        contentClassName="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tries-allowed-input" className="text-sm font-medium text-foreground">
              {tForm("fields.triesAllowed")}
            </Label>
            <Input
              id="tries-allowed-input"
              type="number"
              min={1}
              value={form.triesAllowed}
              onChange={(e) => form.setTriesAllowed(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duration-minutes-input" className="text-sm font-medium text-foreground">
              {tForm("fields.durationMinutes")}
            </Label>
            <Input
              id="duration-minutes-input"
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => form.setDurationMinutes(parseInt(e.target.value) || 30)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="passing-percentage-input"
              className="text-sm font-medium text-foreground"
            >
              {tForm("fields.passingPercentage")} (%)
            </Label>
            <Input
              id="passing-percentage-input"
              type="number"
              min={1}
              max={100}
              value={form.passingPercentage}
              onChange={(e) => form.setPassingPercentage(parseInt(e.target.value) || 60)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="number-of-questions-input"
              className="text-sm font-medium text-foreground"
            >
              {tForm("fields.numberOfQuestions")}
            </Label>
            <Input
              id="number-of-questions-input"
              type="number"
              min={1}
              value={form.numberOfQuestions}
              onChange={(e) => form.setNumberOfQuestions(parseInt(e.target.value) || 10)}
            />
          </div>
        </div>
      </FormSectionCard>

      {/* ── 4. Advanced Display & Ordering Settings ───────────────────────── */}
      <FormSectionCard
        title={tForm("sections.advanced")}
        description={tForm("sections.advancedDesc")}
        icon={Shuffle}
        contentClassName="space-y-4"
      >
        <FormToggleSetting
          id="show-model-answers"
          title={tForm("fields.showModelAnswers")}
          subtitle={tForm("fields.showModelAnswersDesc")}
          icon={Eye}
          checked={form.showModelAnswers}
          onCheckedChange={form.setShowModelAnswers}
        />

        <FormToggleSetting
          id="randomize-questions"
          title={tForm("fields.randomizeQuestionsOrder")}
          subtitle={tForm("fields.randomizeQuestionsOrderDesc")}
          icon={Shuffle}
          checked={form.randomizeQuestionsOrder}
          onCheckedChange={form.setRandomizeQuestionsOrder}
        />

        <FormToggleSetting
          id="randomize-mcq"
          title={tForm("fields.randomizeMCQChoices")}
          subtitle={tForm("fields.randomizeMCQChoicesDesc")}
          icon={ListOrdered}
          checked={form.randomizeMCQChoices}
          onCheckedChange={form.setRandomizeMCQChoices}
        />
      </FormSectionCard>

      {/* ── 5. Independent vs Course Exam ─────────────────────────────────── */}
      <FormSectionCard
        title={tForm("fields.isIndependent")}
        description={tForm("fields.isIndependentDesc")}
        icon={FileQuestion}
        contentClassName="space-y-4"
      >
        {mode === "edit" && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/60 border border-border/60 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-primary" />
            <span>{tForm("inCoursesInfo", { count: form.coursesCount })}</span>
          </div>
        )}

        <FormToggleSetting
          id="is-independent"
          title={tForm("fields.isIndependent")}
          subtitle={tForm("fields.isIndependentDesc")}
          icon={FileQuestion}
          checked={form.isIndependent}
          onCheckedChange={form.setIsIndependent}
        >
          {form.isIndependent && (
            <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in duration-300">
              <FormRadioGroup
                name="exam-venue"
                title={tForm("fields.venue")}
                icon={MapPin}
                value={form.venue}
                onValueChange={(val) => form.setVenue(val as ExamVenue)}
                gridClassName="sm:grid-cols-3"
                options={[
                  {
                    id: "online",
                    label: tCourses("new.venues.online.label"),
                    desc: tCourses("new.venues.online.desc"),
                  },
                  {
                    id: "onsite",
                    label: tCourses("new.venues.onsite.label"),
                    desc: tCourses("new.venues.onsite.desc"),
                  },
                  {
                    id: "hybrid",
                    label: tCourses("new.venues.hybrid.label"),
                    desc: tCourses("new.venues.hybrid.desc"),
                  },
                ]}
              />
            </div>
          )}
        </FormToggleSetting>
      </FormSectionCard>

      {/* ── Proceed to Step 2 ────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={form.handleProceedToStep2}
          disabled={form.isSubmitting}
          className="gap-2 font-semibold px-6"
        >
          <span>{tForm("actions.nextStep")}</span>
        </Button>
      </div>
    </div>
  );
}
