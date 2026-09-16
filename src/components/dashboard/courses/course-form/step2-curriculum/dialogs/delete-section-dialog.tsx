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
import { CourseSection } from "@/types/course";

interface DeleteSectionDialogProps {
  open: boolean;
  section: CourseSection | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteSectionDialog({
  open,
  section,
  onOpenChange,
  onConfirm,
}: DeleteSectionDialogProps) {
  const t = useTranslations("courses.new");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("step2.deleteSectionDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("step2.deleteSectionDialog.description", {
              title: section?.title || "",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("step2.deleteSectionDialog.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t("step2.deleteSectionDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
