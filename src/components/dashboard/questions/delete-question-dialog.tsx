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
import { BackendQuestion } from "@/types/api-contracts";
import { Trash2 } from "lucide-react";

interface DeleteQuestionDialogProps {
  questionToDelete: BackendQuestion | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteQuestionDialog({
  questionToDelete,
  onClose,
  onConfirm,
}: DeleteQuestionDialogProps) {
  const t = useTranslations("questionsPage.deleteDialog");
  const questionTitle = questionToDelete
    ? typeof questionToDelete.title === "string"
      ? questionToDelete.title
      : questionToDelete.title?.ar || questionToDelete.title?.en || ""
    : "";

  return (
    <Dialog open={Boolean(questionToDelete)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>{t("title")}</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("description", { title: questionTitle })}
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
