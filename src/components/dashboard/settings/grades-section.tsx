/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Plus, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GradeItem } from "@/types/settings";
import { adaptBackendStageToGradeItem } from "@/lib/adapters/settings-adapter";
import {
  useCreateStage,
  useDeleteStage,
  useStagesList,
  useUpdateStage,
} from "@/hooks/use-settings";
import { toast } from "sonner";
import { GradeDialog } from "./grade-dialog";

export function GradesSection({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const t = useTranslations("settings.grades");

  const { data: backendStages, isLoading, refetch } = useStagesList();
  const createStageMutation = useCreateStage();
  const updateStageMutation = useUpdateStage();
  const deleteStageMutation = useDeleteStage();

  const grades: GradeItem[] = (backendStages || []).map((s) => adaptBackendStageToGradeItem(s));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeToEdit, setGradeToEdit] = useState<GradeItem | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [gradeToDelete, setGradeToDelete] = useState<GradeItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenAdd = () => {
    setGradeToEdit(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (grade: GradeItem) => {
    setGradeToEdit(grade);
    setDialogOpen(true);
  };

  const handleOpenDelete = (grade: GradeItem) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (gradeToDelete) {
      try {
        await deleteStageMutation.mutateAsync(gradeToDelete.id);
        toast.success(t("deleteDialog.title"));
        setGradeToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete stage";
        toast.error(errorMsg);
      }
    }
  };

  const handleSave = async (data: { id?: string; name: string; year: number }) => {
    try {
      if (data.id) {
        await updateStageMutation.mutateAsync({
          stageId: data.id,
          data: {
            name: { ar: data.name, en: data.name },
            academic_year: data.year,
          },
        });
      } else {
        await createStageMutation.mutateAsync({
          name: { ar: data.name, en: data.name },
          academic_year: data.year,
          is_active: true,
        });
      }
      toast.success(t("title"));
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save stage";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5 flex-1">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={mounted && isLoading}
            className="gap-1.5"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refreshGrades")}</span>
          </Button>
          {!isReadOnly && (
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              <span>{t("addGrade")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grades Table */}
      <div className="rounded-lg border overflow-y-auto max-h-48">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="*:text-start">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.studentsCount")}</TableHead>
              <TableHead>{t("columns.coursesCount")}</TableHead>
              <TableHead>{t("columns.teachersCount")}</TableHead>
              <TableHead className="w-20 text-end">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs">{t("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  {t("noGrades")}
                </TableCell>
              </TableRow>
            ) : (
              grades.map((grade) => (
                <TableRow key={grade.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{grade.name}</TableCell>
                  <TableCell className="text-xs font-mono">{grade.studentsCount}</TableCell>
                  <TableCell className="text-xs font-mono">{grade.coursesCount}</TableCell>
                  <TableCell className="text-xs font-mono">{grade.teachersCount}</TableCell>
                  <TableCell className="text-end">
                    {!isReadOnly && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(grade)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDelete(grade)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <GradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gradeToEdit={gradeToEdit}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description", { name: gradeToDelete?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteStageMutation.isPending}
            >
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
