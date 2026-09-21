"use client";

import { RequestDetailsModal } from "@/components/dashboard/billing/request-details-modal";
import { StudentInvoiceModal } from "@/components/dashboard/students/student-invoice-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApprovePayment, usePaymentsList, useRejectPayment } from "@/hooks/use-billing";
import type { BackendPayment } from "@/types/api-contracts";
import type { Student, StudentTransaction } from "@/types/student";
import { CreditCard, Eye, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";

export type BillingRequest = BackendPayment;

interface LastBillingRequestsCardProps {
  onSelectInvoice?: (payment: BackendPayment) => void;
}

export function LastBillingRequestsCard({ onSelectInvoice }: LastBillingRequestsCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const { data: paymentsData, isLoading } = usePaymentsList({
    per_page: 10,
    sort: "latest",
  });

  const approvePaymentMutation = useApprovePayment();
  const rejectPaymentMutation = useRejectPayment();

  const payments: BackendPayment[] = paymentsData?.payments ?? [];

  const [selectedPayment, setSelectedPayment] = useState<BackendPayment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generated printable invoice modal state
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<{
    student: Student;
    transaction: StudentTransaction;
  } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const displayedPayments = payments.slice(0, 5);

  const handleEyeClick = (payment: BackendPayment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
    if (onSelectInvoice) {
      onSelectInvoice(payment);
    }
  };

  const handleAccept = async (id: string | number) => {
    const targetPayment = payments.find((p) => String(p.id) === String(id));
    if (!targetPayment) return;

    try {
      await approvePaymentMutation.mutateAsync(id);
      toast.success(locale === "ar" ? "تم قبول طلب الدفع بنجاح" : "Payment approved successfully");

      const studentName =
        targetPayment.full_name ||
        targetPayment.student?.full_name ||
        [
          targetPayment.student?.first_name,
          targetPayment.student?.father_name,
          targetPayment.student?.family_name,
        ]
          .filter(Boolean)
          .join(" ") ||
        "Student";

      const primaryItem = targetPayment.order?.items?.[0];
      const courseTitle =
        primaryItem?.course_title?.[locale] ||
        primaryItem?.course_title?.ar ||
        primaryItem?.course_title?.en ||
        targetPayment.order?.order_number ||
        "Course Subscription";

      const deliveryMode =
        primaryItem?.selected_delivery_mode || primaryItem?.delivery_mode || "online";

      const studentPhone =
        targetPayment.submitted_phone || targetPayment.phone || targetPayment.student?.phone || "";

      const studentGrade =
        primaryItem?.educational_stage_name?.[locale] ||
        primaryItem?.educational_stage_name?.ar ||
        targetPayment.student?.educational_stage?.name?.[locale] ||
        targetPayment.student?.educational_stage?.name?.ar ||
        "-";

      const studentObj: Student = {
        id: String(targetPayment.student_id || targetPayment.student?.id || id),
        firstName: studentName,
        lastName: "",
        phoneNumber: studentPhone,
        parentPhoneNumber: studentPhone,
        gender: "male",
        email: targetPayment.email || targetPayment.student?.email || "student@example.com",
        country: locale === "ar" ? "مصر" : "Egypt",
        state: locale === "ar" ? "القاهرة" : "Cairo",
        grade: studentGrade,
        registrationType: deliveryMode === "online" ? "online" : "center",
      };

      const transactionObj: StudentTransaction = {
        id: String(targetPayment.id),
        studentId: String(targetPayment.student_id),
        type: "deposit",
        amount: Number(targetPayment.amount || 0),
        notes: `${locale === "ar" ? "اشتراك في دورة:" : "Course Subscription:"} ${courseTitle}`,
        createdAt: targetPayment.created_at || new Date().toISOString(),
      };

      setGeneratedInvoiceData({ student: studentObj, transaction: transactionObj });
      setIsInvoiceModalOpen(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to approve payment";
      toast.error(errorMsg);
    }
  };

  const handleReject = async (id: string | number, reason: string) => {
    try {
      await rejectPaymentMutation.mutateAsync({
        paymentId: id,
        data: { rejection_reason: reason },
      });
      toast.success(locale === "ar" ? "تم رفض الطلب بنجاح" : "Payment rejected successfully");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reject payment";
      toast.error(errorMsg);
    }
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return locale === "ar" ? "أخرى" : "Other";
    const m = method.toLowerCase();
    if (m.includes("insta")) return "InstaPay";
    if (m.includes("voda") || m.includes("cash") || m.includes("wallet")) return "Vodafone Cash";
    if (m.includes("card") || m.includes("credit") || m.includes("stripe") || m.includes("paymob"))
      return "Credit Card";
    if (m.includes("fawry")) return "Fawry";
    if (m.includes("manual")) return locale === "ar" ? "تحويل يدوي" : "Manual Transfer";
    return method;
  };

  return (
    <>
      <DashboardCard className="lg:col-span-6 overflow-hidden">
        <div className="w-full flex flex-col h-full justify-between">
          <div>
            <DashboardCardHeader
              icon={<CreditCard className="size-5 text-primary" />}
              title={t("lastBillingRequests")}
              badge={
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20"
                >
                  {t("pendingRequestsCount", { count: pendingPayments.length })}
                </Badge>
              }
              action={{
                label: t("manageBilling"),
                href: "/dashboard/billing",
              }}
            />

            {/* Table */}
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 *:rtl:text-start">
                    <TableHead className="text-xs">{t("billingTable.name")}</TableHead>
                    <TableHead className="text-xs">{t("billingTable.amount")}</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">
                      {t("billingTable.paymentMethod")}
                    </TableHead>
                    <TableHead className="text-xs">{t("billingTable.status")}</TableHead>
                    <TableHead className="text-xs text-end">{t("billingTable.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span className="text-xs">
                            {locale === "ar" ? "جارٍ التحميل..." : "Loading..."}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        {locale === "ar"
                          ? "لا توجد طلبات فواتير حديثة"
                          : "No recent billing requests"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedPayments.map((payment) => {
                      const statusBadgeVariant =
                        payment.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : payment.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20";

                      const studentName =
                        payment.full_name ||
                        payment.student?.full_name ||
                        [
                          payment.student?.first_name,
                          payment.student?.father_name,
                          payment.student?.family_name,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        "Student";

                      return (
                        <TableRow key={payment.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-medium">
                            <div className="font-bold text-foreground truncate max-w-36">
                              {studentName}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-primary">
                            {t("currencyEgp", { amount: payment.amount })}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[11px] font-medium">
                                {formatPaymentMethod(payment.method)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium ${statusBadgeVariant}`}
                            >
                              {payment.status === "pending"
                                ? locale === "ar"
                                  ? "قيد الانتظار"
                                  : "Pending"
                                : payment.status === "approved"
                                  ? locale === "ar"
                                    ? "مقبول"
                                    : "Accepted"
                                  : locale === "ar"
                                    ? "مرفوض"
                                    : "Rejected"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleEyeClick(payment)}
                              title={t("billingTable.viewInvoice")}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Request Details Modal */}
      <RequestDetailsModal
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      {/* Generated Printable Student Invoice Modal */}
      {generatedInvoiceData && (
        <StudentInvoiceModal
          student={generatedInvoiceData.student}
          transaction={generatedInvoiceData.transaction}
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </>
  );
}
