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
import { LocalizedDateInput } from "@/components/ui/localized-date-input";
import { CodeGroup } from "@/types/code-group";
import { ActivationCode } from "@/types/activation-code";

interface CreateBatchCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CodeGroup | null;
  existingCodes: ActivationCode[];
  onSubmit: (data: { count: number; prefix: string; cost: number; expiryDate: string }) => void;
}

export function CreateBatchCodesDialog({
  open,
  onOpenChange,
  group,
  existingCodes,
  onSubmit,
}: CreateBatchCodesDialogProps) {
  const t = useTranslations("groupCodesPage.batchDialog");

  const [quantity, setQuantity] = React.useState<string>("10");
  const [prefix, setPrefix] = React.useState<string>("");
  const [cost, setCost] = React.useState<string>("");
  const [expiryDate, setExpiryDate] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (open) {
      setQuantity("10");

      // Auto-fill prefix from group.codePrefix or inferred sample
      let initialPrefix = "RW-CODE-";
      if (group?.codePrefix) {
        initialPrefix = group.codePrefix.endsWith("-") ? group.codePrefix : `${group.codePrefix}-`;
      } else {
        const sampleCode = existingCodes.find((c) => c.groupId === group?.id)?.code;
        if (sampleCode && sampleCode.includes("-")) {
          const parts = sampleCode.split("-");
          if (parts.length >= 2) {
            initialPrefix = `${parts[0]}-${parts[1]}-`;
          }
        } else if (group?.courseId) {
          const subjectCode = group.courseId.replace("course-", "").toUpperCase();
          initialPrefix = `RW-${subjectCode}-`;
        }
      }
      setPrefix(initialPrefix);

      // Auto-fill cost from group's price
      setCost(group ? String(group.price) : "");

      // Auto-fill expiry date from group's expiry date
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
    const parsedCount = parseInt(quantity, 10);
    if (!quantity || isNaN(parsedCount) || parsedCount <= 0 || parsedCount > 1000) {
      newErrors.quantity = true;
    }
    if (!cost || isNaN(Number(cost)) || Number(cost) < 0) newErrors.cost = true;
    if (!expiryDate) newErrors.expiryDate = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      count: parsedCount,
      prefix: prefix.trim(),
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
            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="batchQuantity" className="font-semibold">
                {t("quantityLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="batchQuantity"
                type="number"
                min="1"
                max="1000"
                step="1"
                placeholder={t("quantityPlaceholder")}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrors((prev) => ({ ...prev, quantity: false }));
                }}
                className={errors.quantity ? "border-destructive focus:ring-destructive" : ""}
              />
            </div>

            {/* Prefix (Auto-filled) */}
            <div className="grid gap-2">
              <Label htmlFor="batchPrefix" className="font-semibold">
                {t("prefixLabel")}
              </Label>
              <Input
                id="batchPrefix"
                type="text"
                placeholder={t("prefixPlaceholder")}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Cost (Auto-filled) */}
            <div className="grid gap-2">
              <Label htmlFor="batchCost" className="font-semibold">
                {t("costLabel")} ({t("currency")}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="batchCost"
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

            {/* Expiry Date (Auto-filled) */}
            <div className="grid gap-2">
              <Label htmlFor="batchExpiryDate" className="font-semibold">
                {t("expiryDateLabel")} <span className="text-destructive">*</span>
              </Label>
              <LocalizedDateInput
                id="batchExpiryDate"
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
