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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivationCode, CodeStatus } from "@/types/activation-code";

interface EditCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codeItem: ActivationCode | null;
  onSubmit: (updatedData: {
    code: string;
    cost: number;
    status: CodeStatus;
    expiryDate: string;
  }) => void;
}

export function EditCodeDialog({ open, onOpenChange, codeItem, onSubmit }: EditCodeDialogProps) {
  const t = useTranslations("groupCodesPage.editDialog");
  const tStatus = useTranslations("groupCodesPage.statusLabels");

  const [codeValue, setCodeValue] = React.useState<string>("");
  const [cost, setCost] = React.useState<string>("");
  const [status, setStatus] = React.useState<CodeStatus>("available");
  const [expiryDate, setExpiryDate] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (open && codeItem) {
      setCodeValue(codeItem.code);
      setCost(String(codeItem.cost));
      setStatus(codeItem.status);
      setExpiryDate(codeItem.expiryDate);
      setErrors({});
    }
  }, [open, codeItem]);

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
      status,
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
            {/* Code Value */}
            <div className="grid gap-2">
              <Label htmlFor="codeVal" className="font-semibold">
                {t("codeLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codeVal"
                type="text"
                value={codeValue}
                onChange={(e) => {
                  setCodeValue(e.target.value);
                  setErrors((prev) => ({ ...prev, codeValue: false }));
                }}
                className={errors.codeValue ? "border-destructive focus:ring-destructive" : ""}
              />
            </div>

            {/* Cost */}
            <div className="grid gap-2">
              <Label htmlFor="codeCost" className="font-semibold">
                {t("costLabel")} ({t("currency")}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codeCost"
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

            {/* Status Select */}
            <div className="grid gap-2">
              <Label htmlFor="statusSelect" className="font-semibold">
                {t("statusLabel")} <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={(val: CodeStatus) => setStatus(val)}>
                <SelectTrigger id="statusSelect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">{tStatus("available")}</SelectItem>
                  <SelectItem value="sold">{tStatus("sold")}</SelectItem>
                  <SelectItem value="used">{tStatus("used")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiry Date */}
            <div className="grid gap-2">
              <Label htmlFor="expiryDate" className="font-semibold">
                {t("expiryDateLabel")} <span className="text-destructive">*</span>
              </Label>
              <LocalizedDateInput
                id="expiryDate"
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
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
