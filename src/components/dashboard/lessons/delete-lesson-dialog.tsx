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
import { Lesson } from "@/types/course";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteLessonDialogProps {
  lessonToDelete: Lesson | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteLessonDialog({
  lessonToDelete,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteLessonDialogProps) {
  const t = useTranslations("lessons.deleteDialog");

  return (
    <Dialog
      open={Boolean(lessonToDelete)}
      onOpenChange={(open) => !isDeleting && !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>{t("title")}</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("description", { title: lessonToDelete?.title || "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          <Button variant="outline" type="button" disabled={isDeleting} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" type="button" disabled={isDeleting} onClick={onConfirm}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
