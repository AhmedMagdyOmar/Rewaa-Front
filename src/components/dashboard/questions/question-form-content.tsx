/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { BookOpen, CheckCircle2, FileText, HelpCircle, ListOrdered, XCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProviderQuestionOptions } from "@/hooks/use-questions";
import type {
  ExamSection,
  MCQOption,
  Question,
  QuestionDifficulty,
  QuestionKind,
  QuestionType,
} from "@/types/exam";
import { QuestionMcqOptionsList } from "@/components/dashboard/questions/question-mcq-options-list";
import { QuestionAcademicContextSection } from "@/components/dashboard/questions/question-academic-context-section";

export interface QuestionFormContentProps {
  initialQuestion?: Question | null;
  sections?: ExamSection[];
  initialSectionId?: string;
  examGrade?: string;
  examSubject?: string;
  examTeacherName?: string;
  initialEducationalStageId?: number | string;
  initialSubjectId?: number | string;
  initialInstructorId?: number | string;
  allowEditableAcademicProps?: boolean;
  onSave: (
    question: Question,
    sectionId?: string,
    keepOpen?: boolean,
    academicContext?: {
      grade?: string;
      subject?: string;
      teacherName?: string;
      educationalStageId?: number;
      subjectId?: number;
      instructorId?: number;
    },
  ) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  showSaveAndAddAnother?: boolean;
}

export function QuestionFormContent({
  initialQuestion,
  sections,
  initialSectionId,
  examGrade,
  examSubject,
  examTeacherName,
  initialEducationalStageId,
  initialSubjectId,
  initialInstructorId,
  allowEditableAcademicProps = false,
  onSave,
  onCancel,
  submitLabel,
  cancelLabel,
  showSaveAndAddAnother = false,
}: QuestionFormContentProps) {
  const locale = useLocale();
  const t = useTranslations("exams.questionDialog");
  const tNew = useTranslations("questionsPage.newPage");

  const [sectionId, setSectionId] = React.useState<string>(
    initialSectionId || (sections && sections[0]?.id ? sections[0].id : ""),
  );

  // Academic Context State when editable (using real backend IDs when available)
  const [selectedStageId, setSelectedStageId] = React.useState<string>(
    initialEducationalStageId ? String(initialEducationalStageId) : examGrade || "",
  );
  const [selectedSubjId, setSelectedSubjId] = React.useState<string>(
    initialSubjectId ? String(initialSubjectId) : examSubject || "",
  );
  const [selectedInstId, setSelectedInstId] = React.useState<string>(
    initialInstructorId ? String(initialInstructorId) : examTeacherName || "",
  );

  // Live options query from backend
  const { data: optionsData, isLoading: isLoadingOptions } = useProviderQuestionOptions(
    selectedStageId || undefined,
  );

  // Map backend stages, subjects, instructors to Combobox options
  const educationalStages = optionsData?.educational_stages;
  const subjects = optionsData?.subjects;
  const instructors = optionsData?.instructors;

  const mappedStages = React.useMemo(() => {
    return (educationalStages || []).map((s) => ({
      id: s.id,
      name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
    }));
  }, [educationalStages, locale]);

  const mappedSubjects = React.useMemo(() => {
    return (subjects || []).map((s) => ({
      id: s.id,
      name: locale === "ar" ? s.name.ar || s.name.en || "" : s.name.en || s.name.ar || "",
    }));
  }, [subjects, locale]);

  const mappedInstructors = React.useMemo(() => {
    return (instructors || []).map((i) => ({
      id: i.id,
      full_name: i.full_name,
    }));
  }, [instructors]);

  // If initial props change or first loaded, sync selected values
  React.useEffect(() => {
    if (initialEducationalStageId) {
      setSelectedStageId(String(initialEducationalStageId));
    }
  }, [initialEducationalStageId]);

  React.useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjId(String(initialSubjectId));
    }
  }, [initialSubjectId]);

  React.useEffect(() => {
    if (initialInstructorId) {
      setSelectedInstId(String(initialInstructorId));
    }
  }, [initialInstructorId]);

  const handleStageChange = (newStage: string) => {
    setSelectedStageId(newStage);
    setSelectedSubjId(""); // reset dependent subject
  };

  // Input groups state
  const [type, setType] = React.useState<QuestionType>(initialQuestion?.type || "mcq");
  const [questionName, setQuestionName] = React.useState(initialQuestion?.questionName || "");
  const [questionContent, setQuestionContent] = React.useState(
    initialQuestion?.questionContent || "",
  );
  const [questionType, setQuestionType] = React.useState<QuestionKind>(
    initialQuestion?.questionType || "theoretical",
  );
  const [difficulty, setDifficulty] = React.useState<QuestionDifficulty>(
    initialQuestion?.difficulty || "medium",
  );
  const [grade, setGrade] = React.useState<number>(initialQuestion?.grade ?? 1);
  const [hasAnswerExplanation, setHasAnswerExplanation] = React.useState<boolean>(
    initialQuestion?.hasAnswerExplanation ?? false,
  );
  const [answerExplanation, setAnswerExplanation] = React.useState<string>(
    initialQuestion?.answerExplanation || "",
  );
  // Build question kinds options directly from backend optionsData.classifications
  const classifications = optionsData?.classifications;
  const questionKindOptions = React.useMemo(() => {
    if (classifications && Object.keys(classifications).length > 0) {
      return Object.entries(classifications).map(([key, label]) => ({
        value: key,
        label,
      }));
    }
    return [
      { value: "theoretical", label: t("kinds.theoretical") },
      { value: "practical", label: t("kinds.practical") },
      { value: "application-based", label: t("kinds.applicationBased") },
      { value: "analytical", label: t("kinds.analytical") },
      { value: "oral", label: t("kinds.oral") },
      { value: "skill-based", label: t("kinds.skillBased") },
    ];
  }, [classifications, t]);

  // Build sections options from provided sections prop
  const sectionOptions = React.useMemo(() => {
    return (sections || []).map((s) => ({ value: s.id, label: s.title }));
  }, [sections]);

  // Requirements & Answers
  const [modelAnswer, setModelAnswer] = React.useState(initialQuestion?.modelAnswer || "");
  const [options, setOptions] = React.useState<MCQOption[]>(
    initialQuestion?.options || [
      { id: "opt-1", text: "" },
      { id: "opt-2", text: "" },
    ],
  );

  React.useEffect(() => {
    if (initialQuestion) {
      setType(initialQuestion.type);
      setQuestionName(initialQuestion.questionName);
      setQuestionContent(initialQuestion.questionContent);
      setQuestionType(initialQuestion.questionType);
      setDifficulty(initialQuestion.difficulty);
      setGrade(initialQuestion.grade ?? 1);
      setHasAnswerExplanation(initialQuestion.hasAnswerExplanation);
      setAnswerExplanation(initialQuestion.answerExplanation || "");
      setModelAnswer(initialQuestion.modelAnswer || "");
      setOptions(
        initialQuestion.options || [
          { id: "opt-1", text: "" },
          { id: "opt-2", text: "" },
        ],
      );
    }
  }, [initialQuestion]);

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { id: `opt-${Date.now()}`, text: "" }]);
  };

  const handleUpdateOption = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleDeleteOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
    if (modelAnswer === id) setModelAnswer("");
  };

  const resetFormForNext = () => {
    setQuestionName("");
    setQuestionContent("");
    setModelAnswer("");
    setHasAnswerExplanation(false);
    setAnswerExplanation("");
    setOptions([
      { id: `opt-${Date.now()}-1`, text: "" },
      { id: `opt-${Date.now()}-2`, text: "" },
    ]);
  };

  const isAcademicValid =
    !allowEditableAcademicProps ||
    (Boolean(selectedStageId) &&
      Boolean(selectedSubjId) &&
      (optionsData?.requires_instructor_selection === false || Boolean(selectedInstId)));

  const isValid =
    Boolean(questionName.trim()) &&
    Boolean(questionContent.trim()) &&
    Boolean(questionType) &&
    Boolean(difficulty) &&
    isAcademicValid;

  const handleSaveInternal = (keepOpen: boolean = false) => {
    if (!isValid) return;

    const questionData: Question = {
      id: initialQuestion?.id || `q-${Date.now()}`,
      questionName: questionName.trim(),
      questionContent: questionContent.trim(),
      type,
      questionType,
      difficulty,
      grade: Number(grade) || 1,
      required: true,
      hasAnswerExplanation,
      answerExplanation: hasAnswerExplanation ? answerExplanation : undefined,
      modelAnswer,
      options: type === "mcq" ? options : undefined,
    };

    onSave(questionData, sectionId || undefined, keepOpen, {
      grade: selectedStageId,
      subject: selectedSubjId,
      teacherName: selectedInstId,
      educationalStageId: Number(selectedStageId) || undefined,
      subjectId: Number(selectedSubjId) || undefined,
      instructorId: Number(selectedInstId) || undefined,
    });

    if (keepOpen) {
      resetFormForNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Question Type Selection */}
      <FormSectionCard title={t("questionTypeSelector")} icon={ListOrdered}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setType("mcq");
              setModelAnswer("");
            }}
            className={cn(
              "p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-1.5",
              type === "mcq"
                ? "border-primary bg-primary/10 ring-2 ring-primary/20 font-bold"
                : "border-border bg-card hover:bg-muted/40",
            )}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <ListOrdered className="size-4 text-primary" />
              <span>{t("types.mcq")}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setType("true/false");
              setModelAnswer("true");
            }}
            className={cn(
              "p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-1.5",
              type === "true/false"
                ? "border-primary bg-primary/10 ring-2 ring-primary/20 font-bold"
                : "border-border bg-card hover:bg-muted/40",
            )}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <HelpCircle className="size-4 text-primary" />
              <span>{t("types.trueFalse")}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setType("text");
              setModelAnswer("");
            }}
            className={cn(
              "p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-1.5",
              type === "text"
                ? "border-primary bg-primary/10 ring-2 ring-primary/20 font-bold"
                : "border-border bg-card hover:bg-muted/40",
            )}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <FileText className="size-4 text-primary" />
              <span>{t("types.text")}</span>
            </div>
          </button>
        </div>
      </FormSectionCard>

      {/* 2. Basic Information Group */}
      <FormSectionCard title={t("basicInfoGroup")} icon={BookOpen} contentClassName="space-y-4">
        {/* Target Section Selection if sections provided */}
        {(sections && sections.length > 0) || sectionOptions.length > 0 ? (
          <div className="pb-2 border-b border-border/40">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">{t("targetSection")}</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSectionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {sectionOptions.map((sec) => (
                    <SelectItem key={sec.value} value={sec.value}>
                      {sec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {/* Question Name / Title */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="q-name" className="text-sm font-medium text-foreground">
            {t("questionName")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="q-name"
            value={questionName}
            onChange={(e) => setQuestionName(e.target.value)}
            placeholder={t("questionNamePlaceholder")}
          />
        </div>

        {/* Question Content Body */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="q-content" className="text-sm font-medium text-foreground">
            {t("questionContent")} <span className="text-destructive">*</span>
          </Label>
          <FormMarkdownEditor
            value={questionContent}
            onChange={setQuestionContent}
            placeholder={t("questionContentPlaceholder")}
          />
        </div>

        {/* Question Kind Classification & Difficulty Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <span>{t("questionKind")}</span>
              <span className="text-destructive">*</span>
            </Label>
            <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionKindOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <span>{t("difficulty")}</span>
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as QuestionDifficulty)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t("difficulties.easy")}</SelectItem>
                <SelectItem value="medium">{t("difficulties.medium")}</SelectItem>
                <SelectItem value="hard">{t("difficulties.hard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Answer Explanation Toggle */}
        <FormToggleSetting
          id="explanation-toggle"
          title={t("hasExplanationTitle")}
          subtitle={t("hasExplanationSubtitle")}
          checked={hasAnswerExplanation}
          onCheckedChange={setHasAnswerExplanation}
        />

        {hasAnswerExplanation && (
          <div className="flex flex-col gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
            <Label className="text-sm font-medium text-foreground">{t("explanationContent")}</Label>
            <FormMarkdownEditor
              value={answerExplanation}
              onChange={setAnswerExplanation}
              placeholder={t("explanationPlaceholder")}
            />
          </div>
        )}
      </FormSectionCard>

      {/* 3. Academic Context Info Group */}
      <QuestionAcademicContextSection
        allowEditableAcademicProps={allowEditableAcademicProps}
        selectedStageId={selectedStageId}
        onStageChange={handleStageChange}
        selectedSubjId={selectedSubjId}
        onSubjChange={setSelectedSubjId}
        selectedInstId={selectedInstId}
        onInstChange={setSelectedInstId}
        mappedStages={mappedStages}
        mappedSubjects={mappedSubjects}
        mappedInstructors={mappedInstructors}
        isLoadingOptions={isLoadingOptions}
        requiresInstructorSelection={optionsData?.requires_instructor_selection}
        examGrade={examGrade}
        examSubject={examSubject}
        examTeacherName={examTeacherName}
        t={t}
        tNew={tNew}
      />

      {/* 4. Question Requirements (Grade & Answer specifics) */}
      <FormSectionCard
        title={t("requirementsGroup")}
        icon={CheckCircle2}
        contentClassName="space-y-4"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="q-grade" className="text-sm font-medium text-foreground">
            {t("gradePoints")}
          </Label>
          <Input
            id="q-grade"
            type="number"
            min={1}
            max={100}
            className="w-24 h-9 text-center text-xs font-semibold"
            value={grade}
            onChange={(e) => setGrade(parseInt(e.target.value, 10) || 1)}
          />
        </div>

        {/* True / False Selection */}
        {type === "true/false" && (
          <div className="space-y-2 pt-2">
            <Label className="font-semibold text-xs text-foreground">
              {t("selectCorrectTrueFalse")}
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setModelAnswer("true")}
                className={cn(
                  "py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer",
                  modelAnswer === "true"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-2xs"
                    : "bg-card border-input hover:border-emerald-500/40 text-muted-foreground",
                )}
              >
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>{t("trueOption")}</span>
              </button>

              <button
                type="button"
                onClick={() => setModelAnswer("false")}
                className={cn(
                  "py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer",
                  modelAnswer === "false"
                    ? "bg-destructive/10 border-destructive text-destructive shadow-2xs"
                    : "bg-card border-input hover:border-destructive/40 text-muted-foreground",
                )}
              >
                <XCircle className="size-4 text-destructive" />
                <span>{t("falseOption")}</span>
              </button>
            </div>
          </div>
        )}

        {/* MCQ Options List */}
        {type === "mcq" && (
          <QuestionMcqOptionsList
            options={options}
            modelAnswer={modelAnswer}
            onModelAnswerChange={setModelAnswer}
            onAddOption={handleAddOption}
            onUpdateOption={handleUpdateOption}
            onDeleteOption={handleDeleteOption}
            labels={{
              mcqChoicesLabel: t("mcqChoicesLabel"),
              addChoice: t("addChoice"),
              markAsCorrect: t("markAsCorrect"),
              choicePlaceholder: t("choicePlaceholder"),
            }}
          />
        )}

        {/* Text Question Model Answer */}
        {type === "text" && (
          <div className="space-y-2 pt-2">
            <Label className="font-semibold text-xs text-foreground">{t("modelAnswerLabel")}</Label>
            <FormMarkdownEditor
              value={modelAnswer}
              onChange={setModelAnswer}
              placeholder={t("modelAnswerPlaceholder")}
            />
          </div>
        )}
      </FormSectionCard>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel || t("actions.cancel")}
          </Button>
        )}

        {showSaveAndAddAnother && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSaveInternal(true)}
            disabled={!isValid}
          >
            {t("actions.saveAndAddAnother")}
          </Button>
        )}

        <Button
          type="button"
          onClick={() => handleSaveInternal(false)}
          disabled={!isValid}
          className="font-semibold min-w-32"
        >
          {submitLabel || (initialQuestion ? t("actions.saveChanges") : t("actions.saveQuestion"))}
        </Button>
      </div>
    </div>
  );
}
