"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import {
  BackendCourseContentSection,
  BackendCourseContentSectionLessonExam,
} from "@/types/api-contracts";
import { FileCheck, FileSpreadsheet, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

interface StudentLockedSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockedSection: BackendCourseContentSection | null;
  requiredExam?: BackendCourseContentSectionLessonExam | null;
}

export function StudentLockedSectionDialog({
  open,
  onOpenChange,
  lockedSection,
  requiredExam,
}: StudentLockedSectionDialogProps) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.courseDetails.locked");

  const sectionTitle =
    lockedSection?.title?.[locale] || lockedSection?.title?.ar || lockedSection?.title?.en || "";
  const examTitle =
    requiredExam?.title?.[locale] || requiredExam?.title?.ar || requiredExam?.title?.en || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl sm:rounded-3xl gap-5">
        <DialogHeader className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="size-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
            <Lock className="size-7" />
          </div>
          <div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
              {t("dialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {t("dialogDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Highlight the locked section & the required exam to unlock */}
        <div className="space-y-2.5 bg-muted/40 p-4 rounded-xl border border-border/70 text-xs">
          {lockedSection && (
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">{t("badge")}:</span>
              <span className="font-bold text-foreground truncate max-w-55">{sectionTitle}</span>
            </div>
          )}

          {requiredExam && (
            <div className="space-y-1.5 pt-1">
              <div className="text-muted-foreground font-medium">{t("prerequisiteExam")}</div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background border border-amber-500/30 text-amber-800">
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  <FileSpreadsheet className="size-4 shrink-0 text-amber-600" />
                  <span className="font-bold truncate text-xs">{examTitle}</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 border-amber-500/30 text-amber-700 text-[10px] shrink-0"
                >
                  {t("examRequired")}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl text-xs sm:text-sm font-semibold"
          >
            {t("close")}
          </Button>

          {requiredExam && (
            <Button
              asChild
              className="flex-1 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs"
            >
              <Link
                href={`/student-dashboard/exams/${requiredExam.id}`}
                onClick={() => onOpenChange(false)}
              >
                <span>{t("takeExamCta")}</span>
                <FileCheck className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
