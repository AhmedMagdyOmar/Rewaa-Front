"use client";

import { useTranslations } from "next-intl";
import { BookOpen, CheckCircle2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { LessonDialog } from "../../lesson-dialog";
import { CurriculumActionsBar } from "./curriculum-actions-bar";
import { CurriculumSectionItem } from "./curriculum-section-item";
import { SectionFormDialog } from "./dialogs/section-form-dialog";
import { ArrangeSectionsDialog } from "./dialogs/arrange-sections-dialog";
import { ImportSectionsDialog } from "./dialogs/import-sections-dialog";
import { DeleteSectionDialog } from "./dialogs/delete-section-dialog";
import { DeleteLessonDialog } from "./dialogs/delete-lesson-dialog";
import { useCurriculumManagement } from "../hooks/use-curriculum-management";

interface CurriculumViewProps {
  courseId: string;
  locale: string;
  isEditing?: boolean;
  onBackToStep1: () => void;
  onFinish: () => void;
}

export function CurriculumView({
  courseId,
  locale,
  isEditing,
  onBackToStep1,
  onFinish,
}: CurriculumViewProps) {
  const t = useTranslations("courses.new");
  const curriculum = useCurriculumManagement({ courseId, locale });

  return (
    <div className="space-y-6">
      {/* Action buttons at top */}
      <CurriculumActionsBar
        activeDialog={curriculum.activeDialog}
        onOpenAddSection={curriculum.handleOpenAddSection}
        onOpenAddLesson={() => {
          curriculum.setEditingLesson(null);
          curriculum.setLessonTargetSectionId(undefined);
          curriculum.setActiveDialog("lesson");
        }}
        onOpenArrangeSections={() => curriculum.setActiveDialog("arrange")}
        onOpenImportSections={() => {
          curriculum.setImportCourseId("");
          curriculum.setSelectedImportSectionIds([]);
          curriculum.setActiveDialog("import");
        }}
      />

      {/* Curriculum View Card */}
      <FormSectionCard
        title={t("step2.title")}
        description={t("step2.subtitle")}
        icon={BookOpen}
        contentClassName="space-y-4"
      >
        {curriculum.sections.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
            <FolderPlus className="size-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t("step2.noSections")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {curriculum.sections.map((sec, sIdx) => (
              <CurriculumSectionItem
                key={sec.id}
                section={sec}
                index={sIdx}
                locale={locale}
                availableExams={curriculum.availableExams}
                onAddLessonToSection={(secId) => {
                  curriculum.setEditingLesson(null);
                  curriculum.setLessonTargetSectionId(secId);
                  curriculum.setActiveDialog("lesson");
                }}
                onEditSection={curriculum.handleOpenEditSection}
                onDeleteSection={curriculum.setSectionToDelete}
                onEditLesson={(les, secId) => {
                  curriculum.setEditingLesson({ lesson: les, sectionId: secId });
                  curriculum.setActiveDialog("lesson");
                }}
                onDeleteLesson={(les, secId) => {
                  curriculum.setLessonToDelete({ lesson: les, sectionId: secId });
                }}
              />
            ))}
          </div>
        )}
      </FormSectionCard>

      {/* Step 2 Bottom Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBackToStep1}>
          {t("actions.backToMainInfo")}
        </Button>
        <Button type="button" onClick={onFinish} className="gap-2">
          <CheckCircle2 className="size-4" />
          {isEditing ? t("actions.saveAndPublish") : t("actions.finishAndPublish")}
        </Button>
      </div>

      {/* Section Form Dialog (Add / Edit) */}
      <SectionFormDialog
        open={curriculum.activeDialog === "section"}
        onOpenChange={(open) => {
          if (!open) {
            curriculum.setEditingSection(null);
            curriculum.setActiveDialog(null);
          }
        }}
        editingSection={curriculum.editingSection}
        newSecTitle={curriculum.newSecTitle}
        onTitleChange={curriculum.setNewSecTitle}
        newSecStatus={curriculum.newSecStatus}
        onStatusChange={curriculum.setNewSecStatus}
        newSecScheduledDate={curriculum.newSecScheduledDate}
        onScheduledDateChange={curriculum.setNewSecScheduledDate}
        newSecIsLinkedExam={curriculum.newSecIsLinkedExam}
        onIsLinkedExamChange={curriculum.setNewSecIsLinkedExam}
        newSecLinkedExamId={curriculum.newSecLinkedExamId}
        onLinkedExamIdChange={curriculum.setNewSecLinkedExamId}
        newSecIsReqPass={curriculum.newSecIsReqPass}
        onIsReqPassChange={curriculum.setNewSecIsReqPass}
        newSecScheduleDateError={curriculum.newSecScheduleDateError}
        availableExams={curriculum.availableExams}
        courseId={courseId}
        locale={locale}
        onSave={curriculum.handleSaveSection}
        onCancel={() => {
          curriculum.setEditingSection(null);
          curriculum.setActiveDialog(null);
        }}
      />

      {/* Lesson Dialog (Add / Edit) */}
      <LessonDialog
        open={curriculum.activeDialog === "lesson"}
        onOpenChange={(open) => {
          if (!open) {
            curriculum.setEditingLesson(null);
            curriculum.setLessonTargetSectionId(undefined);
          }
          curriculum.setActiveDialog(open ? "lesson" : null);
        }}
        sections={curriculum.sections}
        initialLesson={curriculum.editingLesson?.lesson || null}
        initialSectionId={curriculum.editingLesson?.sectionId || curriculum.lessonTargetSectionId}
        parentCourseContext={curriculum.parentCourseContext}
        onSave={curriculum.handleSaveLesson}
        onSaveMany={curriculum.handleSaveManyLessons}
      />

      {/* Arrange Sections Dialog */}
      <ArrangeSectionsDialog
        open={curriculum.activeDialog === "arrange"}
        onOpenChange={(open: boolean) => !open && curriculum.setActiveDialog(null)}
        sections={curriculum.sections}
        onMoveSection={curriculum.handleMoveSection}
        onClose={() => curriculum.setActiveDialog(null)}
      />

      {/* Import Sections Dialog */}
      <ImportSectionsDialog
        open={curriculum.activeDialog === "import"}
        onOpenChange={(open) => {
          if (!open) {
            curriculum.setImportCourseId("");
            curriculum.setSelectedImportSectionIds([]);
            curriculum.setActiveDialog(null);
          }
        }}
        importCourseId={curriculum.importCourseId}
        onImportCourseIdChange={(val) => {
          curriculum.setImportCourseId(val);
          curriculum.setSelectedImportSectionIds([]);
        }}
        allCoursesList={curriculum.allCoursesList}
        availableImportSections={curriculum.availableImportSections}
        selectedImportSectionIds={curriculum.selectedImportSectionIds}
        onSelectedImportSectionIdsChange={curriculum.setSelectedImportSectionIds}
        selectedImportSectionsList={curriculum.selectedImportSectionsList}
        isImporting={curriculum.isImporting}
        locale={locale}
        onImport={curriculum.handleImportSections}
        onCancel={() => {
          curriculum.setImportCourseId("");
          curriculum.setSelectedImportSectionIds([]);
          curriculum.setActiveDialog(null);
        }}
      />

      {/* Delete Lesson Confirmation */}
      <DeleteLessonDialog
        open={!!curriculum.lessonToDelete}
        lessonToDelete={curriculum.lessonToDelete}
        onOpenChange={(open) => !open && curriculum.setLessonToDelete(null)}
        onConfirm={curriculum.handleDeleteLesson}
      />

      {/* Delete Section Confirmation */}
      <DeleteSectionDialog
        open={!!curriculum.sectionToDelete}
        section={curriculum.sectionToDelete}
        onOpenChange={(open) => !open && curriculum.setSectionToDelete(null)}
        onConfirm={curriculum.handleDeleteSection}
      />
    </div>
  );
}
