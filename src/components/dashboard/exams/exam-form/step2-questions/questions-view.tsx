"use client";

import { ArrangeSectionsDialog } from "@/components/dashboard/common/arrange-sections-dialog";
import { ImportFromExamsDialog } from "@/components/dashboard/exams/import-from-exams-dialog";
import { QuestionDialog } from "@/components/dashboard/exams/question-dialog";
import { Button } from "@/components/ui/button";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  FolderPlus,
  Import,
  LucideIcon,
  Plus,
  Shuffle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useExamSectionsManagement } from "../hooks/use-exam-sections-management";
import { ExamDialogType, ParentExamContext } from "../types";
import { DeleteExamSectionDialog } from "./dialogs/delete-exam-section-dialog";
import { ExamSectionDialog } from "./dialogs/exam-section-dialog";
import { ExamSectionItem } from "./exam-section-item";

interface QuestionsViewProps {
  examId: string | number;
  locale: string;
  isEditing?: boolean;
  parentExamContext: ParentExamContext;
  onBackToStep1: () => void;
  onFinish: () => void;
}

export function QuestionsView({
  examId,
  locale,
  isEditing,
  parentExamContext,
  onBackToStep1,
  onFinish,
}: QuestionsViewProps) {
  const tForm = useTranslations("exams.form");
  const tStep2 = useTranslations("exams.step2");

  const mgr = useExamSectionsManagement({
    examId,
    locale,
    parentExamContext,
  });

  const topButtons: Array<{ key: string; label: string; icon: LucideIcon }> = [
    { key: "question", label: tStep2("buttons.addQuestion"), icon: Plus },
    { key: "section", label: tStep2("buttons.addSection"), icon: FolderPlus },
    { key: "arrange", label: tStep2("buttons.arrangeSections"), icon: Shuffle },
    { key: "import", label: tStep2("buttons.importOtherExams"), icon: Import },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Action buttons at top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = mgr.activeDialog === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => {
                if (btn.key === "question") {
                  mgr.handleOpenAddQuestion();
                } else if (btn.key === "section") {
                  mgr.handleOpenAddSection();
                } else {
                  mgr.setActiveDialog(btn.key as ExamDialogType);
                }
              }}
              className={cn(
                "py-3.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 border shadow-2xs group cursor-pointer",
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

      {/* Sections & Questions List */}
      <FormSectionCard
        title={tStep2("title")}
        description={tStep2("subtitle")}
        icon={BookOpen}
        contentClassName="space-y-4"
      >
        {mgr.sections.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
            <FolderPlus className="size-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
              {tStep2("noSections")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mgr.sections.map((sec, sIdx) => (
              <ExamSectionItem
                key={sec.id}
                section={sec}
                index={sIdx}
                locale={locale}
                onAddQuestion={mgr.handleOpenAddQuestion}
                onEditQuestion={mgr.handleOpenEditQuestion}
                onDeleteQuestion={mgr.handleDeleteQuestion}
                onEditSection={mgr.handleOpenEditSection}
                onDeleteSection={mgr.setSectionToDelete}
              />
            ))}
          </div>
        )}
      </FormSectionCard>

      {/* Step 2 Bottom Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <Button variant="outline" type="button" onClick={onBackToStep1} disabled={mgr.isSubmitting}>
          {tForm("actions.backToStep1")}
        </Button>

        <Button
          type="button"
          onClick={onFinish}
          disabled={mgr.isSubmitting}
          className="gap-2 font-semibold"
        >
          <CheckCircle2 className="size-4" />
          <span>{isEditing ? tForm("actions.saveChanges") : tForm("actions.createExam")}</span>
        </Button>
      </div>

      {/* Section Form Dialog (Add / Edit) */}
      <ExamSectionDialog
        open={mgr.activeDialog === "section"}
        onOpenChange={(open) => {
          if (!open) {
            mgr.setEditingSection(null);
            mgr.setActiveDialog(null);
          }
        }}
        isEditing={Boolean(mgr.editingSection)}
        title={mgr.editingSection ? mgr.editSecTitle : mgr.newSecTitle}
        onTitleChange={mgr.editingSection ? mgr.setEditSecTitle : mgr.setNewSecTitle}
        onSave={mgr.handleSaveSection}
        onCancel={() => {
          mgr.setEditingSection(null);
          mgr.setActiveDialog(null);
        }}
      />

      {/* Delete Section Dialog */}
      <DeleteExamSectionDialog
        open={Boolean(mgr.sectionToDelete)}
        onOpenChange={(open) => {
          if (!open) mgr.setSectionToDelete(null);
        }}
        section={mgr.sectionToDelete}
        onConfirm={mgr.handleDeleteSection}
        onCancel={() => mgr.setSectionToDelete(null)}
      />

      {/* Arrange Sections Dialog */}
      <ArrangeSectionsDialog
        open={mgr.activeDialog === "arrange"}
        onOpenChange={(open) => !open && mgr.setActiveDialog(null)}
        items={mgr.sections}
        onReorder={mgr.handleReorderSections}
      />

      {/* Import From Other Exams Dialog */}
      <ImportFromExamsDialog
        open={mgr.activeDialog === "import"}
        onOpenChange={(open) => !open && mgr.setActiveDialog(null)}
        availableExams={mgr.allExams}
        onImport={mgr.handleImportSections}
      />

      {/* Question Dialog (Create / Bank) */}
      <QuestionDialog
        open={mgr.activeDialog === "question"}
        onOpenChange={(open) => {
          if (!open) mgr.setEditingQuestion(null);
          mgr.setActiveDialog(open ? "question" : null);
        }}
        sections={mgr.sections}
        initialQuestion={mgr.editingQuestion?.question || null}
        initialSectionId={mgr.editingQuestion?.sectionId || mgr.targetQuestionSectionId}
        isSectionLocked={mgr.isQuestionSectionLocked}
        examGrade={parentExamContext.grade}
        examSubject={parentExamContext.subject}
        examTeacherName={parentExamContext.teacherName}
        onSave={mgr.handleSaveQuestion}
        onSaveMany={mgr.handleSaveManyQuestions}
      />
    </div>
  );
}
