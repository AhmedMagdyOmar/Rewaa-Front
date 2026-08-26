/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { BookOpen, ChevronDown, ChevronUp, Import, Layers, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Exam, ExamSection, Question } from "@/types/exam";

interface ImportFromExamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableExams: Exam[];
  onImport: (importedSections: ExamSection[]) => void;
}

export function ImportFromExamsDialog({
  open,
  onOpenChange,
  availableExams,
  onImport,
}: ImportFromExamsDialogProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("exams.step2.importFromExamsDialog");
  const tQ = useTranslations("exams.questionDialog");
  const tStep2 = useTranslations("exams.step2");

  const [selectedExamId, setSelectedExamId] = React.useState<string>("");
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<string[]>([]);
  const [includedQuestionIds, setIncludedQuestionIds] = React.useState<Record<string, string[]>>(
    {},
  );
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});

  // Reset internal state when dialog opens or selected exam changes
  React.useEffect(() => {
    if (open) {
      if (availableExams.length > 0 && !selectedExamId) {
        const firstExam = availableExams[0];
        setSelectedExamId(firstExam.id);
        const sectionIds = firstExam.examSections.map((s) => s.id);
        setSelectedSectionIds(sectionIds);

        const initialQuestions: Record<string, string[]> = {};
        const initialExpanded: Record<string, boolean> = {};
        firstExam.examSections.forEach((s) => {
          initialQuestions[s.id] = s.questions.map((q) => q.id);
          initialExpanded[s.id] = true;
        });
        setIncludedQuestionIds(initialQuestions);
        setExpandedSections(initialExpanded);
      }
    }
  }, [open, availableExams, selectedExamId]);

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    const chosenExam = availableExams.find((e) => e.id === examId);
    if (chosenExam) {
      const sectionIds = chosenExam.examSections.map((s) => s.id);
      setSelectedSectionIds(sectionIds);
      const initialQuestions: Record<string, string[]> = {};
      const initialExpanded: Record<string, boolean> = {};
      chosenExam.examSections.forEach((s) => {
        initialQuestions[s.id] = s.questions.map((q) => q.id);
        initialExpanded[s.id] = true;
      });
      setIncludedQuestionIds(initialQuestions);
      setExpandedSections(initialExpanded);
    } else {
      setSelectedSectionIds([]);
      setIncludedQuestionIds({});
      setExpandedSections({});
    }
  };

  const selectedExam = React.useMemo(
    () => availableExams.find((e) => e.id === selectedExamId) || null,
    [availableExams, selectedExamId],
  );

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) => {
      const exists = prev.includes(sectionId);
      if (exists) {
        return prev.filter((id) => id !== sectionId);
      } else {
        // Automatically include all its questions when checked if not set
        if (!includedQuestionIds[sectionId] && selectedExam) {
          const sec = selectedExam.examSections.find((s) => s.id === sectionId);
          if (sec) {
            setIncludedQuestionIds((qPrev) => ({
              ...qPrev,
              [sectionId]: sec.questions.map((q) => q.id),
            }));
          }
        }
        setExpandedSections((ePrev) => ({ ...ePrev, [sectionId]: true }));
        return [...prev, sectionId];
      }
    });
  };

  const handleSelectAllSections = () => {
    if (!selectedExam) return;
    const allIds = selectedExam.examSections.map((s) => s.id);
    setSelectedSectionIds(allIds);
    const allQuestions: Record<string, string[]> = {};
    const allExpanded: Record<string, boolean> = {};
    selectedExam.examSections.forEach((s) => {
      allQuestions[s.id] = s.questions.map((q) => q.id);
      allExpanded[s.id] = true;
    });
    setIncludedQuestionIds(allQuestions);
    setExpandedSections(allExpanded);
  };

  const handleDeselectAllSections = () => {
    setSelectedSectionIds([]);
  };

  const toggleQuestion = (sectionId: string, questionId: string) => {
    setIncludedQuestionIds((prev) => {
      const currentList = prev[sectionId] || [];
      const exists = currentList.includes(questionId);
      const updated = exists
        ? currentList.filter((id) => id !== questionId)
        : [...currentList, questionId];
      return { ...prev, [sectionId]: updated };
    });
  };

  const toggleAllQuestionsInSection = (section: ExamSection) => {
    setIncludedQuestionIds((prev) => {
      const currentList = prev[section.id] || [];
      const allQIds = section.questions.map((q) => q.id);
      const isAllSelected = allQIds.every((id) => currentList.includes(id));

      return {
        ...prev,
        [section.id]: isAllSelected ? [] : allQIds,
      };
    });
  };

  const toggleExpandSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleImportSubmit = () => {
    if (!selectedExam || selectedSectionIds.length === 0) return;

    const sectionsToImport: ExamSection[] = selectedExam.examSections
      .filter((sec) => selectedSectionIds.includes(sec.id))
      .map((sec) => {
        const selectedQIds = includedQuestionIds[sec.id] || [];
        const filteredQuestions: Question[] = sec.questions
          .filter((q) => selectedQIds.includes(q.id))
          .map((q) => ({
            ...q,
            id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          }));

        return {
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: sec.title,
          subtitle: sec.subtitle,
          questions: filteredQuestions,
        };
      });

    onImport(sectionsToImport);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Import className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 max-h-[calc(90vh-140px)]">
          {/* Step 1: Select Source Exam */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen className="size-4 text-primary" />
              <span>{t("selectExamLabel")}</span>
            </Label>

            {availableExams.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">{t("noExamsAvailable")}</p>
            ) : (
              <Select value={selectedExamId} onValueChange={handleSelectExam}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={t("selectExamPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {availableExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id} className="cursor-pointer py-2.5">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-medium text-foreground">{exam.title}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted">
                            {exam.examSections.length} {isRTL ? "أقسام" : "sections"}
                          </span>
                          <span>•</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {exam.examSections.reduce((acc, s) => acc + s.questions.length, 0)}{" "}
                            {isRTL ? "سؤال" : "questions"}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Step 2: Multi-select Sections */}
          {selectedExam && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="size-4 text-primary" />
                  <span>{t("selectSectionsLabel")}</span>
                </Label>

                {selectedExam.examSections.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllSections}
                      className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                    >
                      {t("selectAllSections")}
                    </Button>
                    <span className="text-muted-foreground text-xs">•</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAllSections}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t("deselectAllSections")}
                    </Button>
                  </div>
                )}
              </div>

              {selectedExam.examSections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center border rounded-lg bg-muted/20">
                  {t("noSectionsInExam")}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedExam.examSections.map((sec, idx) => {
                    const isSelected = selectedSectionIds.includes(sec.id);
                    const qCount = sec.questions.length;
                    const ptsCount = sec.questions.reduce((a, q) => a + (q.grade || 1), 0);

                    return (
                      <div
                        key={sec.id}
                        onClick={() => toggleSection(sec.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-start",
                          isSelected
                            ? "border-primary/50 bg-primary/5 shadow-xs"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSection(sec.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            <span className="text-primary font-bold me-1.5">{idx + 1}.</span>
                            {sec.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{tStep2("questionsCount", { count: qCount })}</span>
                            <span>•</span>
                            <span>{tStep2("pointsCount", { count: ptsCount })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Granular Question Inclusion / Exclusion underneath for selected sections */}
          {selectedExam && selectedSectionIds.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  <span>{t("selectedSectionsTitle")}</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("selectedSectionsSubtitle")}
                </p>
              </div>

              <div className="space-y-3">
                {selectedExam.examSections
                  .filter((sec) => selectedSectionIds.includes(sec.id))
                  .map((sec, sIdx) => {
                    const selectedQIds = includedQuestionIds[sec.id] || [];
                    const allQIds = sec.questions.map((q) => q.id);
                    const isAllSelected =
                      sec.questions.length > 0 && allQIds.every((id) => selectedQIds.includes(id));
                    const isExpanded = expandedSections[sec.id] ?? true;

                    return (
                      <div
                        key={sec.id}
                        className="border border-border/80 rounded-xl overflow-hidden bg-card"
                      >
                        {/* Section Header Accordion Bar */}
                        <div className="p-3.5 bg-muted/40 flex items-center justify-between gap-3 border-b border-border/60">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleExpandSection(sec.id)}
                              className="size-6 rounded-md hover:bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="size-4" />
                              ) : (
                                <ChevronDown className="size-4" />
                              )}
                            </button>
                            <span className="size-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="font-semibold text-sm text-foreground truncate">
                              {sec.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-background text-muted-foreground shrink-0"
                            >
                              {selectedQIds.length} / {sec.questions.length}{" "}
                              {isRTL ? "محددة" : "selected"}
                            </Badge>
                          </div>

                          {sec.questions.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllQuestionsInSection(sec)}
                              className="h-7 px-2 text-xs text-primary hover:bg-primary/10 shrink-0"
                            >
                              {isAllSelected ? t("deselectAllQuestions") : t("selectAllQuestions")}
                            </Button>
                          )}
                        </div>

                        {/* Question Checklist */}
                        {isExpanded && (
                          <div className="p-3 space-y-2">
                            {sec.questions.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic py-2 text-center">
                                {t("noQuestionsInSection")}
                              </p>
                            ) : (
                              sec.questions.map((q, qIdx) => {
                                const isQSelected = selectedQIds.includes(q.id);

                                return (
                                  <div
                                    key={q.id}
                                    onClick={() => toggleQuestion(sec.id, q.id)}
                                    className={cn(
                                      "flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors cursor-pointer select-none gap-3",
                                      isQSelected
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-background/50 border-border/60 opacity-60 hover:opacity-100",
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <Checkbox
                                        checked={isQSelected}
                                        onCheckedChange={() => toggleQuestion(sec.id, q.id)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="font-medium text-foreground truncate">
                                        <span className="text-muted-foreground me-1">
                                          {qIdx + 1}.
                                        </span>
                                        {q.questionName}
                                      </span>

                                      {/* Badges */}
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1.5 py-0 h-4 bg-background text-muted-foreground shrink-0"
                                      >
                                        {tQ(
                                          `types.${q.type === "mcq" ? "mcq" : q.type === "true/false" ? "trueFalse" : "text"}`,
                                        )}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0"
                                      >
                                        {tStep2("pointsCount", { count: q.grade || 1 })}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pe-8 pt-4 pb-8 border-t border-border bg-muted/20 gap-2 flex items-center justify-between">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleImportSubmit}
            disabled={!selectedExam || selectedSectionIds.length === 0}
            className="gap-2 font-semibold"
          >
            <Import className="size-4" />
            <span>{t("importAction", { count: selectedSectionIds.length })}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
