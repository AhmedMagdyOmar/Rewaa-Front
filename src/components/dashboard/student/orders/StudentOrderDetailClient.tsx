/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { StudentInvoiceModal } from "@/components/dashboard/students/student-invoice-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentOrder, useStudentPaymentAccounts } from "@/hooks/use-student-orders";
import { useStudentWebsiteWallet } from "@/hooks/use-student-wallet";
import { Link } from "@/i18n/routing";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { BackendOrderStatus, BackendPayment } from "@/types/api-contracts";
import type { Student, StudentTransaction } from "@/types/student";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck,
  Printer,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import {
  PaymentTab,
  StudentCheckoutPaymentMethodSelector,
} from "./StudentCheckoutPaymentMethodSelector";
import { StudentManualPaymentForm } from "./StudentManualPaymentForm";
import { StudentWalletPayConfirm } from "./StudentWalletPayConfirm";

interface StudentOrderDetailClientProps {
  orderId: string;
}

export function StudentOrderDetailClient({ orderId }: StudentOrderDetailClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const BackArrow = isAr ? ArrowRight : ArrowLeft;
  const authUser = useAuthStore((s) => s.user);

  const t = useTranslations("studentOrders.detail");
  const tStatus = useTranslations("studentOrders.status");
  const tMethods = useTranslations("studentOrders.paymentMethods");
  const tCourses = useTranslations("courses");
  const tCommon = useTranslations("common");

  const [selectedTab, setSelectedTab] = React.useState<PaymentTab>("wallet");
  const [mounted, setMounted] = React.useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [invoiceData, setInvoiceData] = React.useState<{
    student: Student;
    transaction: StudentTransaction;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live order details
  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
    refetch: refetchOrder,
    isFetching: isOrderFetching,
  } = useStudentOrder(orderId);

  // Fetch payment accounts for manual bank transfer
  const { data: paymentAccounts = [] } = useStudentPaymentAccounts();

  // Fetch live student wallet
  const { data: walletData } = useStudentWebsiteWallet();
  const walletBalance = Number(walletData?.balance ?? 0);

  const rawCurrency = order?.currency_code;
  const currency = rawCurrency
    ? rawCurrency === "SAR"
      ? tCommon("sar")
      : rawCurrency === "EGP"
        ? tCommon("egp")
        : rawCurrency
    : tCommon("egp");
  const remainingAmount = Number(order?.remaining_amount ?? order?.total_amount ?? 0);

  const resolveTranslation = (field?: Record<string, string> | string | null): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const getStatusBadge = (status?: BackendOrderStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1.5 font-medium">
            <CheckCircle2 className="size-3.5" />
            {tStatus("paid")}
          </Badge>
        );
      case "awaiting_payment":
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1.5 font-medium">
            <Clock className="size-3.5" />
            {tStatus("awaiting_payment")}
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1.5 font-medium">
            <RefreshCw className="size-3.5 animate-spin" />
            {tStatus("under_review")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1.5 font-medium">
            <XCircle className="size-3.5" />
            {tStatus("cancelled")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1.5 font-medium">
            <AlertCircle className="size-3.5" />
            {status}
          </Badge>
        );
    }
  };

  const getDeliveryModeLabel = (mode?: string | null) => {
    if (!mode) return "";
    if (tCourses.has(`venue.${mode}`)) {
      return tCourses(`venue.${mode}`);
    }
    return mode;
  };

  if (isOrderLoading) {
    return (
      <div className="space-y-6 w-full max-w-5xl mx-auto py-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isOrderError || !order) {
    return (
      <div className="w-full max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="size-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">{t("notFoundTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("notFoundDesc")}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => refetchOrder()}>
            {tCommon("refresh")}
          </Button>
          <Button asChild>
            <Link href="/student-dashboard/orders">{t("backToOrders")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPending = order.status === "awaiting_payment" || order.status === "pending";
  const isPaid = order.status === "paid";
  const isUnderReview = order.status === "under_review";
  const latestPayment =
    order.payments && order.payments.length > 0
      ? [...order.payments].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : undefined;

  const handleOpenInvoice = (paymentToInvoice?: BackendPayment) => {
    const p =
      paymentToInvoice ||
      order.payments?.find((pay) => pay.status === "approved") ||
      order.payments?.[0];
    const courseTitles =
      order.items
        ?.map((item) => resolveTranslation(item.course_title))
        .filter(Boolean)
        .join(", ") || t("courseFallback");

    const studentObj: Student = {
      id: String(order.student_id || authUser?.id || "0"),
      firstName: order.student?.full_name || authUser?.full_name || "Student",
      lastName: "",
      phoneNumber: order.student?.phone || "",
      parentPhoneNumber: order.student?.phone || "",
      gender: "male",
      email: order.student?.email || authUser?.email || "student@example.com",
      country: locale === "ar" ? "مصر" : "Egypt",
      state: locale === "ar" ? "القاهرة" : "Cairo",
      grade: "",
      registrationType: "online",
    };

    const transactionObj: StudentTransaction = {
      id: String(p?.id || order.invoice_number || order.order_number || order.id),
      studentId: String(order.student_id || authUser?.id || "0"),
      type: "deposit",
      amount: Number(p?.amount || order.paid_amount || order.total_amount || 0),
      notes: `${locale === "ar" ? "طلب رقم" : "Order"} ${order.order_number || `#${order.id}`} - ${courseTitles}`,
      createdAt: p?.created_at || order.paid_at || order.created_at || new Date().toISOString(),
    };

    setInvoiceData({ student: studentObj, transaction: transactionObj });
    setInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto py-4">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ms-2 mb-1 gap-1.5 h-8 px-2 text-xs"
          >
            <Link href="/student-dashboard/orders">
              <BackArrow className="size-4" />
              {t("backToOrders")}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("title")} {order.order_number || `#${order.id}`}
            </h1>
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenInvoice()}
              className="gap-2 text-primary hover:text-primary font-medium"
            >
              <Printer className="size-4" />
              {t("viewInvoice")}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrder()}
            disabled={mounted ? isOrderFetching : false}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${mounted && isOrderFetching ? "animate-spin" : ""}`} />
            {tCommon("refresh")}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left = Items & Payment Flow, Right = Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Items & Payment Options */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Order Items Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                {t("orderItems")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {resolveTranslation(item.course_title) || t("courseFallback")}
                    </p>
                    {(item.selected_delivery_mode || item.delivery_mode) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("deliveryMode")}{" "}
                        <span className="font-medium text-foreground">
                          {getDeliveryModeLabel(item.selected_delivery_mode || item.delivery_mode)}
                        </span>
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-sm text-foreground shrink-0">
                    {Number(item.final_price ?? item.original_price).toFixed(2)} {currency}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rejection Alert Notice if last payment was rejected and order is awaiting payment */}
          {isPending && latestPayment?.status === "rejected" && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-destructive">
                  <XCircle className="size-5 shrink-0" />
                  <h3 className="font-bold text-base">{t("rejectedTitle")}</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("rejectedDesc")}
                </p>
                {latestPayment.rejection_reason && (
                  <div className="rounded-xl border border-destructive/20 bg-background/70 p-3.5 space-y-1 mt-2">
                    <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                      <AlertCircle className="size-3.5" />
                      {t("rejectionReasonTitle")}
                    </span>
                    <p className="text-xs sm:text-sm text-foreground font-medium whitespace-pre-wrap">
                      {latestPayment.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Checkout & Payment Area (Only when order is awaiting payment) */}
          {isPending && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">{t("paymentMethod")}</h2>
                <p className="text-xs text-muted-foreground">{t("paymentMethodSubtitle")}</p>
              </div>

              {/* Selector Tabs */}
              <StudentCheckoutPaymentMethodSelector
                selectedTab={selectedTab}
                onSelectTab={setSelectedTab}
                walletBalance={walletBalance}
                remainingAmount={remainingAmount}
                currency={currency}
              />

              {/* Selected Method Content */}
              {selectedTab === "wallet" ? (
                <StudentWalletPayConfirm
                  order={order}
                  walletBalance={walletBalance}
                  currency={currency}
                />
              ) : (
                <StudentManualPaymentForm
                  order={order}
                  paymentAccounts={paymentAccounts}
                  currency={currency}
                />
              )}
            </div>
          )}

          {/* Under Review Notice */}
          {isUnderReview && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-blue-600">
                  <RefreshCw className="size-6 animate-spin shrink-0" />
                  <h3 className="font-bold text-base">{t("underReviewTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("underReviewDesc")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Paid Notice with Course Links */}
          {isPaid && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 className="size-6 shrink-0" />
                  <div>
                    <h3 className="font-bold text-base">{t("paidTitle")}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("paidDesc")}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={() => handleOpenInvoice()}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <Printer className="size-4" />
                    {t("viewInvoice")}
                  </Button>
                  {order.items?.map((item) => (
                    <Button key={item.id} asChild variant="outline" className="gap-2">
                      <Link href={`/student-dashboard/courses/${item.course_id}`}>
                        <BookOpen className="size-4" />
                        {t("goToCourse")}
                      </Link>
                    </Button>
                  ))}
                  <Button asChild variant="ghost">
                    <Link href="/student-dashboard/courses">{t("viewMyCourses")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History Table */}
          {order.payments && order.payments.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileCheck className="size-4 text-primary" />
                  {t("paymentHistory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.payments.map((payment: BackendPayment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {payment.method === "wallet" || payment.method === "student_wallet"
                            ? tMethods("wallet")
                            : tMethods.has(payment.method)
                              ? tMethods(payment.method)
                              : tMethods("manual")}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            payment.status === "approved"
                              ? "text-emerald-600 border-emerald-500/40 bg-emerald-500/10 text-xs"
                              : payment.status === "pending"
                                ? "text-amber-600 border-amber-500/40 bg-amber-500/10 text-xs"
                                : payment.status === "rejected"
                                  ? "text-destructive border-destructive/40 bg-destructive/10 text-xs"
                                  : "text-muted-foreground text-xs"
                          }
                        >
                          {tStatus(payment.status as "pending" | "approved" | "rejected") ||
                            payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {payment.created_at
                          ? new Date(payment.created_at).toLocaleDateString(
                              locale === "ar" ? "ar-EG" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "—"}
                      </p>
                      {payment.status === "rejected" && payment.rejection_reason && (
                        <p className="text-xs text-destructive font-medium pt-1">
                          <span className="font-semibold">{t("rejectionReasonTitle")}</span>{" "}
                          {payment.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="font-bold text-foreground me-1">
                        {Number(payment.amount).toFixed(2)} {currency}
                      </span>
                      {payment.status === "approved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInvoice(payment)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Printer className="size-3.5" />
                          {t("printInvoice")}
                        </Button>
                      )}
                      {payment.proof?.url && (
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                          <a href={payment.proof.url} target="_blank" rel="noopener noreferrer">
                            {t("viewReceipt")}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <Card className="border-border/60 sticky top-20 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">{t("summaryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span className="font-medium text-foreground">
                  {Number(order.subtotal ?? order.total_amount).toFixed(2)} {currency}
                </span>
              </div>

              {Number(order.discount_amount) > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>{t("discount")}</span>
                  <span className="font-medium">
                    -{Number(order.discount_amount).toFixed(2)} {currency}
                  </span>
                </div>
              )}

              <div className="h-px bg-border/60" />

              <div className="flex items-center justify-between text-base font-bold">
                <span className="text-foreground">{t("totalAmount")}</span>
                <span className="text-primary font-mono">
                  {Number(order.total_amount).toFixed(2)} {currency}
                </span>
              </div>

              {Number(order.paid_amount) > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600">
                  <span>{t("paidAmount")}</span>
                  <span className="font-medium font-mono">
                    {Number(order.paid_amount).toFixed(2)} {currency}
                  </span>
                </div>
              )}

              {order.status !== "paid" && (
                <div className="flex items-center justify-between text-xs text-amber-600 pt-1 border-t border-border/40 font-semibold">
                  <span>{t("remainingBalance")}</span>
                  <span className="font-mono text-sm">
                    {remainingAmount.toFixed(2)} {currency}
                  </span>
                </div>
              )}

              {/* Order Meta details */}
              <div className="pt-4 border-t border-border/50 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{t("createdAt")}</span>
                  <span className="font-medium text-foreground">
                    {new Date(order.created_at).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("orderStatus")}</span>
                  <span className="font-medium text-foreground capitalize">
                    {tStatus(
                      order.status as
                        | "paid"
                        | "awaiting_payment"
                        | "under_review"
                        | "cancelled"
                        | "refunded"
                        | "pending",
                    ) ||
                      order.status_label ||
                      order.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Printable / Downloadable Student Invoice Modal */}
      {invoiceData && (
        <StudentInvoiceModal
          student={invoiceData.student}
          transaction={invoiceData.transaction}
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
}
