/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

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
import { LocalizedDateInput } from "@/components/ui/localized-date-input";
import { CodeGroup } from "@/types/code-group";
import { ActivationCode } from "@/types/activation-code";

interface CreateCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CodeGroup | null;
  existingCodes: ActivationCode[];
  onSubmit: (data: { code: string; cost: number; expiryDate: string }) => void;
}

export function generateRandomCodePattern(
  group: CodeGroup | null,
  existingCodes: ActivationCode[],
): string {
  let prefix = "RW-CODE-";
  if (group?.codePrefix) {
    prefix = group.codePrefix.endsWith("-") ? group.codePrefix : `${group.codePrefix}-`;
  } else {
    // Infer pattern from existing group codes
    const sampleCode = existingCodes.find((c) => c.groupId === group?.id)?.code;
    if (sampleCode && sampleCode.includes("-")) {
      const parts = sampleCode.split("-");
      if (parts.length >= 2) {
        prefix = `${parts[0]}-${parts[1]}-`;
      }
    } else if (group?.courseId) {
      const subjectCode = group.courseId.replace("course-", "").toUpperCase();
      prefix = `RW-${subjectCode}-`;
    }
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${randomNum}-${randomStr}`;
}

export function CreateCodeDialog({
  open,
  onOpenChange,
  group,
  existingCodes,
  onSubmit,
}: CreateCodeDialogProps) {
  const t = useTranslations("groupCodesPage.createDialog");

  const [codeValue, setCodeValue] = React.useState<string>("");
  const [cost, setCost] = React.useState<string>("");
  const [expiryDate, setExpiryDate] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  const handleRegenerateCode = React.useCallback(() => {
    const generated = generateRandomCodePattern(group, existingCodes);
    setCodeValue(generated);
  }, [group, existingCodes]);

  React.useEffect(() => {
    if (open) {
      const generated = generateRandomCodePattern(group, existingCodes);
      setCodeValue(generated);
      // Auto-fill cost from group's price
      setCost(group ? String(group.price) : "");
      // Auto-fill expiry date from group's expiry date or default 3 months
      if (group?.expiryDate) {
        setExpiryDate(group.expiryDate);
      } else {
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 3);
        setExpiryDate(defaultDate.toISOString().split("T")[0]);
      }
      setErrors({});
    }
  }, [open, group, existingCodes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, boolean> = {};
    if (!codeValue.trim()) newErrors.codeValue = true;
    if (!cost || isNaN(Number(cost)) || Number(cost) < 0) newErrors.cost = true;
    if (!expiryDate) newErrors.expiryDate = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      code: codeValue.trim(),
      cost: parseFloat(cost),
      expiryDate,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-bold">{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Generated Code Value */}
            <div className="grid gap-2">
              <Label htmlFor="createCodeVal" className="font-semibold">
                {t("codeLabel")} <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="createCodeVal"
                  type="text"
                  value={codeValue}
                  onChange={(e) => {
                    setCodeValue(e.target.value);
                    setErrors((prev) => ({ ...prev, codeValue: false }));
                  }}
                  className={`font-mono font-bold ${errors.codeValue ? "border-destructive focus:ring-destructive" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  title={t("regenerate")}
                  className="shrink-0 size-10"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>

            {/* Cost (auto-filled with group cost) */}
            <div className="grid gap-2">
              <Label htmlFor="createCost" className="font-semibold">
                {t("costLabel")} ({t("currency")}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="createCost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => {
                  setCost(e.target.value);
                  setErrors((prev) => ({ ...prev, cost: false }));
                }}
                className={errors.cost ? "border-destructive focus:ring-destructive" : ""}
              />
            </div>

            {/* Expiry Date (auto-filled with group expiry date) */}
            <div className="grid gap-2">
              <Label htmlFor="createExpiryDate" className="font-semibold">
                {t("expiryDateLabel")} <span className="text-destructive">*</span>
              </Label>
              <LocalizedDateInput
                id="createExpiryDate"
                value={expiryDate}
                onChange={(val) => {
                  setExpiryDate(val);
                  setErrors((prev) => ({ ...prev, expiryDate: false }));
                }}
                error={Boolean(errors.expiryDate)}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
