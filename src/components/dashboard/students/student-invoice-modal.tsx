"use client";

import { pdf } from "@react-pdf/renderer";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { LogoIcon } from "@/components/landing/layout/logo";
import { StudentInvoicePDF } from "@/components/pdf/StudentInvoicePDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { PhoneLink } from "@/components/ui/phone-link";
import { Student, StudentTransaction } from "@/types/student";

interface StudentInvoiceModalProps {
  student: Student;
  transaction: StudentTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  autoPrint?: boolean;
}

export function StudentInvoiceModal({
  student,
  transaction,
  isOpen,
  onClose,
}: StudentInvoiceModalProps) {
  const locale = useLocale();
  const tDetails = useTranslations("studentsPage.details");
  const tModal = useTranslations("studentsPage.transactionModal");

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  if (!transaction) return null;

  const nameParts = [
    student.firstName,
    student.middleName,
    student.lastName,
    student.additionalName,
  ].filter(Boolean);
  const fullName = nameParts.length > 0 ? nameParts.join(" ") : student.firstName || "";

  const normalizedDate = transaction.createdAt?.includes("T")
    ? transaction.createdAt
    : transaction.createdAt?.replace(" ", "T");
  const parsedDate = normalizedDate ? new Date(normalizedDate) : new Date();
  const formattedDate = isNaN(parsedDate.getTime())
    ? transaction.createdAt
    : parsedDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const isDeposit = transaction.type === "deposit" || transaction.type === "refund";

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const strings = {
        subtitle: tDetails("invoice.subtitle"),
        billTo: tDetails("invoice.billTo"),
        transactionDetails: tDetails("invoice.transactionDetails"),
        transactionType: tModal(`types.${transaction.type}` as Parameters<typeof tModal>[0]),
        statusCompleted: tDetails("invoice.statusCompleted"),
        amountLabel: tDetails("invoice.amountLabel"),
        currency: tDetails("currency"),
        thankYou: tDetails("invoice.thankYou"),
        officialReceipt: tDetails("invoice.officialReceipt"),
        formattedDate,
      };

      const blob = await pdf(
        <StudentInvoicePDF
          student={student}
          transaction={transaction}
          locale={locale}
          strings={strings}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${transaction.id}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF invoice:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">
          {tDetails("invoice.title")} #{transaction.id}
        </DialogTitle>
        <div className="p-6 space-y-6 print:p-8 overflow-y-auto flex-1">
          {/* Printable Header with Logo & App Name */}
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <LogoIcon width={24} height={28} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-foreground">رواء | Rewaa</h2>
                <p className="text-xs text-muted-foreground">{tDetails("invoice.subtitle")}</p>
              </div>
            </div>
            <div className="text-end">
              <Badge
                variant="outline"
                className="text-xs font-mono px-3 py-1 bg-primary/5 text-primary border-primary/20"
                dir="ltr"
              >
                #{transaction.id}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1">{formattedDate}</p>
            </div>
          </div>

          {/* Student & Invoice Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/60 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                {tDetails("invoice.billTo")}
              </span>
              <p className="font-bold text-foreground text-sm">{fullName}</p>
              <div className="flex justify-start">
                <PhoneLink
                  phone={student.phoneNumber}
                  className="text-muted-foreground hover:text-emerald-600 "
                >
                  {student.phoneNumber}
                </PhoneLink>
              </div>
              <p className="text-muted-foreground">
                {student.country} - {student.state}
              </p>
            </div>

            <div className="space-y-1 text-end">
              <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                {tDetails("invoice.transactionDetails")}
              </span>
              <p className="font-semibold text-foreground">
                {tModal(`types.${transaction.type}` as Parameters<typeof tModal>[0])}
              </p>
              <p className="text-muted-foreground">{student.email}</p>
              <Badge
                variant="outline"
                className={`mt-1 font-bold ${
                  isDeposit
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}
              >
                <CheckCircle2 className="size-3 me-1 inline-block" />
                {tDetails("invoice.statusCompleted")}
              </Badge>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                {tDetails("invoice.amountLabel")}
              </span>
              {transaction.notes && (
                <p className="text-xs text-muted-foreground italic mt-0.5">{transaction.notes}</p>
              )}
            </div>
            <div className="text-2xl font-black text-primary" dir="ltr">
              {isDeposit ? "+" : "-"}
              {transaction.amount} {tDetails("currency")}
            </div>
          </div>

          {/* Footer Notes */}
          <div className="text-center pt-4 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{tDetails("invoice.thankYou")}</p>
            <p>{tDetails("invoice.officialReceipt")}</p>
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 bg-muted/30 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGeneratingPdf}>
            {tDetails("invoice.close")}
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="gap-2 font-bold"
          >
            {isGeneratingPdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {tDetails("invoice.print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
