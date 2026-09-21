/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import { CourseSelect } from "@/components/ui/academic-selects";
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
import { Course } from "@/types/course";

interface AddCodeGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  isLoading?: boolean;
  onSubmit: (data: {
    courseId: string;
    courseTitle: string;
    price: number;
    totalCodes: number;
    availableCodes: number;
    codePrefix?: string;
    expiryDate: string;
  }) => void;
}

export function AddCodeGroupDialog({
  open,
  onOpenChange,
  courses,
  isLoading = false,
  onSubmit,
}: AddCodeGroupDialogProps) {
  const t = useTranslations("codeGroupsPage.addDialog");

  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("");
  const [unitPrice, setUnitPrice] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [codePrefix, setCodePrefix] = React.useState<string>("");
  const [expiryDate, setExpiryDate] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedCourseId(courses[0]?.id || "");
      setUnitPrice("");
      setAmount("");
      setCodePrefix("");
      // Default expiry date to 3 months from now
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      setExpiryDate(defaultDate.toISOString().split("T")[0]);
      setErrors({});
    }
  }, [open, courses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, boolean> = {};
    if (!selectedCourseId) newErrors.courseId = true;
    if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) <= 0)
      newErrors.unitPrice = true;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) newErrors.amount = true;
    if (!expiryDate) newErrors.expiryDate = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const courseTitle = selectedCourse ? selectedCourse.title : "";
    const parsedAmount = parseInt(amount, 10);

    onSubmit({
      courseId: selectedCourseId,
      courseTitle,
      price: parseFloat(unitPrice),
      totalCodes: parsedAmount,
      availableCodes: parsedAmount,
      codePrefix: codePrefix.trim() || undefined,
      expiryDate,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-bold">{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Select Course */}
            <CourseSelect
              id="courseSelect"
              value={selectedCourseId}
              onValueChange={(val) => {
                setSelectedCourseId(val);
                setErrors((prev) => ({ ...prev, courseId: false }));
              }}
              label={t("selectCourse")}
              placeholder={t("selectCoursePlaceholder")}
              required
              courses={courses}
              triggerClassName={errors.courseId ? "border-destructive focus:ring-destructive" : ""}
            />

            {/* Unit Price */}
            <div className="grid gap-2">
              <Label htmlFor="unitPrice" className="font-semibold">
                {t("unitPrice")} ({t("currency")}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder={t("unitPricePlaceholder")}
                value={unitPrice}
                onChange={(e) => {
                  setUnitPrice(e.target.value);
                  setErrors((prev) => ({ ...prev, unitPrice: false }));
                }}
                className={errors.unitPrice ? "border-destructive focus:ring-destructive" : ""}
              />
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount" className="font-semibold">
                {t("amount")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder={t("amountPlaceholder")}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: false }));
                }}
                className={errors.amount ? "border-destructive focus:ring-destructive" : ""}
              />
            </div>

            {/* Code Prefix (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="codePrefix" className="font-semibold">
                {t("codePrefix")}
              </Label>
              <Input
                id="codePrefix"
                type="text"
                placeholder={t("codePrefixPlaceholder")}
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">{t("codePrefixHint")}</p>
            </div>

            {/* Expiry Date */}
            <div className="grid gap-2">
              <Label htmlFor="expiryDate" className="font-semibold">
                {t("expiryDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setErrors((prev) => ({ ...prev, expiryDate: false }));
                }}
                className={errors.expiryDate ? "border-destructive focus:ring-destructive" : ""}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
