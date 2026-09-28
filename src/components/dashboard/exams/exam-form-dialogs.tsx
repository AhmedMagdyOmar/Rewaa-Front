import { Trash2 } from "lucide-react";
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
import { ArrangeSectionsDialog } from "@/components/dashboard/common/arrange-sections-dialog";
import { ImportFromExamsDialog } from "@/components/dashboard/exams/import-from-exams-dialog";
import { QuestionDialog } from "@/components/dashboard/exams/question-dialog";
import type { Exam, ExamSection, Question } from "@/types/exam";

interface ExamFormDialogsProps {
  activeDialog: string | null;
  onActiveDialogChange: (dialog: string | null) => void;
  newSecTitle: string;
  onNewSecTitleChange: (title: string) => void;
  onAddSection: () => void;
  editingSection: ExamSection | null;
  editSecTitle: string;
  onEditSecTitleChange: (title: string) => void;
  onSaveEditSection: () => void;
  onCancelEditSection: () => void;
  sectionToDelete: ExamSection | null;
  onCancelDeleteSection: () => void;
  onConfirmDeleteSection: () => void;
  examSections: ExamSection[];
  onReorderSections: (sections: ExamSection[]) => void;
  editingQuestion: { question: Question; sectionId: string } | null;
  targetQuestionSectionId: string;
  onEditingQuestionChange: (val: { question: Question; sectionId: string } | null) => void;
  grade: string;
  subject: string;
  teacherName: string;
  onSaveQuestion: (question: Question, targetSecId: string, keepOpen?: boolean) => Promise<void>;
  onSaveManyQuestions: (questions: Question[], targetSecId: string) => Promise<void>;
  allExams: Exam[];
  onImportSections: (sections: ExamSection[]) => void;
  tForm: (key: string) => string;
  tStep2: (key: string, values?: Record<string, string | number>) => string;
}

export function ExamFormDialogs({
  activeDialog,
  onActiveDialogChange,
  newSecTitle,
  onNewSecTitleChange,
  onAddSection,
  editingSection,
  editSecTitle,
  onEditSecTitleChange,
  onSaveEditSection,
  onCancelEditSection,
  sectionToDelete,
  onCancelDeleteSection,
  onConfirmDeleteSection,
  examSections,
  onReorderSections,
  editingQuestion,
  targetQuestionSectionId,
  onEditingQuestionChange,
  grade,
  subject,
  teacherName,
  onSaveQuestion,
  onSaveManyQuestions,
  allExams,
  onImportSections,
  tForm,
  tStep2,
}: ExamFormDialogsProps) {
  return (
    <>
      {/* DIALOG 1: ADD SECTION */}
      <Dialog
        open={activeDialog === "addSection"}
        onOpenChange={(open) => !open && onActiveDialogChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tStep2("addSectionDialog.title")}</DialogTitle>
            <DialogDescription>{tStep2("addSectionDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sec-title-input" className="text-sm font-medium text-foreground">
                {tStep2("addSectionDialog.titleLabel")}
              </Label>
              <Input
                id="sec-title-input"
                value={newSecTitle}
                onChange={(e) => onNewSecTitleChange(e.target.value)}
                placeholder={tStep2("addSectionDialog.titlePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => onActiveDialogChange(null)}>
              {tForm("actions.cancel")}
            </Button>
            <Button type="button" onClick={onAddSection} disabled={!newSecTitle.trim()}>
              {tStep2("addSectionDialog.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: QUESTION DIALOG (ADD & EDIT) */}
      <QuestionDialog
        open={activeDialog === "question"}
        onOpenChange={(open) => {
          if (!open) onEditingQuestionChange(null);
          onActiveDialogChange(open ? "question" : null);
        }}
        sections={examSections}
        initialQuestion={editingQuestion?.question || null}
        initialSectionId={editingQuestion?.sectionId || targetQuestionSectionId}
        examGrade={grade}
        examSubject={subject}
        examTeacherName={teacherName}
        onSave={onSaveQuestion}
        onSaveMany={onSaveManyQuestions}
      />

      {/* DIALOG 3: ARRANGE SECTIONS */}
      <ArrangeSectionsDialog
        open={activeDialog === "arrange"}
        onOpenChange={(open) => !open && onActiveDialogChange(null)}
        items={examSections}
        onReorder={onReorderSections}
      />

      {/* DIALOG 4: IMPORT FROM OTHER EXAMS */}
      <ImportFromExamsDialog
        open={activeDialog === "importExams"}
        onOpenChange={(open) => !open && onActiveDialogChange(null)}
        availableExams={allExams}
        onImport={onImportSections}
      />

      {/* DIALOG 5: EDIT SECTION */}
      <Dialog
        open={Boolean(editingSection)}
        onOpenChange={(open) => {
          if (!open) onCancelEditSection();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tStep2("editSectionDialog.title")}</DialogTitle>
            <DialogDescription>{tStep2("editSectionDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-sec-title-input" className="text-sm font-medium text-foreground">
                {tStep2("editSectionDialog.titleLabel")}
              </Label>
              <Input
                id="edit-sec-title-input"
                value={editSecTitle}
                onChange={(e) => onEditSecTitleChange(e.target.value)}
                placeholder={tStep2("editSectionDialog.titlePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={onCancelEditSection}>
              {tForm("actions.cancel")}
            </Button>
            <Button type="button" onClick={onSaveEditSection} disabled={!editSecTitle.trim()}>
              {tStep2("editSectionDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: DELETE SECTION CONFIRMATION */}
      <Dialog
        open={Boolean(sectionToDelete)}
        onOpenChange={(open) => !open && onCancelDeleteSection()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              <span>{tStep2("deleteSectionDialog.title")}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {tStep2("deleteSectionDialog.description", {
                title: sectionToDelete?.title || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button variant="outline" type="button" onClick={onCancelDeleteSection}>
              {tStep2("deleteSectionDialog.cancel")}
            </Button>
            <Button variant="destructive" type="button" onClick={onConfirmDeleteSection}>
              {tStep2("deleteSectionDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
