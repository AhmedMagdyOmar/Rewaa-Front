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
import { Loader2 } from "lucide-react";
import { LessonToDeleteState } from "../../types";

interface DeleteLessonDialogProps {
  open: boolean;
  lessonToDelete: LessonToDeleteState | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteLessonDialog({
  open,
  lessonToDelete,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteLessonDialogProps) {
  const t = useTranslations("courses.new");

  return (
    <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
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
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            {t("step2.deleteLessonDialog.cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={onConfirm}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("step2.deleteLessonDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
