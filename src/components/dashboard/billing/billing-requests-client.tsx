"use client";

import { StudentInvoiceModal } from "@/components/dashboard/students/student-invoice-modal";
import type { Student, StudentTransaction } from "@/types/student";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneLink, WhatsAppIcon } from "@/components/ui/phone-link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApprovePayment, usePaymentsList, useRejectPayment } from "@/hooks/use-billing";
import type { BackendPayment, BackendPaymentStatus } from "@/types/api-contracts";
import {
  ArrowUpDown,
  BarChart3,
  Barcode,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  Receipt,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { RequestDetailsModal } from "./request-details-modal";

const emptySubscribe = () => () => {};

export function BillingRequestsClient() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const locale = useLocale();
  const t = useTranslations("billingRequestsPage");
  const tCourses = useTranslations("courses");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL query params
  const searchQuery = searchParams.get("search") || "";
  const statusTab = (searchParams.get("status") as "all" | BackendPaymentStatus) || "all";
  const venueFilter = (searchParams.get("venue") as "all" | "center" | "online") || "all";
  const sortBy =
    (searchParams.get("sort") as "newest" | "oldest" | "amountDesc" | "amountAsc") || "newest";

  const isFilterActive =
    Boolean(searchQuery.trim()) ||
    statusTab !== "all" ||
    venueFilter !== "all" ||
    sortBy !== "newest";

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        (key === "status" && value === "all") ||
        (key === "venue" && value === "all") ||
        (key === "sort" && value === "newest")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleResetFilters = () => {
    updateUrlParams({
      search: null,
      status: null,
      venue: null,
      sort: null,
    });
  };

  // Queries & Mutations
  const {
    data: paymentsData,
    isLoading,
    isFetching,
    refetch,
  } = usePaymentsList({
    search: searchQuery.trim() || undefined,
    status: statusTab !== "all" ? statusTab : undefined,
    sort:
      sortBy === "oldest"
        ? "oldest"
        : sortBy === "amountDesc"
          ? "amount_desc"
          : sortBy === "amountAsc"
            ? "amount_asc"
            : "latest",
    per_page: 50,
  });

  const isSpinning = isMounted && (isLoading || isFetching);

  const approvePaymentMutation = useApprovePayment();
  const rejectPaymentMutation = useRejectPayment();

  const payments: BackendPayment[] = useMemo(
    () => paymentsData?.payments ?? [],
    [paymentsData?.payments],
  );

  const [selectedPayment, setSelectedPayment] = useState<BackendPayment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute stat counts from payments list
  const stats = useMemo(() => {
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingCount = payments.filter((p) => p.status === "pending").length;
    const acceptedCount = payments.filter((p) => p.status === "approved").length;
    const rejectedCount = payments.filter((p) => p.status === "rejected").length;
    return {
      totalPayments,
      pendingCount,
      acceptedCount,
      rejectedCount,
    };
  }, [payments]);

  // Format delivery mode / venue helper
  const formatVenue = (mode?: string | null) => {
    if (!mode) return "";
    if (tCourses.has(`venue.${mode}`)) {
      return tCourses(`venue.${mode}`);
    }
    return mode;
  };

  // Format payment method helper
  const formatPaymentMethod = (method?: string) => {
    if (!method) return t("methods.other");
    const m = method.toLowerCase();
    if (m.includes("insta")) return t("methods.instapay");
    if (m.includes("voda") || m.includes("cash") || m.includes("wallet"))
      return t("methods.vodafone_cash");
    if (m.includes("card") || m.includes("credit") || m.includes("stripe") || m.includes("paymob"))
      return t("methods.credit_card");
    if (m.includes("fawry")) return t("methods.fawry");
    if (m.includes("manual")) return t("methods.manual");
    return method;
  };

  // Invoice modal state
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<{
    student: Student;
    transaction: StudentTransaction;
  } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Handle Accept / Reject actions
  const handleAccept = async (id: string | number) => {
    const targetPayment = payments.find((p) => String(p.id) === String(id));
    if (!targetPayment) return;

    try {
      await approvePaymentMutation.mutateAsync(id);
      toast.success(t("approveSuccess"));

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
      toast.success(t("rejectSuccess"));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reject payment";
      toast.error(errorMsg);
    }
  };

  // Client-side venue filter when selected
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (venueFilter === "all") return true;
      const firstItem = payment.order?.items?.[0];
      const deliveryMode =
        firstItem?.selected_delivery_mode || firstItem?.delivery_mode || "online";
      if (venueFilter === "center") return deliveryMode === "center" || deliveryMode === "onsite";
      if (venueFilter === "online") return deliveryMode === "online";
      return true;
    });
  }, [payments, venueFilter]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: PAGE HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="self-start sm:self-auto font-semibold"
            disabled={isSpinning}
          >
            <RotateCcw className={`size-3.5 me-1.5 ${isSpinning ? "animate-spin" : ""}`} />
            {locale === "ar" ? "تحديث البيانات" : "Refresh"}
          </Button>
          <Button asChild variant="outline" className="font-semibold">
            <Link href={`/${locale}/dashboard/courses/codes`}>
              <Barcode className="size-3.5 me-1.5" />
              {t("actions.codeGroups")}
            </Link>
          </Button>
          <Button asChild className="font-semibold">
            <Link href="/dashboard/billing/report">
              <BarChart3 className="size-3.5 me-1.5" />
              {t("actions.viewFinancialReport")}
            </Link>
          </Button>
        </div>
      </div>

      {/* SECTION 2: 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.totalPayments")}
            </span>
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">
              {stats.totalPayments}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {locale === "ar" ? "ج" : "EGP"}
              </span>
            </span>
          </div>
        </DashboardCard>

        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.pendingRequests")}
            </span>
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.pendingCount}</span>
          </div>
        </DashboardCard>

        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.acceptedRequests")}
            </span>
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.acceptedCount}</span>
          </div>
        </DashboardCard>

        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.rejectedRequests")}
            </span>
            <div className="size-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.rejectedCount}</span>
          </div>
        </DashboardCard>
      </div>

      {/* SECTION 3: FILTER & SEARCH BAR */}
      <DashboardCard className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t("filters.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => updateUrlParams({ search: e.target.value })}
              className="ps-9 pe-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => updateUrlParams({ search: null })}
                className="absolute inset-e-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5 me-1.5" />
                {t("filters.resetFilters")}
              </Button>
            )}

            <Tabs
              value={statusTab}
              onValueChange={(val) => updateUrlParams({ status: val })}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-9 bg-muted/60">
                <TabsTrigger value="pending" className="text-xs font-medium h-9">
                  {t("filters.tabs.pending")}
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs font-medium h-9">
                  {t("filters.tabs.accepted")}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs font-medium h-9">
                  {t("filters.tabs.rejected")}
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs font-medium h-9">
                  {t("filters.tabs.all")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={venueFilter} onValueChange={(v) => updateUrlParams({ venue: v })}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-36 shrink-0">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("filters.venue.all")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  {t("filters.venue.all")}
                </SelectItem>
                <SelectItem value="center" className="text-xs">
                  {t("filters.venue.center")}
                </SelectItem>
                <SelectItem value="online" className="text-xs">
                  {t("filters.venue.online")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => updateUrlParams({ sort: v })}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-44 shrink-0">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("filters.sort.label")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  {t("filters.sort.newest")}
                </SelectItem>
                <SelectItem value="oldest" className="text-xs">
                  {t("filters.sort.oldest")}
                </SelectItem>
                <SelectItem value="amountDesc" className="text-xs">
                  {t("filters.sort.amountDesc")}
                </SelectItem>
                <SelectItem value="amountAsc" className="text-xs">
                  {t("filters.sort.amountAsc")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DashboardCard>

      {/* SECTION 4: BILLING REQUESTS TABLE */}
      <DashboardCard className="p-0 overflow-hidden border-border/80 shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 *:rtl:text-start">
                <TableHead className="text-xs font-bold">
                  {t("table.columns.studentFullName")}
                </TableHead>
                <TableHead className="text-xs font-bold">
                  {t("table.columns.studentPhoneNumber")}
                </TableHead>
                <TableHead className="text-xs font-bold">{t("table.columns.grade")}</TableHead>
                <TableHead className="text-xs font-bold">{t("table.columns.amount")}</TableHead>
                <TableHead className="text-xs font-bold">
                  {t("table.columns.paymentMethod")}
                </TableHead>
                <TableHead className="text-xs font-bold">{t("table.columns.course")}</TableHead>
                <TableHead className="text-xs font-bold">{t("table.columns.venue")}</TableHead>
                <TableHead className="text-xs font-bold">{t("table.columns.status")}</TableHead>
                <TableHead className="text-xs font-bold text-end">
                  {t("table.columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="font-semibold text-sm">
                        {locale === "ar"
                          ? "جارٍ تحميل طلبات الفواتير..."
                          : "Loading billing requests..."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <Receipt className="size-10 text-muted-foreground/50" />
                      <p className="font-semibold text-sm">{t("table.empty.title")}</p>
                      <p className="text-xs">{t("table.empty.description")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
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
                    "-";

                  const studentPhone =
                    payment.submitted_phone || payment.phone || payment.student?.phone || "-";

                  const firstItem = payment.order?.items?.[0];
                  const courseTitle =
                    firstItem?.course_title?.[locale] ||
                    firstItem?.course_title?.ar ||
                    firstItem?.course_title?.en ||
                    "-";

                  const stageName =
                    firstItem?.educational_stage_name?.[locale] ||
                    firstItem?.educational_stage_name?.ar ||
                    payment.student?.educational_stage?.name?.[locale] ||
                    payment.student?.educational_stage?.name?.ar ||
                    "-";

                  const deliveryMode =
                    firstItem?.selected_delivery_mode || firstItem?.delivery_mode || "online";

                  const displayStatus = payment.status === "approved" ? "accepted" : payment.status;

                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-bold text-foreground">
                        {studentName}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {studentPhone !== "-" ? (
                          <PhoneLink
                            phone={studentPhone}
                            className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium w-fit hover:text-emerald-600 transition-colors"
                          >
                            <span className="flex items-center justify-center size-4 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                              <WhatsAppIcon className="size-3" />
                            </span>
                            <span dir="ltr" className="tracking-tight">
                              {studentPhone}
                            </span>
                          </PhoneLink>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">{stageName}</TableCell>

                      <TableCell className="text-xs font-extrabold text-primary">
                        {payment.amount} {payment.currency_code || (locale === "ar" ? "ج" : "EGP")}
                      </TableCell>

                      <TableCell className="text-xs font-medium text-foreground">
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {formatPaymentMethod(payment.method)}
                        </Badge>
                      </TableCell>

                      <TableCell
                        className="text-xs font-medium text-foreground max-w-50 truncate"
                        title={courseTitle}
                      >
                        {courseTitle}
                      </TableCell>

                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {formatVenue(deliveryMode)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${statusBadgeVariant}`}
                        >
                          {t(`status.${displayStatus}` as Parameters<typeof t>[0])}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsModalOpen(true);
                          }}
                          title={t("table.viewDetails")}
                        >
                          <Eye className="size-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardCard>

      {/* Details Modal */}
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
    </div>
  );
}
