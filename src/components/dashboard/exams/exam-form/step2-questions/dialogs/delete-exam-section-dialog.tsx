"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExamSection } from "@/types/exam";

interface DeleteExamSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: ExamSection | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteExamSectionDialog({
  open,
  onOpenChange,
  section,
  onConfirm,
  onCancel,
}: DeleteExamSectionDialogProps) {
  const tForm = useTranslations("exams.form");
  const tStep2 = useTranslations("exams.step2");

  if (!section) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>{tStep2("deleteSectionDialog.title")}</DialogTitle>
          </div>
          <DialogDescription>
            {tStep2("deleteSectionDialog.subtitle", { title: section.title })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {tForm("actions.cancel")}
          </Button>
          <Button variant="destructive" type="button" onClick={onConfirm} className="gap-1.5">
            <Trash2 className="size-4" />
            <span>{tForm("actions.delete")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
