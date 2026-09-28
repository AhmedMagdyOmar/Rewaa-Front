import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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

export function QuestionMcqOptionsList({
  options,
  modelAnswer,
  onModelAnswerChange,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  labels,
}: QuestionMcqOptionsListProps) {
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
          <div key={opt.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onModelAnswerChange(opt.id)}
              className={cn(
                "size-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                modelAnswer === opt.id
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-card border-input hover:border-emerald-500/50 text-muted-foreground",
              )}
              title={labels.markAsCorrect}
            >
              {modelAnswer === opt.id ? (
                <Check className="size-4 stroke-3" />
              ) : (
                <span className="text-xs font-semibold">{idx + 1}</span>
              )}
            </button>

            <Input
              value={opt.text}
              onChange={(e) => onUpdateOption(opt.id, e.target.value)}
              placeholder={`${labels.choicePlaceholder} ${idx + 1}`}
              className="text-xs"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={options.length <= 2}
              onClick={() => onDeleteOption(opt.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
