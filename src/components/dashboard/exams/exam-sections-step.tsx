import {
  BookOpen,
  CheckCircle2,
  Edit2,
  FolderPlus,
  HelpCircle,
  ListOrdered,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExamSection, Question } from "@/types/exam";

interface ExamSectionsStepProps {
  examSections: ExamSection[];
  activeDialog: string | null;
  topButtons: Array<{ key: string; label: string; icon: LucideIcon }>;
  onTopButtonClick: (key: string) => void;
  onOpenAddQuestion: (secId: string) => void;
  onOpenEditQuestion: (q: Question, secId: string) => void;
  onDeleteQuestion: (secId: string, qId: string) => void;
  onOpenEditSection: (sec: ExamSection) => void;
  onOpenDeleteSection: (sec: ExamSection) => void;
  onBackToStep1: () => void;
  onSave: () => void;
  isSubmitting: boolean;
  title: string;
  mode: "create" | "edit";
  locale: string;
  t: (key: string) => string;
  tForm: (key: string) => string;
  tStep2: (key: string, values?: Record<string, string | number>) => string;
}

export function ExamSectionsStep({
  examSections,
  activeDialog,
  topButtons,
  onTopButtonClick,
  onOpenAddQuestion,
  onOpenEditQuestion,
  onDeleteQuestion,
  onOpenEditSection,
  onOpenDeleteSection,
  onBackToStep1,
  onSave,
  isSubmitting,
  title,
  mode,
  locale,
  t,
  tForm,
  tStep2,
}: ExamSectionsStepProps) {
  return (
    <div className="space-y-6">
      {/* 4 ACTION BUTTONS AT TOP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeDialog === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => onTopButtonClick(btn.key)}
              className={cn(
                "py-3.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 border shadow-2xs group cursor-pointer",
                isActive
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-card text-primary border-input hover:bg-primary hover:text-white hover:border-primary",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sections & Questions List */}
      <FormSectionCard
        title={tStep2("title")}
        description={tStep2("subtitle")}
        icon={BookOpen}
        contentClassName="space-y-4"
      >
        {examSections.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
            <FolderPlus className="size-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
              {tStep2("noSections")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {examSections.map((sec, sIdx) => {
              const sectionPoints = sec.questions.reduce((acc, q) => acc + (q.grade || 1), 0);
              return (
                <div key={sec.id} className="border rounded-xl p-4 bg-muted/20 space-y-3">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-semibold text-foreground text-base gap-2">
                    <span className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {sIdx + 1}
                      </span>
                      {sec.title}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground self-end sm:self-center">
                      <span>{tStep2("questionsCount", { count: sec.questions.length })}</span>
                      <span>•</span>
                      <span>{tStep2("pointsCount", { count: sectionPoints })}</span>

                      {/* Add Question to this section */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={tStep2("buttons.addQuestion")}
                        onClick={() => onOpenAddQuestion(sec.id)}
                        className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 ms-1"
                      >
                        <Plus className="size-3.5" />
                      </Button>

                      {/* Edit Section */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onOpenEditSection(sec)}
                        className="text-muted-foreground hover:text-primary h-7 w-7"
                        title={locale === "ar" ? "تعديل القسم" : "Edit section"}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      {/* Delete Section */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onOpenDeleteSection(sec)}
                        className="text-muted-foreground hover:text-destructive h-7 w-7"
                        title={locale === "ar" ? "حذف القسم" : "Delete section"}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Section Questions */}
                  {sec.questions.length > 0 ? (
                    <div className="ps-6 rtl:ps-0 rtl:pe-6 space-y-2 border-s rtl:border-s-0 rtl:border-e border-border">
                      {sec.questions.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-background border gap-2"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {q.type === "mcq" && (
                              <ListOrdered className="size-4 text-primary shrink-0" />
                            )}
                            {q.type === "true/false" && (
                              <HelpCircle className="size-4 text-amber-500 shrink-0" />
                            )}
                            {q.type === "text" && (
                              <BookOpen className="size-4 text-emerald-500 shrink-0" />
                            )}

                            <span className="font-semibold text-foreground">
                              {qIdx + 1}. {q.questionName}
                            </span>

                            {/* Badges */}
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-primary/5 text-primary border-primary/20"
                            >
                              {t(
                                `questionDialog.types.${q.type === "mcq" ? "mcq" : q.type === "true/false" ? "trueFalse" : "text"}`,
                              )}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="text-[10px] bg-muted/50 text-muted-foreground"
                            >
                              {t(`questionDialog.difficulties.${q.difficulty}`)}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            >
                              {tStep2("pointsCount", { count: q.grade || 1 })}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onOpenEditQuestion(q, sec.id)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onDeleteQuestion(sec.id, q.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic ps-6 rtl:ps-0 rtl:pe-6">
                      {tStep2("noQuestions")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </FormSectionCard>

      {/* Action Buttons Step 2 */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <Button variant="outline" type="button" onClick={onBackToStep1} disabled={isSubmitting}>
          {tForm("actions.backToStep1")}
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={onSave}
            disabled={isSubmitting || !title.trim()}
            className="gap-2 font-semibold"
          >
            <CheckCircle2 className="size-4" />
            <span>
              {mode === "create" ? tForm("actions.createExam") : tForm("actions.saveChanges")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
