/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { CheckSquare, HelpCircle, Plus, Search, Sparkles, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionFormContent } from "@/components/dashboard/questions/question-form-content";
import { useProviderQuestions } from "@/hooks/use-questions";
import { mapBackendQuestionToFrontend } from "@/lib/adapters/exam-adapters";
import { cn } from "@/lib/utils";
import { ExamSection, Question, QuestionDifficulty, QuestionType } from "@/types/exam";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: ExamSection[];
  initialQuestion?: Question | null;
  initialSectionId?: string;
  examGrade?: string;
  examSubject?: string;
  examTeacherName?: string;
  onSave: (question: Question, sectionId: string, keepOpen?: boolean) => void;
  onSaveMany?: (questions: Question[], sectionId: string) => void;
}

export function QuestionDialog({
  open,
  onOpenChange,
  sections,
  initialQuestion,
  initialSectionId,
  examGrade,
  examSubject,
  examTeacherName,
  onSave,
  onSaveMany,
}: QuestionDialogProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("exams.questionDialog");
  const tDiff = useTranslations("exams.stats.difficulty");

  // Tab State: "create" | "bank"
  const [activeTab, setActiveTab] = React.useState<"create" | "bank">("create");

  // Bank Tab State
  const [bankSectionId, setBankSectionId] = React.useState<string>(
    initialSectionId || sections[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterDifficulty, setFilterDifficulty] = React.useState<string>("all");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [selectedQuestionIds, setSelectedQuestionIds] = React.useState<string[]>([]);

  // Fetch Questions from Question Bank (only standalone master questions)
  const { data: questionsData, isLoading: isLoadingQuestions } = useProviderQuestions({
    per_page: 100,
    is_standalone: true,
    educational_stage_id: examGrade || undefined,
    subject_id: examSubject || undefined,
    difficulty: filterDifficulty !== "all" ? filterDifficulty : undefined,
    type: filterType !== "all" ? filterType : undefined,
    search: searchQuery.trim() || undefined,
  });

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveTab("create");
      setBankSectionId(initialSectionId || sections[0]?.id || "");
      setSelectedQuestionIds([]);
      setSearchQuery("");
      setFilterDifficulty("all");
      setFilterType("all");
    }
  }, [open, initialSectionId, sections]);

  const handleSaveInternal = (question: Question, sectionId?: string, keepOpen?: boolean) => {
    onSave(question, sectionId || sections[0]?.id || "", keepOpen);
    if (!keepOpen) {
      onOpenChange(false);
    }
  };

  // Filter out questions that already exist in any section of this exam
  const availableBankQuestions = React.useMemo(() => {
    if (!questionsData?.questions) return [];
    const existingQuestionIds = new Set(
      sections.flatMap((s) => s.questions.map((q) => String(q.id))),
    );

    return questionsData.questions.filter((bq) => !existingQuestionIds.has(String(bq.id)));
  }, [questionsData, sections]);

  // Toggle selection for a single question
  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Select all or deselect all available questions
  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.length === availableBankQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(availableBankQuestions.map((q) => String(q.id)));
    }
  };

  // Submit bank questions
  const handleSaveBankQuestions = () => {
    if (selectedQuestionIds.length === 0 || !bankSectionId) return;

    const chosenBackendQuestions = availableBankQuestions.filter((q) =>
      selectedQuestionIds.includes(String(q.id)),
    );

    const mappedQuestions: Question[] = chosenBackendQuestions.map((bq) =>
      mapBackendQuestionToFrontend(bq, locale),
    );

    if (onSaveMany) {
      onSaveMany(mappedQuestions, bankSectionId);
    } else {
      mappedQuestions.forEach((q) => onSave(q, bankSectionId));
    }

    onOpenChange(false);
  };

  const difficultyConfig: Record<
    QuestionDifficulty,
    { label: string; dotColor: string; textColor: string; bgColor: string }
  > = {
    easy: {
      label: tDiff("easy"),
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    },
    medium: {
      label: tDiff("medium"),
      dotColor: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    },
    hard: {
      label: tDiff("hard"),
      dotColor: "bg-rose-500",
      textColor: "text-rose-600",
      bgColor: "bg-rose-500/10 border-rose-500/20 text-rose-600",
    },
  };

  const getTypeLabel = (type: QuestionType | string) => {
    switch (type) {
      case "mcq":
      case "multiple_choice":
        return isAr ? "اختيار من متعدد" : "Multiple Choice";
      case "true/false":
      case "true_false":
        return isAr ? "صح أم خطأ" : "True / False";
      case "text":
      case "essay":
        return isAr ? "مقالي / نصي" : "Essay";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-primary" />
            {initialQuestion ? t("editQuestionTitle") : t("addQuestionTitle")}
          </DialogTitle>
          <DialogDescription>{t("dialogSubtitle")}</DialogDescription>

          {!initialQuestion && (
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "create" | "bank")}
              className="w-full mt-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">
                  {isAr ? "إنشاء سؤال جديد" : "Create New Question"}
                </TabsTrigger>
                <TabsTrigger value="bank">
                  {isAr ? "اختيار من بنك الأسئلة" : "Choose from Question Bank"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </DialogHeader>

        {activeTab === "create" || initialQuestion ? (
          <div className="py-2">
            <QuestionFormContent
              initialQuestion={initialQuestion}
              sections={sections}
              initialSectionId={initialSectionId}
              examGrade={examGrade}
              examSubject={examSubject}
              examTeacherName={examTeacherName}
              onSave={handleSaveInternal}
              onCancel={() => onOpenChange(false)}
              showSaveAndAddAnother={!initialQuestion}
            />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* 1. Target Section Selector */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border bg-muted/20">
              <label htmlFor="bank-target-sec" className="text-sm font-semibold text-foreground">
                {isAr ? "القسم المستهدف" : "Target Section"}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Select value={bankSectionId} onValueChange={setBankSectionId}>
                <SelectTrigger id="bank-target-sec" className="w-full bg-background">
                  <SelectValue placeholder={isAr ? "اختر القسم..." : "Select section..."} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Search and Filters Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-muted/20 p-4 rounded-xl border">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث في بنك الأسئلة..." : "Search question bank..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 bg-background"
                />
              </div>

              {/* Difficulty Filter */}
              <div className="w-full sm:w-36 shrink-0">
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder={isAr ? "الصعوبة" : "Difficulty"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "كل الصعوبات" : "All Difficulties"}</SelectItem>
                    <SelectItem value="easy">{tDiff("easy")}</SelectItem>
                    <SelectItem value="medium">{tDiff("medium")}</SelectItem>
                    <SelectItem value="hard">{tDiff("hard")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="w-full sm:w-40 shrink-0">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder={isAr ? "نوع السؤال" : "Question Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "كل الأنواع" : "All Types"}</SelectItem>
                    <SelectItem value="multiple_choice">
                      {isAr ? "اختيار من متعدد" : "Multiple Choice"}
                    </SelectItem>
                    <SelectItem value="true_false">
                      {isAr ? "صح أم خطأ" : "True / False"}
                    </SelectItem>
                    <SelectItem value="essay">{isAr ? "مقالي" : "Essay"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. Selection Summary Header */}
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-muted-foreground font-medium">
                {isAr ? "الأسئلة المتاحة:" : "Available questions:"}{" "}
                <span className="font-bold text-foreground">{availableBankQuestions.length}</span>
              </span>

              {availableBankQuestions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleSelectAll}
                  className="text-xs h-8 gap-1.5 text-primary hover:text-primary"
                >
                  {selectedQuestionIds.length === availableBankQuestions.length ? (
                    <>
                      <Square className="size-3.5" />
                      <span>{isAr ? "إلغاء تحديد الكل" : "Deselect All"}</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="size-3.5" />
                      <span>{isAr ? "تحديد الكل" : "Select All"}</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* 4. Questions List */}
            <div className="space-y-2.5 max-h-90 overflow-y-auto pe-1">
              {isLoadingQuestions ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : availableBankQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border bg-muted/10">
                  <HelpCircle className="size-10 text-muted-foreground/40 mb-2" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {isAr ? "لا توجد أسئلة متاحة" : "No questions available"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {isAr
                      ? "لم يتم العثور على أسئلة في بنك الأسئلة تطابق معايير البحث الحالية."
                      : "No questions found matching the selected filters in the question bank."}
                  </p>
                </div>
              ) : (
                availableBankQuestions.map((bq) => {
                  const idStr = String(bq.id);
                  const isSelected = selectedQuestionIds.includes(idStr);
                  const title = isAr ? bq.title.ar || bq.title.en : bq.title.en || bq.title.ar;
                  const body = bq.body
                    ? isAr
                      ? bq.body.ar || bq.body.en
                      : bq.body.en || bq.body.ar
                    : "";
                  const diff = (bq.difficulty || "medium") as QuestionDifficulty;
                  const diffStyle = difficultyConfig[diff] || difficultyConfig.medium;

                  return (
                    <div
                      key={bq.id}
                      onClick={() => toggleQuestionSelection(idStr)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:bg-muted/40",
                      )}
                    >
                      <div className="pt-0.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleQuestionSelection(idStr)}
                          className="data-checked:bg-primary data-checked:border-primary"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-foreground leading-snug wrap-break-word whitespace-normal flex-1">
                            {title}
                          </h4>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {/* Type Badge */}
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-muted/60 text-muted-foreground"
                            >
                              {getTypeLabel(bq.type)}
                            </Badge>

                            {/* Difficulty Badge */}
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-semibold", diffStyle.bgColor)}
                            >
                              {diffStyle.label}
                            </Badge>

                            {/* Score Badge */}
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20"
                            >
                              {bq.score} {isAr ? "درجة" : "marks"}
                            </Badge>
                          </div>
                        </div>

                        {body && body !== title && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed wrap-break-word whitespace-normal">
                            {body}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. Dialog Footer */}
            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={handleSaveBankQuestions}
                disabled={selectedQuestionIds.length === 0 || !bankSectionId}
                className="gap-2 font-semibold"
              >
                <Plus className="size-4" />
                <span>
                  {isAr
                    ? `إضافة الأسئلة المختارة (${selectedQuestionIds.length})`
                    : `Add Selected Questions (${selectedQuestionIds.length})`}
                </span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
