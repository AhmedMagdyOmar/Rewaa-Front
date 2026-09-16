"use client";

import { useTranslations } from "next-intl";
import { FolderPlus, Video as VideoIcon, ListOrdered, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogType } from "../types";

interface CurriculumActionsBarProps {
  activeDialog: DialogType;
  onOpenAddSection: () => void;
  onOpenAddLesson: () => void;
  onOpenArrangeSections: () => void;
  onOpenImportSections: () => void;
}

export function CurriculumActionsBar({
  activeDialog,
  onOpenAddSection,
  onOpenAddLesson,
  onOpenArrangeSections,
  onOpenImportSections,
}: CurriculumActionsBarProps) {
  const t = useTranslations("courses.new");

  const buttons = [
    {
      key: "section" as const,
      label: t("actions.addSection"),
      icon: FolderPlus,
      action: onOpenAddSection,
    },
    {
      key: "lesson" as const,
      label: t("actions.addLesson"),
      icon: VideoIcon,
      action: onOpenAddLesson,
    },
    {
      key: "arrange" as const,
      label: t("actions.arrangeSections"),
      icon: ListOrdered,
      action: onOpenArrangeSections,
    },
    {
      key: "import" as const,
      label: t("actions.importFromCourses"),
      icon: Download,
      action: onOpenImportSections,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {buttons.map((btn) => {
        const Icon = btn.icon;
        const isActive = activeDialog === btn.key;
        return (
          <button
            key={btn.key}
            type="button"
            onClick={btn.action}
            className={cn(
              "py-3.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 border shadow-2xs group cursor-pointer text-center",
              isActive
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-card text-primary border-input hover:bg-primary hover:text-white hover:border-primary",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}
