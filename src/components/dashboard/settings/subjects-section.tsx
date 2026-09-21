/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Plus, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
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
import type { SubjectItem } from "@/types/settings";
import { adaptBackendSubjectToSubjectItem } from "@/lib/adapters/settings-adapter";
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjectsList,
  useUpdateSubject,
} from "@/hooks/use-settings";
import { toast } from "sonner";
import { SubjectDialog } from "./subject-dialog";

export function SubjectsSection({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const t = useTranslations("settings.subjects");

  const { data: backendSubjects, isLoading, refetch } = useSubjectsList();
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const subjects: SubjectItem[] = (backendSubjects || []).map((s) =>
    adaptBackendSubjectToSubjectItem(s),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenAdd = () => {
    setSubjectToEdit(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (subject: SubjectItem) => {
    setSubjectToEdit(subject);
    setDialogOpen(true);
  };

  const handleOpenDelete = (subject: SubjectItem) => {
    setSubjectToDelete(subject);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (subjectToDelete) {
      try {
        await deleteSubjectMutation.mutateAsync(subjectToDelete.id);
        toast.success(t("deleteDialog.title"));
        setSubjectToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete subject";
        toast.error(errorMsg);
      }
    }
  };

  const handleSave = async (data: { id?: string; name: string }) => {
    try {
      if (data.id) {
        await updateSubjectMutation.mutateAsync({
          subjectId: data.id,
          data: {
            name: { ar: data.name, en: data.name },
          },
        });
      } else {
        await createSubjectMutation.mutateAsync({
          name: { ar: data.name, en: data.name },
          is_active: true,
        });
      }
      toast.success(t("title"));
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save subject";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5 flex-1">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="size-5" />
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
            <span>{t("refreshSubjects")}</span>
          </Button>
          {!isReadOnly && (
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              <span>{t("addSubject")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Subjects Table */}
      <div className="rounded-lg border overflow-y-auto max-h-48">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="*:text-start">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.coursesCount")}</TableHead>
              <TableHead>{t("columns.teachersCount")}</TableHead>
              <TableHead className="w-20 text-end">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs">{t("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                  {t("noSubjects")}
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{subject.name}</TableCell>
                  <TableCell className="text-xs font-mono">{subject.coursesCount}</TableCell>
                  <TableCell className="text-xs font-mono">{subject.teachersCount}</TableCell>
                  <TableCell className="text-end">
                    {!isReadOnly && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(subject)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDelete(subject)}
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
      <SubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subjectToEdit={subjectToEdit}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description", { name: subjectToDelete?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSubjectMutation.isPending}
            >
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
