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
import { CourseSelect, MultiLessonSelect } from "@/components/ui/academic-selects";
import { Download, Loader2 } from "lucide-react";
import { Course, CourseSection } from "@/types/course";

interface ImportSectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importCourseId: string;
  onImportCourseIdChange: (courseId: string) => void;
  allCoursesList: Course[];
  availableImportSections: CourseSection[];
  selectedImportSectionIds: string[];
  onSelectedImportSectionIdsChange: (ids: string[]) => void;
  selectedImportSectionsList: CourseSection[];
  isImporting: boolean;
  locale: string;
  onImport: () => void;
  onCancel: () => void;
}

export function ImportSectionsDialog({
  open,
  onOpenChange,
  importCourseId,
  onImportCourseIdChange,
  allCoursesList,
  availableImportSections,
  selectedImportSectionIds,
  onSelectedImportSectionIdsChange,
  selectedImportSectionsList,
  isImporting,
  locale,
  onImport,
  onCancel,
}: ImportSectionsDialogProps) {
  const t = useTranslations("courses.new");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Download className="size-5 text-primary" />
            {t("step2.importFromCoursesDialog.title")}
          </DialogTitle>
          <DialogDescription>{t("step2.importFromCoursesDialog.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step A: Select Source Course */}
          <div className="flex flex-col gap-1.5">
            <CourseSelect
              value={importCourseId}
              onValueChange={onImportCourseIdChange}
              label={t("step2.importFromCoursesDialog.selectCourse")}
              placeholder={t("step2.importFromCoursesDialog.selectCoursePlaceholder")}
              courses={allCoursesList.map((c) => ({
                id: c.id,
                title: c.title || (locale === "ar" ? "دورة بدون عنوان" : "Untitled Course"),
              }))}
              emptyLabel={t("step2.importFromCoursesDialog.noCoursesAvailable")}
            />
          </div>

          {/* Step B: Multi-Select Sections from Chosen Course */}
          {importCourseId && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              {availableImportSections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
                  {t("step2.importFromCoursesDialog.noSectionsInCourse")}
                </p>
              ) : (
                <>
                  <MultiLessonSelect
                    id="multi-import-section-select"
                    value={selectedImportSectionIds}
                    onValueChange={onSelectedImportSectionIdsChange}
                    label={t("step2.importFromCoursesDialog.selectSections")}
                    placeholder={t("step2.importFromCoursesDialog.selectSectionsPlaceholder")}
                    lessons={availableImportSections.map((s) => ({
                      id: s.id,
                      title: s.title,
                    }))}
                    emptyLabel={t("step2.importFromCoursesDialog.noSectionsInCourse")}
                  />

                  {/* Selected Sections List */}
                  {selectedImportSectionsList.length > 0 && (
                    <div className="space-y-3 p-3.5 rounded-xl border bg-muted/20">
                      <h4 className="text-sm font-bold text-foreground">
                        {t("step2.importFromCoursesDialog.selectedSections")} (
                        {selectedImportSectionsList.length})
                      </h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {selectedImportSectionsList.map((sec, idx) => (
                          <div
                            key={sec.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-foreground truncate">
                                {sec.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full font-medium">
                              {locale === "ar"
                                ? `${sec.lessons?.length || 0} درس`
                                : `${sec.lessons?.length || 0} lessons`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={onImport}
            disabled={!importCourseId || selectedImportSectionIds.length === 0 || isImporting}
          >
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t("step2.importFromCoursesDialog.importAction")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
