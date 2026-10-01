"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExamSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ExamSectionDialog({
  open,
  onOpenChange,
  isEditing,
  title,
  onTitleChange,
  onSave,
  onCancel,
}: ExamSectionDialogProps) {
  const tForm = useTranslations("exams.form");
  const tStep2 = useTranslations("exams.step2");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? tStep2("addSectionDialog.editTitle", { default: "تعديل القسم" })
              : tStep2("addSectionDialog.title")}
          </DialogTitle>
          <DialogDescription>{tStep2("addSectionDialog.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="exam-sec-title-input" className="text-sm font-medium text-foreground">
              {tStep2("addSectionDialog.titleLabel")}
            </Label>
            <Input
              id="exam-sec-title-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={tStep2("addSectionDialog.titlePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  e.preventDefault();
                  onSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {tForm("actions.cancel")}
          </Button>
          <Button type="button" onClick={onSave} disabled={!title.trim()}>
            {isEditing ? tForm("actions.save") : tStep2("addSectionDialog.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
