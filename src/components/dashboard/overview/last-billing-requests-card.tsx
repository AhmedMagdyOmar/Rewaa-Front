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
import {
  getStoredBillingRequests,
  updateBillingRequestStatus,
} from "@/lib/billing-requests-storage";
import { BillingRequestItem } from "@/types/billing-request";
import { Student, StudentTransaction } from "@/types/student";
import { CreditCard, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";

export type BillingRequest = BillingRequestItem;

interface LastBillingRequestsCardProps {
  billingRequests?: BillingRequestItem[];
  onSelectInvoice?: (invoice: BillingRequestItem) => void;
}

export function LastBillingRequestsCard({
  billingRequests: initialRequests,
  onSelectInvoice,
}: LastBillingRequestsCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [requests, setRequests] = useState<BillingRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BillingRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generated printable invoice modal state
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<{
    student: Student;
    transaction: StudentTransaction;
  } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    const loadRequests = () => {
      if (initialRequests && initialRequests.length > 0) {
        setRequests(initialRequests);
      } else {
        setRequests(getStoredBillingRequests());
      }
    };

    loadRequests();

    const handleStorageUpdate = () => {
      setRequests(getStoredBillingRequests());
    };

    window.addEventListener("rewaa_billing_requests_updated", handleStorageUpdate);
    return () => {
      window.removeEventListener("rewaa_billing_requests_updated", handleStorageUpdate);
    };
  }, [initialRequests]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const displayedRequests = requests.slice(0, 5);

  const handleEyeClick = (req: BillingRequestItem) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
    if (onSelectInvoice) {
      onSelectInvoice(req);
    }
  };

  const handleAccept = (id: string) => {
    const targetReq = requests.find((r) => r.id === id);
    if (!targetReq) return;

    const updated = updateBillingRequestStatus(id, "accepted");
    setRequests(updated);

    const mockStudent: Student = {
      id: targetReq.studentId,
      firstName: targetReq.studentFullName,
      lastName: "",
      phoneNumber: targetReq.studentPhoneNumber,
      parentPhoneNumber: targetReq.studentPhoneNumber,
      gender: "male",
      email: targetReq.studentEmail || "student@example.com",
      country: locale === "ar" ? "مصر" : "Egypt",
      state: locale === "ar" ? "القاهرة" : "Cairo",
      grade: targetReq.grade,
      registrationType: targetReq.venue === "online" ? "online" : "center",
    };

    const mockTransaction: StudentTransaction = {
      id: targetReq.id,
      studentId: targetReq.studentId,
      type: "deposit",
      amount: targetReq.amount,
      notes: `${locale === "ar" ? "اشتراك في دورة:" : "Course Subscription:"} ${targetReq.courseName}`,
      createdAt: new Date().toISOString(),
    };

    setGeneratedInvoiceData({ student: mockStudent, transaction: mockTransaction });
    setIsInvoiceModalOpen(true);
  };

  const handleReject = (id: string, reason: string) => {
    const updated = updateBillingRequestStatus(id, "rejected", reason);
    setRequests(updated);
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
                  {t("pendingRequestsCount", { count: pendingRequests.length })}
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
                  {displayedRequests.map((req) => {
                    const statusBadgeVariant =
                      req.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : req.status === "accepted"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20";

                    return (
                      <TableRow key={req.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">
                          <div className="font-bold text-foreground truncate max-w-36">
                            {req.studentFullName}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          {t("currencyEgp", { amount: req.amount })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[11px] font-medium">
                              {req.paymentMethod
                                ? t(`paymentMethods.${req.paymentMethod}`)
                                : locale === "ar"
                                  ? "أخرى"
                                  : "Other"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-medium ${statusBadgeVariant}`}
                          >
                            {req.status === "pending"
                              ? locale === "ar"
                                ? "قيد الانتظار"
                                : "Pending"
                              : req.status === "accepted"
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
                            onClick={() => handleEyeClick(req)}
                            title={t("billingTable.viewInvoice")}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Request Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
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
