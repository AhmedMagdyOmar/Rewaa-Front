import * as React from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getOptionLetter } from "@/lib/utils";
import type { MCQOption } from "@/types/exam";

interface QuestionMcqOptionsListProps {
  options: MCQOption[];
  modelAnswer: string;
  onModelAnswerChange: (optId: string) => void;
  onAddOption: () => void;
  onUpdateOption: (id: string, text: string) => void;
  onDeleteOption: (id: string) => void;
  labels: {
    mcqChoicesLabel: string;
    addChoice: string;
    markAsCorrect: string;
    choicePlaceholder: string;
  };
}

interface McqOptionRowProps {
  opt: MCQOption;
  idx: number;
  locale: string;
  isCorrect: boolean;
  canDelete: boolean;
  onModelAnswerChange: (id: string) => void;
  onUpdateOption: (id: string, text: string) => void;
  onDeleteOption: (id: string) => void;
  labels: {
    markAsCorrect: string;
    choicePlaceholder: string;
  };
}

const McqOptionRow = React.memo(function McqOptionRow({
  opt,
  idx,
  locale,
  isCorrect,
  canDelete,
  onModelAnswerChange,
  onUpdateOption,
  onDeleteOption,
  labels,
}: McqOptionRowProps) {
  const letter = getOptionLetter(idx, locale);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onModelAnswerChange(opt.id)}
        className={cn(
          "size-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
          isCorrect
            ? "bg-emerald-500 text-white border-emerald-500"
            : "bg-card border-input hover:border-emerald-500/50 text-muted-foreground",
        )}
        title={labels.markAsCorrect}
      >
        {isCorrect ? (
          <Check className="size-4 stroke-3" />
        ) : (
          <span className="text-xs font-semibold">{letter}</span>
        )}
      </button>

      <Input
        value={opt.text}
        onChange={(e) => onUpdateOption(opt.id, e.target.value)}
        placeholder={`${labels.choicePlaceholder} ${letter}`}
        className="text-xs"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={!canDelete}
        onClick={() => onDeleteOption(opt.id)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
});

export const QuestionMcqOptionsList = React.memo(function QuestionMcqOptionsList({
  options,
  modelAnswer,
  onModelAnswerChange,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  labels,
}: QuestionMcqOptionsListProps) {
  const locale = useLocale();

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-xs text-foreground">{labels.mcqChoicesLabel}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddOption}
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>{labels.addChoice}</span>
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <McqOptionRow
            key={opt.id}
            opt={opt}
            idx={idx}
            locale={locale}
            isCorrect={modelAnswer === opt.id}
            canDelete={options.length > 2}
            onModelAnswerChange={onModelAnswerChange}
            onUpdateOption={onUpdateOption}
            onDeleteOption={onDeleteOption}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );
});
