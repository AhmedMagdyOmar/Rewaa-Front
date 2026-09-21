/* eslint-disable react-hooks/set-state-in-effect */
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PhoneLink, WhatsAppIcon } from "@/components/ui/phone-link";
import type { AssistantItem, AssistantPermission } from "@/types/settings";
import { adaptBackendAdminToAssistantItem } from "@/lib/adapters/settings-adapter";
import {
  useCreateStaffAdmin,
  useDeleteStaffAdmin,
  useStaffAdminsList,
  useUpdateStaffAdmin,
} from "@/hooks/use-settings";
import { KeyRound, Loader2, Pencil, Plus, RotateCcw, Trash2, UserLock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AssistantDialog } from "./assistant-dialog";

export function AssistantsSection() {
  const t = useTranslations("settings.assistants");

  const { data: backendAdmins, isLoading, refetch } = useStaffAdminsList("assistant");
  const createAssistantMutation = useCreateStaffAdmin();
  const updateAssistantMutation = useUpdateStaffAdmin();
  const deleteAssistantMutation = useDeleteStaffAdmin();

  const assistants: AssistantItem[] = (backendAdmins || []).map((admin) =>
    adaptBackendAdminToAssistantItem(admin),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [assistantToEdit, setAssistantToEdit] = useState<AssistantItem | null>(null);

  const [assistantToDelete, setAssistantToDelete] = useState<AssistantItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [assistantToResetPassword, setAssistantToResetPassword] = useState<AssistantItem | null>(
    null,
  );
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleOpenAdd = () => {
    setAssistantToEdit(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (assistant: AssistantItem) => {
    setAssistantToEdit(assistant);
    setDialogOpen(true);
  };

  const handleOpenDelete = (assistant: AssistantItem) => {
    setAssistantToDelete(assistant);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (assistantToDelete) {
      try {
        await deleteAssistantMutation.mutateAsync(assistantToDelete.id);
        toast.success(t("deleteDialog.title"));
        setAssistantToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete assistant";
        toast.error(errorMsg);
      }
    }
  };

  const handleOpenResetPassword = (assistant: AssistantItem) => {
    setAssistantToResetPassword(assistant);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (assistantToResetPassword && newPassword) {
      try {
        await updateAssistantMutation.mutateAsync({
          adminId: assistantToResetPassword.id,
          data: { password: newPassword },
        });
        toast.success(t("resetPasswordDialog.title"));
        setResetPasswordDialogOpen(false);
        setAssistantToResetPassword(null);
        setNewPassword("");
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to reset password";
        toast.error(errorMsg);
      }
    }
  };

  const handleSave = async (data: Omit<AssistantItem, "id"> & { id?: string }) => {
    try {
      if (data.id) {
        await updateAssistantMutation.mutateAsync({
          adminId: data.id,
          data: {
            full_name: data.name,
            national_id: data.nationalId,
            phone: data.phone,
            permissions: data.permissions,
          },
        });
      } else {
        await createAssistantMutation.mutateAsync({
          full_name: data.name,
          national_id: data.nationalId,
          email: `${data.phone ? data.phone.replace(/\+/g, "") : Date.now()}@rewaa.local`,
          phone: data.phone,
          role: "assistant",
          permissions: data.permissions,
          is_active: true,
        });
      }
      toast.success(t("title"));
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save assistant";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <UserLock className="size-5" />
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
            <span>{t("refreshAssistants")}</span>
          </Button>
          <Button onClick={handleOpenAdd} className="gap-1.5">
            <Plus className="size-4" />
            <span>{t("addAssistant")}</span>
          </Button>
        </div>
      </div>

      {/* Assistants Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="*:text-start">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.phone")}</TableHead>
              <TableHead>{t("columns.permissions")}</TableHead>
              <TableHead className="w-32 text-end">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs">{t("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : assistants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  {t("noAssistants")}
                </TableCell>
              </TableRow>
            ) : (
              assistants.map((assistant) => (
                <TableRow key={assistant.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{assistant.name}</TableCell>

                  <TableCell className="">
                    {assistant.phone ? (
                      <PhoneLink
                        phone={assistant.phone}
                        className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium w-fit hover:text-emerald-600 transition-colors"
                      >
                        <span className="flex items-center justify-center size-4 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                          <WhatsAppIcon className="size-3" />
                        </span>
                        <span dir="ltr" className="tracking-tight">
                          {assistant.phone}
                        </span>
                      </PhoneLink>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assistant.permissions && assistant.permissions.length > 0 ? (
                        Array.from(new Set(assistant.permissions)).map(
                          (perm: AssistantPermission) => (
                            <Badge
                              key={`${assistant.id}-${perm}`}
                              variant="secondary"
                              className="text-[11px]"
                            >
                              {t(`dialog.permissions.${perm}`)}
                            </Badge>
                          ),
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-muted-foreground hover:text-foreground"
                        title={t("resetPasswordDialog.title")}
                        onClick={() => handleOpenResetPassword(assistant)}
                      >
                        <KeyRound className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-muted-foreground hover:text-foreground"
                        title={t("dialog.titleEdit")}
                        onClick={() => handleOpenEdit(assistant)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        title={t("deleteDialog.title")}
                        onClick={() => handleOpenDelete(assistant)}
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

      {/* Create / Edit Assistant Dialog */}
      <AssistantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assistantToEdit={assistantToEdit}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description", { name: assistantToDelete?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteAssistantMutation.isPending}
            >
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("resetPasswordDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("resetPasswordDialog.description", { name: assistantToResetPassword?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-assistant-password">
              {t("resetPasswordDialog.newPasswordLabel")}
            </Label>
            <Input
              id="new-assistant-password"
              type="password"
              placeholder={t("resetPasswordDialog.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              {t("resetPasswordDialog.cancel")}
            </Button>
            <Button
              disabled={!newPassword || updateAssistantMutation.isPending}
              onClick={handleConfirmResetPassword}
            >
              {t("resetPasswordDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
