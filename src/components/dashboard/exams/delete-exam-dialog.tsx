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
import { Exam } from "@/types/exam";
import { BackendExam } from "@/types/api-contracts";
import { Trash2 } from "lucide-react";

interface DeleteExamDialogProps {
  examToDelete: BackendExam | Exam | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteExamDialog({ examToDelete, onClose, onConfirm }: DeleteExamDialogProps) {
  const t = useTranslations("exams.deleteDialog");
  const examTitle = examToDelete
    ? typeof examToDelete.title === "string"
      ? examToDelete.title
      : examToDelete.title?.ar || examToDelete.title?.en || ""
    : "";

  return (
    <Dialog open={Boolean(examToDelete)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>{t("title")}</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("description", { title: examTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          <Button variant="outline" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" type="button" onClick={onConfirm}>
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
