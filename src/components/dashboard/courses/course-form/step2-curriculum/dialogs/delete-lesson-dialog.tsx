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
import { LessonToDeleteState } from "../../types";

interface DeleteLessonDialogProps {
  open: boolean;
  lessonToDelete: LessonToDeleteState | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteLessonDialog({
  open,
  lessonToDelete,
  onOpenChange,
  onConfirm,
}: DeleteLessonDialogProps) {
  const t = useTranslations("courses.new");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("step2.deleteLessonDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("step2.deleteLessonDialog.description", {
              title: lessonToDelete?.lesson.title || "",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("step2.deleteLessonDialog.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t("step2.deleteLessonDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
