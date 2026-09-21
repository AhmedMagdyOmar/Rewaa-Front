/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { UserCheck, Plus, Pencil, Trash2, User, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PhoneLink, WhatsAppIcon } from "@/components/ui/phone-link";
import type { Teacher } from "@/types/settings";
import { adaptBackendTeacherToTeacher } from "@/lib/adapters/settings-adapter";
import {
  useCreateTeacher,
  useDeleteTeacher,
  useTeachersList,
  useUpdateTeacher,
} from "@/hooks/use-settings";
import { toast } from "sonner";
import { TeacherDialog } from "./teacher-dialog";

export function TeachersSection() {
  const t = useTranslations("settings.teachers");
  const tSubjects = useTranslations("courses.new.subjects");
  const locale = useLocale();

  const { data: backendTeachers, isLoading, refetch } = useTeachersList();
  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();

  const teachers: Teacher[] = (backendTeachers || []).map((admin) =>
    adaptBackendTeacherToTeacher(admin, locale),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const formatSubject = (sub: string) => {
    if (!sub) return "";
    return tSubjects.has(sub as Parameters<typeof tSubjects.has>[0])
      ? tSubjects(sub as Parameters<typeof tSubjects>[0])
      : sub;
  };

  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenAdd = () => {
    setTeacherToEdit(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setTeacherToEdit(teacher);
    setDialogOpen(true);
  };

  const handleOpenDelete = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (teacherToDelete) {
      try {
        await deleteTeacherMutation.mutateAsync(teacherToDelete.id);
        toast.success(t("deleteDialog.title"));
        setTeacherToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete teacher";
        toast.error(errorMsg);
      }
    }
  };

  const handleSave = async (data: Omit<Teacher, "id"> & { id?: string }) => {
    try {
      if (data.id) {
        await updateTeacherMutation.mutateAsync({
          teacherId: data.id,
          data: {
            full_name: data.name,
            phone: data.phone,
            is_active: true,
            avatar_url: data.image?.startsWith("http") ? data.image : undefined,
            educational_stage_ids: data.stageIds,
            subject_ids: data.subjectIds,
          },
        });
      } else {
        const defaultPassword = "Password123!";
        await createTeacherMutation.mutateAsync({
          full_name: data.name,
          email: `${data.phone ? data.phone.replace(/[^0-9]/g, "") : Date.now()}@rewaa.local`,
          phone: data.phone,
          password: defaultPassword,
          password_confirmation: defaultPassword,
          is_active: true,
          avatar_url: data.image?.startsWith("http") ? data.image : undefined,
          educational_stage_ids: data.stageIds,
          subject_ids: data.subjectIds,
        });
      }
      toast.success(t("title"));
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save teacher";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <UserCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={mounted && isLoading}
            className="gap-1.5"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refreshTeachers")}</span>
          </Button>
          <Button onClick={handleOpenAdd} className="gap-1.5">
            <Plus className="size-4" />
            <span>{t("addTeacher")}</span>
          </Button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="*:text-start">
              <TableHead className="w-16">{t("columns.image")}</TableHead>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.phone")}</TableHead>
              <TableHead>{t("columns.subjects")}</TableHead>
              <TableHead className="w-24 text-end">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs">{t("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {t("noTeachers")}
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/30">
                  {/* Image Column */}
                  <TableCell>
                    <div className="relative size-9 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0">
                      {teacher.image ? (
                        <Image
                          src={teacher.image}
                          alt={teacher.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="size-5 text-muted-foreground/70" />
                      )}
                    </div>
                  </TableCell>

                  {/* Teacher Name */}
                  <TableCell className="font-medium text-sm">{teacher.name}</TableCell>

                  {/* Phone Number */}
                  <TableCell className="">
                    {teacher.phone ? (
                      <PhoneLink
                        phone={teacher.phone}
                        className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium w-fit hover:text-emerald-600 transition-colors"
                      >
                        <span className="flex items-center justify-center size-4 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                          <WhatsAppIcon className="size-3" />
                        </span>
                        <span dir="ltr" className="tracking-tight">
                          {teacher.phone}
                        </span>
                      </PhoneLink>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  {/* Subjects */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        teacher.subjects.map((sub, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[11px]">
                            {formatSubject(sub)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Action Icon Buttons */}
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(teacher)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleOpenDelete(teacher)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <TeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teacherToEdit={teacherToEdit}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description", { name: teacherToDelete?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteTeacherMutation.isPending}
            >
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
