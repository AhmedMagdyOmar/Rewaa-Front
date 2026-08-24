"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BillingRequestItem } from "@/types/billing-request";

interface InvoiceDetailsModalProps {
  selectedInvoice: BillingRequestItem | null;
  onClose: () => void;
}

export function InvoiceDetailsModal({ selectedInvoice, onClose }: InvoiceDetailsModalProps) {
  const t = useTranslations("dashboard");

  if (!selectedInvoice) return null;

  return (
    <Dialog open={!!selectedInvoice} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoiceModal.title")}</DialogTitle>
          <DialogDescription>
            {t("invoiceModal.invoiceNumber", { id: selectedInvoice.id })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">{t("invoiceModal.studentName")}</span>
            <span className="font-semibold">{selectedInvoice.studentFullName}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">{t("invoiceModal.amountPaid")}</span>
            <span className="font-semibold text-primary">
              {t("currencyEgp", { amount: selectedInvoice.amount })}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">{t("invoiceModal.paymentMethod")}</span>
            <span className="font-medium font-mono" dir="ltr">
              {selectedInvoice.phoneUsedForTransaction}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">{t("invoiceModal.date")}</span>
            <span className="font-medium">{selectedInvoice.createdAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("invoiceModal.status")}</span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              {selectedInvoice.status}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="font-bold">
            {t("invoiceModal.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
