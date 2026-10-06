/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  onAdd: (name: string) => void | Promise<void>;
  children?: React.ReactNode;
}

export function QuickAddDialog({
  open,
  onOpenChange,
  title,
  description,
  inputLabel,
  inputPlaceholder,
  onAdd,
  children,
}: QuickAddDialogProps) {
  const t = useTranslations("common.quickAdd");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (children) {
      // If custom children form is provided, submission is handled by children/dialog wrapper
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("nameRequired"));
      return;
    }
    onAdd(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title || t("addOptionTitle")}</DialogTitle>
            <DialogDescription>{description || t("addOptionDesc")}</DialogDescription>
          </DialogHeader>

          {children ? (
            children
          ) : (
            <div className="space-y-2 py-1">
              <Label htmlFor="quick-add-input" className="text-sm font-medium">
                {inputLabel || t("nameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quick-add-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder={inputPlaceholder || t("namePlaceholder")}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}

          {!children && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {t("save")}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
