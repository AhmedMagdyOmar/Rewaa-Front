"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { CourseSection } from "@/types/course";

interface ArrangeSectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: CourseSection[];
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onClose: () => void;
}

export function ArrangeSectionsDialog({
  open,
  onOpenChange,
  sections,
  onMoveSection,
  onClose,
}: ArrangeSectionsDialogProps) {
  const t = useTranslations("courses.new");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("step2.arrangeDialog.title")}</DialogTitle>
          <DialogDescription>{t("step2.arrangeDialog.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              {t("step2.noSections")}
            </p>
          ) : (
            sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/40"
              >
                <span className="text-sm font-medium text-foreground">
                  {idx + 1}. {sec.title}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={idx === 0}
                    onClick={() => onMoveSection(idx, "up")}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={idx === sections.length - 1}
                    onClick={() => onMoveSection(idx, "down")}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t("step2.arrangeDialog.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
