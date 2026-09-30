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
import Link from "next/link";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GradeSelect, SubjectSelect, TeacherSelect } from "@/components/ui/academic-selects";
import { SelectWithAdd } from "@/components/ui/select-with-add";
import type { ExamCategory, ExamVenue } from "@/types/exam";

interface ExamSettingsStepProps {
  mode: "create" | "edit";
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  triesAllowed: number;
  onTriesAllowedChange: (val: number) => void;
  durationMinutes: number;
  onDurationMinutesChange: (val: number) => void;
  passingPercentage: number;
  onPassingPercentageChange: (val: number) => void;
  numberOfQuestions: number;
  onNumberOfQuestionsChange: (val: number) => void;
  grade: string;
  onGradeChange: (val: string) => void;
  subject: string;
  onSubjectChange: (val: string) => void;
  teacherName: string;
  onTeacherNameChange: (val: string) => void;
  category: ExamCategory;
  onCategoryChange: (val: ExamCategory) => void;
  allExamCategoryOptions: Array<{ value: string; label: string }>;
  onAddExamCategory?: (name: string) => string | void | Promise<string | void>;
  mappedStages: Array<{ id: number | string; name: string }>;
  mappedSubjects: Array<{ id: number | string; name: string }>;
  mappedInstructors: Array<{ id: number | string; full_name: string }>;
  isLoadingOptions: boolean;
  requiresInstructorSelection?: boolean;
  showModelAnswers: boolean;
  onShowModelAnswersChange: (val: boolean) => void;
  randomizeQuestionsOrder: boolean;
  onRandomizeQuestionsOrderChange: (val: boolean) => void;
  randomizeMCQChoices: boolean;
  onRandomizeMCQChoicesChange: (val: boolean) => void;
  isIndependent: boolean;
  onIsIndependentChange: (val: boolean) => void;
  venue: ExamVenue;
  onVenueChange: (val: ExamVenue) => void;
  coursesCount: number;
  isSubmitting: boolean;
  locale: string;
  tForm: (key: string, values?: Record<string, string | number>) => string;
  tCourses: (key: string) => string;
  onProceedToStep2: () => void;
}

export function ExamSettingsStep({
  mode,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  triesAllowed,
  onTriesAllowedChange,
  durationMinutes,
  onDurationMinutesChange,
  passingPercentage,
  onPassingPercentageChange,
  numberOfQuestions,
  onNumberOfQuestionsChange,
  grade,
  onGradeChange,
  subject,
  onSubjectChange,
  teacherName,
  onTeacherNameChange,
  category,
  onCategoryChange,
  allExamCategoryOptions,
  onAddExamCategory,
  mappedStages,
  mappedSubjects,
  mappedInstructors,
  isLoadingOptions,
  requiresInstructorSelection = true,
  showModelAnswers,
  onShowModelAnswersChange,
  randomizeQuestionsOrder,
  onRandomizeQuestionsOrderChange,
  randomizeMCQChoices,
  onRandomizeMCQChoicesChange,
  isIndependent,
  onIsIndependentChange,
  venue,
  onVenueChange,
  coursesCount,
  isSubmitting,
  locale,
  tForm,
  tCourses,
  onProceedToStep2,
}: ExamSettingsStepProps) {
  return (
    <div className="space-y-6">
      {/* Section 1: Basic Information */}
      <FormSectionCard
        title={tForm("sections.basicInfo")}
        description={tForm("sections.basicInfoDesc")}
        icon={BookOpen}
      >
        <div className="space-y-4">
          {/* Exam Title */}
          <div className="space-y-2">
            <Label htmlFor="exam-title" className="font-semibold">
              {tForm("fields.title")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="exam-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={tForm("fields.titlePlaceholder")}
              required
            />
          </div>

          {/* Description Markdown */}
          <div className="space-y-2">
            <Label className="font-semibold">{tForm("fields.description")}</Label>
            <FormMarkdownEditor
              value={description}
              onChange={onDescriptionChange}
              placeholder={tForm("fields.descriptionPlaceholder")}
            />
          </div>

          {/* Numeric Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 pt-2">
            {/* Tries Allowed */}
            <div className="space-y-2">
              <Label htmlFor="tries-allowed" className="text-xs font-semibold">
                {tForm("fields.triesAllowed")}
              </Label>
              <Input
                id="tries-allowed"
                type="number"
                min={1}
                max={10}
                value={triesAllowed}
                onChange={(e) => onTriesAllowedChange(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            {/* Exam Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration-minutes" className="text-xs font-semibold">
                {tForm("fields.durationMinutes")}
              </Label>
              <Input
                id="duration-minutes"
                type="number"
                min={5}
                max={300}
                value={durationMinutes}
                onChange={(e) => onDurationMinutesChange(parseInt(e.target.value, 10) || 30)}
              />
            </div>

            {/* Pass Percentage */}
            <div className="space-y-2">
              <Label htmlFor="passing-percentage" className="text-xs font-semibold">
                {tForm("fields.passingPercentage")}
              </Label>
              <Input
                id="passing-percentage"
                type="number"
                min={0}
                max={100}
                value={passingPercentage}
                onChange={(e) => onPassingPercentageChange(parseInt(e.target.value, 10) || 60)}
              />
            </div>

            {/* Number of Questions (Max Cap) */}
            <div className="space-y-2">
              <Label htmlFor="number-of-questions" className="text-xs font-semibold">
                {tForm("fields.numberOfQuestions")}
              </Label>
              <Input
                id="number-of-questions"
                type="number"
                min={1}
                max={200}
                value={numberOfQuestions}
                onChange={(e) => onNumberOfQuestionsChange(parseInt(e.target.value, 10) || 10)}
              />
            </div>
          </div>
        </div>
      </FormSectionCard>

      {/* Section 2: Academic & Teacher Info */}
      <FormSectionCard
        title={tForm("sections.academic")}
        description={tForm("sections.academicDesc")}
        icon={GraduationCap}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grade Level */}
          <GradeSelect
            value={grade}
            onValueChange={onGradeChange}
            label={tForm("fields.grade")}
            placeholder={tForm("fields.selectGrade")}
            grades={mappedStages}
            disabled={isLoadingOptions}
          />

          {/* Subject */}
          <SubjectSelect
            value={subject}
            onValueChange={onSubjectChange}
            label={tForm("fields.subject")}
            placeholder={tForm("fields.selectSubject")}
            subjects={mappedSubjects}
            disabled={isLoadingOptions}
          />

          {/* Teacher Select */}
          <TeacherSelect
            value={teacherName}
            onValueChange={onTeacherNameChange}
            label={tForm("fields.teacherName")}
            placeholder={tForm("fields.selectTeacher")}
            teachers={mappedInstructors}
            disabled={isLoadingOptions || requiresInstructorSelection === false}
          />

          {/* Exam Category */}
          <SelectWithAdd
            value={category}
            onValueChange={(val) => onCategoryChange(val as ExamCategory)}
            label={tForm("fields.category")}
            placeholder={tForm("fields.selectCategory")}
            options={allExamCategoryOptions}
            allowAdd={Boolean(onAddExamCategory)}
            onAddNewOption={onAddExamCategory}
            addDialogTitle="إضافة تصنيف امتحان جديد"
            addInputLabel="اسم تصنيف الامتحان"
            addInputPlaceholder="مثال: تقييم شهري دوري"
          />
        </div>
      </FormSectionCard>

      {/* Section 3: Advanced Settings */}
      <FormSectionCard
        title={tForm("sections.advanced")}
        description={tForm("sections.advancedDesc")}
        icon={Settings}
      >
        <div className="space-y-4">
          <FormToggleSetting
            id="show-model-answers"
            title={tForm("fields.showModelAnswers")}
            subtitle={tForm("fields.showModelAnswersDesc")}
            icon={Eye}
            checked={showModelAnswers}
            onCheckedChange={onShowModelAnswersChange}
          />
          <FormToggleSetting
            id="randomize-questions-order"
            title={tForm("fields.randomizeQuestionsOrder")}
            subtitle={tForm("fields.randomizeQuestionsOrderDesc")}
            icon={Shuffle}
            checked={randomizeQuestionsOrder}
            onCheckedChange={onRandomizeQuestionsOrderChange}
          />
          <FormToggleSetting
            id="randomize-mcq-choices"
            title={tForm("fields.randomizeMCQChoices")}
            subtitle={tForm("fields.randomizeMCQChoicesDesc")}
            icon={ListOrdered}
            checked={randomizeMCQChoices}
            onCheckedChange={onRandomizeMCQChoicesChange}
          />
        </div>
      </FormSectionCard>

      {/* Section 4: Independent Exam Toggle (with Venue & Publish Status) */}
      <FormSectionCard
        title={tForm("fields.isIndependent")}
        description={tForm("fields.isIndependentDesc")}
        icon={FileQuestion}
      >
        <div className="space-y-6">
          {mode === "edit" && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/60 border border-border/60 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0 text-primary" />
              <span>{tForm("inCoursesInfo", { count: coursesCount })}</span>
            </div>
          )}

          <FormToggleSetting
            id="is-independent-exam"
            title={tForm("fields.isIndependent")}
            subtitle={tForm("fields.isIndependentDesc")}
            icon={FileQuestion}
            checked={isIndependent}
            onCheckedChange={onIsIndependentChange}
          >
            {isIndependent && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                {/* Venue */}
                <FormRadioGroup
                  name="exam-venue"
                  title={tForm("fields.venue")}
                  icon={MapPin}
                  value={venue}
                  onValueChange={(v) => onVenueChange(v as ExamVenue)}
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
        </div>
      </FormSectionCard>

      {/* Action Buttons Step 1 */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
        <Button asChild variant="outline" disabled={isSubmitting}>
          <Link href={`/${locale}/dashboard/exams`}>{tForm("actions.cancel")}</Link>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            onClick={onProceedToStep2}
            disabled={isSubmitting || !title.trim()}
            className="gap-2 font-semibold"
          >
            <span>{tForm("actions.nextStep")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
