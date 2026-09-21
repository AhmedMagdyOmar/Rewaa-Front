/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PhoneLink } from "@/components/ui/phone-link";
import type { BackendPayment } from "@/types/api-contracts";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Image as ImageIcon,
  Printer,
  Receipt,
  User,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

interface RequestDetailsModalProps {
  payment: BackendPayment | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (id: string | number) => void;
  onReject: (id: string | number, reason: string) => void;
}

export function RequestDetailsModal({
  payment,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: RequestDetailsModalProps) {
  const locale = useLocale();
  const t = useTranslations("billingRequestsPage.modal");
  const tStatus = useTranslations("billingRequestsPage.status");
  const tDetails = useTranslations("studentsPage.details");

  const [isRejecting, setIsRejecting] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [rejectionError, setRejectionError] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsRejecting(false);
      setRejectionReason("");
      setRejectionError(false);
    }
  }, [isOpen]);

  if (!payment) return null;

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      setRejectionError(true);
      return;
    }
    onReject(payment.id, rejectionReason.trim());
    onClose();
  };

  const statusBadgeVariant =
    payment.status === "pending"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : payment.status === "approved"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        : "bg-red-500/10 text-red-600 border-red-500/20";

  const studentName =
    payment.full_name ||
    payment.student?.full_name ||
    [payment.student?.first_name, payment.student?.father_name, payment.student?.family_name]
      .filter(Boolean)
      .join(" ") ||
    "-";

  const studentPhone = payment.submitted_phone || payment.phone || payment.student?.phone || "-";

  const studentEmail = payment.email || payment.student?.email;

  const orderItems = payment.order?.items || [];
  const primaryItem = orderItems[0];
  const courseTitle =
    primaryItem?.course_title?.[locale] ||
    primaryItem?.course_title?.ar ||
    primaryItem?.course_title?.en ||
    "-";

  const stageName =
    primaryItem?.educational_stage_name?.[locale] ||
    primaryItem?.educational_stage_name?.ar ||
    primaryItem?.educational_stage_name?.en ||
    payment.student?.educational_stage?.name?.[locale] ||
    payment.student?.educational_stage?.name?.ar ||
    "-";

  const deliveryMode =
    primaryItem?.selected_delivery_mode || primaryItem?.delivery_mode || "online";

  const formatDeliveryMode = (mode: string) => {
    if (mode === "center" || mode === "onsite") return locale === "ar" ? "سنتر" : "Center / Onsite";
    if (mode === "online") return locale === "ar" ? "أونلاين" : "Online";
    if (mode === "hybrid") return locale === "ar" ? "مدمج" : "Hybrid";
    return mode;
  };

  const proofUrl = payment.proof?.url || (payment.proof_endpoint ? payment.proof_endpoint : null);

  const formatPaymentMethod = (method?: string) => {
    if (!method) return locale === "ar" ? "أخرى" : "Other";
    const m = method.toLowerCase();
    if (m.includes("insta")) return locale === "ar" ? "إنستاباي / InstaPay" : "InstaPay";
    if (m.includes("voda") || m.includes("cash") || m.includes("wallet"))
      return locale === "ar" ? "فودافون كاش / Vodafone Cash" : "Vodafone Cash";
    if (m.includes("card") || m.includes("credit") || m.includes("stripe") || m.includes("paymob"))
      return locale === "ar" ? "بطاقة ائتمان / Credit Card" : "Credit Card";
    if (m.includes("fawry")) return locale === "ar" ? "فوري / Fawry" : "Fawry";
    if (m.includes("manual")) return locale === "ar" ? "تحويل يدوي / Manual" : "Manual Transfer";
    return method;
  };

  const formattedDate = payment.created_at
    ? new Date(payment.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  const formattedTime = payment.created_at
    ? new Date(payment.created_at).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div className="space-y-1 text-start">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-foreground">{t("title")}</DialogTitle>
              <Badge
                variant="outline"
                className={`capitalize font-mono text-xs ${statusBadgeVariant}`}
              >
                {tStatus(
                  payment.status === "approved"
                    ? "accepted"
                    : (payment.status as "pending" | "rejected" | "accepted"),
                )}
              </Badge>
            </div>
            <DialogDescription className="text-xs font-mono text-muted-foreground" dir="ltr">
              Payment #: {payment.payment_number || payment.id} | Order #:{" "}
              {payment.order?.order_number || payment.order_id}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Modal Body Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Right Column: 3 Groups */}
          <div className="space-y-6">
            {/* Group 1: Student Information */}
            <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="size-4 text-primary" />
                {t("studentInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">{t("fullName")}</span>
                  <span className="font-semibold text-foreground">{studentName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">{t("phone")}</span>
                  <PhoneLink
                    phone={studentPhone}
                    className="font-medium text-foreground hover:text-emerald-600"
                  >
                    {studentPhone}
                  </PhoneLink>
                </div>
                {studentEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">{t("email")}</span>
                    <span className="font-medium text-foreground dir-ltr" dir="ltr">
                      {studentEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Group 2: Course Information */}
            <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                {t("courseInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">{t("courseName")}</span>
                  <span className="font-semibold text-foreground max-w-60 text-end">
                    {courseTitle}
                  </span>
                </div>
                {primaryItem?.instructor_name && (
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground text-xs">
                      {locale === "ar" ? "المحاضر" : "Instructor"}
                    </span>
                    <span className="font-medium text-foreground">
                      {primaryItem.instructor_name}
                    </span>
                  </div>
                )}
                {stageName && (
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground text-xs">
                      {locale === "ar" ? "المرحلة التعليمية" : "Stage"}
                    </span>
                    <span className="font-medium text-foreground">{stageName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">
                    {locale === "ar" ? "نوع الحضور" : "Venue / Mode"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {formatDeliveryMode(deliveryMode)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">{t("amountRequired")}</span>
                  <span className="font-bold text-primary text-base">
                    {payment.amount} {payment.currency_code || tDetails("currency")}
                  </span>
                </div>
              </div>
            </div>

            {/* Group 3: Transaction Information */}
            <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                {t("transactionInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">{t("paymentMethod")}</span>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {formatPaymentMethod(payment.method)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">{t("date")}</span>
                  <span className="font-medium text-foreground">{formattedDate}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-xs">{t("time")}</span>
                  <span className="font-medium text-foreground" dir="ltr">
                    {formattedTime}
                  </span>
                </div>
                {payment.submitted_phone && (
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground text-xs">{t("phoneUsed")}</span>
                    <PhoneLink
                      phone={payment.submitted_phone}
                      className="font-semibold text-foreground hover:text-emerald-600"
                    >
                      {payment.submitted_phone}
                    </PhoneLink>
                  </div>
                )}
                {payment.transaction_reference && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">
                      {locale === "ar" ? "مرجع العملية" : "Transaction Ref"}
                    </span>
                    <span className="font-mono text-xs text-foreground" dir="ltr">
                      {payment.transaction_reference}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* If already rejected, display stored rejection reason */}
            {payment.status === "rejected" && payment.rejection_reason && (
              <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5 space-y-2">
                <h3 className="text-xs font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  {t("rejectionReasonTitle")}
                </h3>
                <p className="text-xs text-foreground bg-background/50 p-2.5 rounded-lg border border-red-500/20">
                  {payment.rejection_reason}
                </p>
              </div>
            )}
          </div>

          {/* Left Column: Transaction Proof Group */}
          <div className="space-y-4 flex flex-col">
            <div className="rounded-xl border border-border/70 p-4 bg-muted/20 flex-1 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                {payment.proof?.mime_type?.includes("pdf") ? (
                  <Receipt className="size-4 text-primary" />
                ) : (
                  <ImageIcon className="size-4 text-primary" />
                )}
                {t("transactionProof")}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">{t("screenshotNote")}</p>

              <div className="relative flex-1 min-h-65 rounded-lg overflow-hidden border border-border/80 bg-background flex items-center justify-center group">
                {proofUrl ? (
                  <>
                    <Image
                      src={proofUrl}
                      fill
                      alt={t("transactionProof")}
                      className="w-full h-full object-contain max-h-87.5 transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute top-2 inset-e-2 z-10 opacity-90 transition-opacity hover:opacity-100">
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-8 px-2.5 bg-background/80 hover:bg-background backdrop-blur-md border border-border/80 text-xs font-semibold shadow-xs"
                      >
                        <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5 me-1.5" />
                          {t("openFullScreen")}
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-2">
                    <Receipt className="size-10 text-muted-foreground/40" />
                    <span className="text-xs">
                      {locale === "ar"
                        ? "لا يوجد إشعار تحويل مرفق"
                        : "No transfer receipt uploaded"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Form Drawer (if reject clicked) */}
        {isRejecting && (
          <div className="p-4 mx-6 mb-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-red-600">{t("rejectConfirmTitle")}</h4>
              <span className="text-xs text-muted-foreground">{t("rejectConfirmSubtitle")}</span>
            </div>
            <Textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (e.target.value.trim()) setRejectionError(false);
              }}
              placeholder={t("rejectionReasonPlaceholder")}
              className={`text-xs min-h-17.5 ${
                rejectionError ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {rejectionError && (
              <p className="text-[11px] text-red-500">{t("rejectionReasonPlaceholder")}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsRejecting(false)}>
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmReject}
                className="font-bold"
              >
                <XCircle className="size-4 me-1.5" />
                {t("actions.confirmReject")}
              </Button>
            </div>
          </div>
        )}

        {/* Bottom CTA Buttons */}
        <div className="p-4 px-6 border-t border-border/80 bg-muted/10 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} className="font-semibold">
            {t("actions.close")}
          </Button>

          {payment.status === "pending" && !isRejecting && (
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={() => setIsRejecting(true)}
                className="font-bold"
              >
                <XCircle className="size-4 me-1.5" />
                {t("actions.reject")}
              </Button>
              <Button
                onClick={() => {
                  onAccept(payment.id);
                  onClose();
                }}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="size-4 me-1.5" />
                {t("actions.accept")}
              </Button>
            </div>
          )}

          {payment.status === "approved" && (
            <Button
              onClick={() => {
                onAccept(payment.id);
                onClose();
              }}
              className="font-bold bg-primary hover:bg-primary/90 text-white"
            >
              <Printer className="size-4 me-1.5" />
              {t("actions.viewInvoice")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
