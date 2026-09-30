"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickAddDialog } from "@/components/ui/quick-add-dialog";
import { cn } from "@/lib/utils";

export interface SelectOptionItem {
  value: string;
  label: string;
}

export interface SelectWithAddProps {
  id?: string;
  label?: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOptionItem[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  allowAdd?: boolean;
  addButtonTooltip?: string;
  onAddNewOption?: (name: string) => string | void | Promise<string | void>;
  addDialogTitle?: string;
  addDialogDescription?: string;
  addInputLabel?: string;
  addInputPlaceholder?: string;
  customDialog?: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdded: (value: string) => void;
  }) => React.ReactNode;
}

export function SelectWithAdd({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  required,
  className,
  triggerClassName,
  allowAdd = true,
  addButtonTooltip,
  onAddNewOption,
  addDialogTitle,
  addDialogDescription,
  addInputLabel,
  addInputPlaceholder,
  customDialog,
}: SelectWithAddProps) {
  const t = useTranslations("common.quickAdd");
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const handleAdd = async (newName: string) => {
    let selectedVal = newName;
    if (onAddNewOption) {
      const result = await onAddNewOption(newName);
      if (typeof result === "string" && result) {
        selectedVal = result;
      }
    }
    // Automatically select the newly created option
    setTimeout(() => {
      onValueChange(selectedVal);
    }, 50);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="flex items-center gap-2 w-full min-w-0">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger id={id} className={cn("w-full flex-1 min-w-0", triggerClassName)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {allowAdd && (
          <Button
            type="button"
            variant="default"
            size="icon"
            className="shrink-0 h-9 w-9"
            disabled={disabled}
            onClick={() => setIsAddOpen(true)}
            title={addButtonTooltip || t("addOption")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {allowAdd &&
        (customDialog ? (
          customDialog({
            open: isAddOpen,
            onOpenChange: setIsAddOpen,
            onAdded: (val) => {
              onValueChange(val);
              setIsAddOpen(false);
            },
          })
        ) : (
          <QuickAddDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            title={addDialogTitle}
            description={addDialogDescription}
            inputLabel={addInputLabel}
            inputPlaceholder={addInputPlaceholder}
            onAdd={handleAdd}
          />
        ))}
    </div>
  );
}
