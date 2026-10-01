"use client";

import { BookOpen, Edit2, HelpCircle, ListOrdered, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExamSection, Question } from "@/types/exam";

interface ExamSectionItemProps {
  section: ExamSection;
  index: number;
  locale: string;
  onAddQuestion: (secId: string) => void;
  onEditQuestion: (q: Question, secId: string) => void;
  onDeleteQuestion: (secId: string, qId: string) => void;
  onEditSection: (sec: ExamSection) => void;
  onDeleteSection: (sec: ExamSection) => void;
}

export function ExamSectionItem({
  section,
  index,
  locale,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onEditSection,
  onDeleteSection,
}: ExamSectionItemProps) {
  const t = useTranslations("exams");
  const tStep2 = useTranslations("exams.step2");

  const sectionPoints = section.questions.reduce((acc, q) => acc + (q.grade || 1), 0);

  return (
    <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between font-semibold text-foreground text-base gap-2">
        <span className="flex items-center gap-2">
          <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            {index + 1}
          </span>
          {section.title}
        </span>

        <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground self-end sm:self-center">
          <span>{tStep2("questionsCount", { count: section.questions.length })}</span>
          <span>•</span>
          <span>{tStep2("pointsCount", { count: sectionPoints })}</span>

          {/* Add Question to this section */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={tStep2("buttons.addQuestion")}
            onClick={() => onAddQuestion(section.id)}
            className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 ms-1 cursor-pointer"
          >
            <Plus className="size-3.5" />
          </Button>

          {/* Edit Section */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onEditSection(section)}
            className="text-muted-foreground hover:text-primary h-7 w-7 cursor-pointer"
            title={locale === "ar" ? "تعديل القسم" : "Edit section"}
          >
            <Edit2 className="size-3.5" />
          </Button>

          {/* Delete Section */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onDeleteSection(section)}
            className="text-muted-foreground hover:text-destructive h-7 w-7 cursor-pointer"
            title={locale === "ar" ? "حذف القسم" : "Delete section"}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Section Questions */}
      {section.questions.length > 0 ? (
        <div className="ps-6 rtl:ps-0 rtl:pe-6 space-y-2 border-s rtl:border-s-0 rtl:border-e border-border">
          {section.questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-background border gap-2"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                {q.type === "mcq" && <ListOrdered className="size-4 text-primary shrink-0" />}
                {q.type === "true/false" && (
                  <HelpCircle className="size-4 text-amber-500 shrink-0" />
                )}
                {q.type === "text" && <BookOpen className="size-4 text-emerald-500 shrink-0" />}

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

                <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground">
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
                  onClick={() => onEditQuestion(q, section.id)}
                  className="text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDeleteQuestion(section.id, q.id)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer"
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
}
