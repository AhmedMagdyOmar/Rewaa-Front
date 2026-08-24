/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { StudentInvoiceModal } from "@/components/dashboard/students/student-invoice-modal";
import { Student, StudentTransaction } from "@/types/student";

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
import {
  getStoredBillingRequests,
  resetStoredBillingRequests,
  updateBillingRequestStatus,
} from "@/lib/billing-requests-storage";
import { BillingRequestItem, BillingRequestStatus } from "@/types/billing-request";
import {
  ArrowUpDown,
  BarChart3,
  Barcode,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
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
import { useEffect, useMemo, useState } from "react";
import { RequestDetailsModal } from "./request-details-modal";

export function BillingRequestsClient() {
  const locale = useLocale();
  const t = useTranslations("billingRequestsPage");
  const tGrades = useTranslations("courses.new.grades");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL query params
  const searchQuery = searchParams.get("search") || "";
  const statusTab = (searchParams.get("status") as "all" | BillingRequestStatus) || "all";
  const venueFilter = (searchParams.get("venue") as "all" | "center" | "online") || "all";
  const sortBy =
    (searchParams.get("sort") as "newest" | "oldest" | "amountDesc" | "amountAsc") || "newest";

  const isFilterActive =
    Boolean(searchQuery.trim()) ||
    (statusTab !== "all" && statusTab !== "pending") ||
    venueFilter !== "all" ||
    sortBy !== "newest";

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        (key === "status" && value === "pending") ||
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

  const [requests, setRequests] = useState<BillingRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BillingRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setRequests(getStoredBillingRequests());
  }, []);

  // Compute stat counts
  const stats = useMemo(() => {
    const totalPayments = requests.reduce((sum, req) => sum + req.amount, 0);
    const pendingCount = requests.filter((r) => r.status === "pending").length;
    const acceptedCount = requests.filter((r) => r.status === "accepted").length;
    const rejectedCount = requests.filter((r) => r.status === "rejected").length;
    return {
      totalPayments,
      pendingCount,
      acceptedCount,
      rejectedCount,
    };
  }, [requests]);

  // Format grade helper
  const formatGrade = (gradeKey: string) => {
    if (!gradeKey) return "-";
    return tGrades.has(gradeKey as Parameters<typeof tGrades.has>[0])
      ? tGrades(gradeKey as Parameters<typeof tGrades>[0])
      : gradeKey;
  };

  // Format venue helper
  const formatVenue = (venue: string) => {
    if (venue === "center") return locale === "ar" ? "سنتر" : "Center";
    if (venue === "online") return locale === "ar" ? "أونلاين" : "Online";
    return locale === "ar" ? "الكل" : "All";
  };

  // Format payment method helper
  const formatPaymentMethod = (method?: string) => {
    switch (method) {
      case "vodafoneCash":
        return locale === "ar" ? "فودافون كاش" : "Vodafone Cash";
      case "creditCard":
        return locale === "ar" ? "بطاقة ائتمان" : "Credit Card";
      case "fawry":
        return locale === "ar" ? "فوري" : "Fawry";
      case "instaPay":
        return locale === "ar" ? "إنستاباي" : "InstaPay";
      default:
        return locale === "ar" ? "أخرى" : "Other";
    }
  };

  // Invoice modal state
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<{
    student: Student;
    transaction: StudentTransaction;
  } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Handle Accept / Reject actions
  const handleAccept = (id: string) => {
    const targetReq = requests.find((r) => r.id === id);
    if (!targetReq) return;

    const updated = updateBillingRequestStatus(id, "accepted");
    setRequests(updated);

    // Build mock Student and StudentTransaction to render in StudentInvoiceModal
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

  // Filter & Sort Logic
  const filteredAndSortedRequests = useMemo(() => {
    return requests
      .filter((req) => {
        // Status filter tab
        if (statusTab !== "all" && req.status !== statusTab) {
          return false;
        }

        // Venue filter
        if (venueFilter !== "all" && req.venue !== venueFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = req.studentFullName.toLowerCase().includes(q);
          const matchPhone = req.studentPhoneNumber.includes(q);
          const matchId = req.id.toLowerCase().includes(q);
          const matchCourse = req.courseName.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchId && !matchCourse) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "amountDesc") {
          return b.amount - a.amount;
        }
        if (sortBy === "amountAsc") {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [requests, statusTab, venueFilter, searchQuery, sortBy]);

  const handleReset = () => {
    const fresh = resetStoredBillingRequests();
    setRequests(fresh);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: PAGE HEADER & TITLE
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="self-start sm:self-auto font-semibold"
          >
            <RotateCcw className="size-3.5 me-1.5" />
            {locale === "ar" ? "إعادة ضبط البيانات" : "Reset Mock Data"}
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: 4 STAT CARDS
          - Total Payments
          - Pending Requests
          - Accepted Requests
          - Rejected Requests
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payments */}
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

        {/* Pending Requests */}
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

        {/* Accepted Requests */}
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

        {/* Rejected Requests */}
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: FILTERS & SEARCH BAR
          - Search Input
          - Status Tabs (Pending | Accepted | Rejected | All)
          - Sort Select
      ────────────────────────────────────────────────────────────────────────────── */}
      <DashboardCard className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input (Takes all available space) */}
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => updateUrlParams({ search: e.target.value })}
              placeholder={t("filters.searchPlaceholder")}
              className="ps-9 h-9 text-xs w-full"
            />
          </div>

          {/* Status Tabs, Venue, Sort & Clear Container */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5 shrink-0 self-start sm:self-auto"
              >
                <X className="h-3.5 w-3.5 me-1.5" />
                {t("filters.resetFilters")}
              </Button>
            )}

            {/* Status Tabs */}
            <Tabs
              defaultValue="pending"
              value={statusTab}
              onValueChange={(v) => updateUrlParams({ status: v })}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full sm:w-auto *:py-2">
                <TabsTrigger value="pending" className="text-xs font-medium">
                  {t("filters.tabs.pending")}
                </TabsTrigger>
                <TabsTrigger value="accepted" className="text-xs font-medium">
                  {t("filters.tabs.accepted")}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs font-medium">
                  {t("filters.tabs.rejected")}
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs font-medium">
                  {t("filters.tabs.all")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Venue Filter Select */}
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

            {/* Sort Select */}
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 4: BILLING REQUESTS TABLE
          Columns:
          1. Student Full Name
          2. Student Phone Number
          3. Grade
          4. Amount
          5. Payment Method
          6. Course
          7. Venue
          8. Status
          9. Actions: Eye Icon to view details
      ────────────────────────────────────────────────────────────────────────────── */}
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
              {filteredAndSortedRequests.length === 0 ? (
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
                filteredAndSortedRequests.map((req) => {
                  const statusBadgeVariant =
                    req.status === "pending"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : req.status === "accepted"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 border-red-500/20";

                  return (
                    <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                      {/* Student Full Name */}
                      <TableCell className="text-xs font-bold text-foreground">
                        {req.studentFullName}
                      </TableCell>

                      {/* Student Phone Number */}
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        <PhoneLink
                          phone={req.studentPhoneNumber}
                          className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium w-fit hover:text-emerald-600 transition-colors"
                        >
                          <span className="flex items-center justify-center size-4 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                            <WhatsAppIcon className="size-3" />
                          </span>
                          <span dir="ltr" className="tracking-tight">
                            {req.studentPhoneNumber}
                          </span>
                        </PhoneLink>
                      </TableCell>

                      {/* Grade */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatGrade(req.grade)}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-xs font-extrabold text-primary">
                        {req.amount} {locale === "ar" ? "ج" : "EGP"}
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell className="text-xs font-medium text-foreground">
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {formatPaymentMethod(req.paymentMethod)}
                        </Badge>
                      </TableCell>

                      {/* Course */}
                      <TableCell className="text-xs font-medium text-foreground max-w-50 truncate">
                        {req.courseName}
                      </TableCell>

                      {/* Venue */}
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {formatVenue(req.venue)}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${statusBadgeVariant}`}
                        >
                          {t(`status.${req.status}` as Parameters<typeof t>[0])}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-start">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => {
                            setSelectedRequest(req);
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
    </div>
  );
}
