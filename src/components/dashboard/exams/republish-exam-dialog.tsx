/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackendExam } from "@/types/api-contracts";
import { Exam } from "@/types/exam";

interface RepublishExamDialogProps {
  examToRepublish: BackendExam | Exam | null;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
}

export function RepublishExamDialog({
  examToRepublish,
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: RepublishExamDialogProps) {
  const locale = useLocale();
  const t = useTranslations("exams.republishDialog");

  const [title, setTitle] = React.useState("");

  const originalTitle = React.useMemo(() => {
    if (!examToRepublish) return "";
    if (typeof examToRepublish.title === "string") return examToRepublish.title;
    return (
      examToRepublish.title?.[locale as "ar" | "en"] ||
      examToRepublish.title?.ar ||
      examToRepublish.title?.en ||
      ""
    );
  }, [examToRepublish, locale]);

  React.useEffect(() => {
    if (isOpen && examToRepublish) {
      const suffix = locale === "ar" ? " - نسخة جديدة" : " - New Copy";
      setTitle(`${originalTitle}${suffix}`);
    }
  }, [isOpen, examToRepublish, originalTitle, locale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;
    onConfirm(title.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Copy className="h-5 w-5 text-primary" />
              <span>{t("title")}</span>
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="republish-title" className="text-sm font-medium">
              {t("label")}
            </Label>
            <Input
              id="republish-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("placeholder")}
              disabled={isPending}
              autoFocus
              required
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{t("confirm")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
