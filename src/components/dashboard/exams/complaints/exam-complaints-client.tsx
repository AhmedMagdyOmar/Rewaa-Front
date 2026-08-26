/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  MoreVertical,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneLink } from "@/components/ui/phone-link";
import { ContentPagination } from "../../common/content-pagination";

import {
  dismissComplaint,
  getStoredComplaints,
  resetStoredComplaints,
} from "@/lib/exam-complaints-storage";
import { getStoredExams } from "@/lib/exams-storage";
import { ExamComplaint } from "@/types/complaint";
import { Exam } from "@/types/exam";

interface ExamComplaintsClientProps {
  examId: string;
}

export type ComplaintSortOption = "newest" | "oldest" | "title-asc" | "title-desc" | "student-asc";

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ExamComplaintsClient({ examId }: ExamComplaintsClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("exams");
  const tComplaints = useTranslations("exams.complaints");
  const tDetails = useTranslations("exams.details");

  const [exam, setExam] = React.useState<Exam | null>(null);
  const [complaints, setComplaints] = React.useState<ExamComplaint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isResetting, setIsResetting] = React.useState(false);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<ComplaintSortOption>("newest");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  // Selected complaint for details dialog or delete confirmation
  const [viewComplaint, setViewComplaint] = React.useState<ExamComplaint | null>(null);
  const [complaintToDelete, setComplaintToDelete] = React.useState<ExamComplaint | null>(null);

  // Load Exam and Complaints
  const loadData = React.useCallback(() => {
    const storedExams = getStoredExams(locale);
    const foundExam = storedExams.find((e) => e.id === examId);
    if (foundExam) {
      setExam(foundExam);
    }
    const storedComplaints = getStoredComplaints(examId, locale);
    setComplaints(storedComplaints);
    setIsLoading(false);
  }, [examId, locale]);

  React.useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setComplaints(getStoredComplaints(examId, locale));
    };

    window.addEventListener("rewaa_complaints_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("rewaa_complaints_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadData, examId, locale]);

  // Reset Mock Data
  const handleResetMockData = () => {
    setIsResetting(true);
    const fresh = resetStoredComplaints(examId, locale);
    setComplaints(fresh);
    setCurrentPage(1);
    toast.success(tComplaints("actions.resetToast"));
    setTimeout(() => setIsResetting(false), 400);
  };

  // Share Action: Copies plain text to clipboard
  const handleShare = (complaint: ExamComplaint) => {
    const examTitle = exam?.title || examId;
    const shareText = [
      tComplaints("shareFormat.exam", { examTitle }),
      tComplaints("shareFormat.title", { complaintTitle: complaint.complaintTitle }),
      tComplaints("shareFormat.student", {
        studentName: complaint.studentName,
        phoneNumber: complaint.phoneNumber,
      }),
      tComplaints("shareFormat.description", {
        complaintDescription: complaint.complaintDescription,
      }),
    ].join("\n");

    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        toast.success(tComplaints("actions.copiedToast"));
      })
      .catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success(tComplaints("actions.copiedToast"));
      });
  };

  // Dismiss Action: Removes complaint
  const handleConfirmDismiss = () => {
    if (complaintToDelete) {
      const updated = dismissComplaint(examId, locale, complaintToDelete.id);
      setComplaints(updated);
      setComplaintToDelete(null);
      toast.success(tComplaints("actions.dismissedToast"));
    }
  };

  // Filtered complaints
  const filteredComplaints = React.useMemo(() => {
    return complaints.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.complaintTitle.toLowerCase().includes(q);
        const matchesStudent = item.studentName.toLowerCase().includes(q);
        const matchesPhone = item.phoneNumber.toLowerCase().includes(q);
        const matchesDesc = item.complaintDescription.toLowerCase().includes(q);
        if (!matchesTitle && !matchesStudent && !matchesPhone && !matchesDesc) return false;
      }
      return true;
    });
  }, [complaints, searchQuery]);

  // Sorted complaints
  const sortedComplaints = React.useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.dateOfComplaint).getTime() - new Date(b.dateOfComplaint).getTime();
        case "title-asc":
          return a.complaintTitle.localeCompare(b.complaintTitle, locale);
        case "title-desc":
          return b.complaintTitle.localeCompare(a.complaintTitle, locale);
        case "student-asc":
          return a.studentName.localeCompare(b.studentName, locale);
        case "newest":
        default:
          return new Date(b.dateOfComplaint).getTime() - new Date(a.dateOfComplaint).getTime();
      }
    });
  }, [filteredComplaints, sortBy, locale]);

  // Pagination
  const totalItems = sortedComplaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComplaints = sortedComplaints.slice(startIndex, startIndex + itemsPerPage);

  const isFilterActive = searchQuery.trim() !== "" || sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const sortOptions: { value: ComplaintSortOption; label: string }[] = [
    { value: "newest", label: tComplaints("sort.newest") },
    { value: "oldest", label: tComplaints("sort.oldest") },
    { value: "title-asc", label: tComplaints("sort.titleAsc") },
    { value: "title-desc", label: tComplaints("sort.titleDesc") },
    { value: "student-asc", label: tComplaints("sort.studentNameAsc") },
  ];
  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || "";

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t("empty.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/exams`}>
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {tDetails("backToExams")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. HEADER ROW with Standard Back Button & Reset Mock ────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Standard Round Back button + Title & Status */}
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard/exams`}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tComplaints("title")}
              </h1>
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-primary/10 text-primary border-primary/20"
              >
                {tComplaints("stats.totalComplaints", { count: complaints.length })}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              <span className="font-semibold text-foreground">{exam.title}</span> —{" "}
              {tComplaints("subtitle")}
            </p>
          </div>
        </div>

        {/* Right: Reset Mock Button & Quick Action Links */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMockData}
            disabled={isResetting}
            className="gap-1.5 font-semibold text-foreground/80 hover:text-primary shadow-2xs cursor-pointer"
          >
            <RotateCcw className={`size-3.5 ${isResetting ? "animate-spin text-primary" : ""}`} />
            <span>{tComplaints("resetMock")}</span>
          </Button>

          <Button asChild size="sm" variant="outline" className="gap-1.5 font-semibold shadow-2xs">
            <Link href={`/${locale}/dashboard/exams/${exam.id}`}>
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{t("actions.viewStats")}</span>
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="gap-1.5 font-semibold shadow-2xs">
            <Link href={`/${locale}/dashboard/exams/${exam.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              <span>{tDetails("editExam")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. FILTERS & SEARCH TOOLBAR ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-55">
          <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={tComplaints("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="ps-9 bg-background"
          />
        </div>

        {/* Controls: Reset filters & Sort Menu */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5 cursor-pointer"
            >
              <span>{tComplaints("clearFilters")}</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <span className="text-xs text-muted-foreground">
                  {t("sort.titleAsc").split(" ")[0]}:
                </span>
                <span className="text-xs font-semibold">{currentSortLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-48">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setCurrentPage(1);
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── 3. COMPLAINTS TABLE ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                {[
                  tComplaints("columns.complaintTitle"),
                  tComplaints("columns.studentName"),
                  tComplaints("columns.phoneNumber"),
                  tComplaints("columns.dateOfComplaint"),
                  tComplaints("columns.actions"),
                ].map((col, idx) => (
                  <th
                    key={col}
                    className={`px-4 py-3 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap ${
                      idx === 4 ? "text-end w-24" : ""
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CircleAlert className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <h3 className="text-base font-semibold text-foreground">
                        {tComplaints("empty.title")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {tComplaints("empty.description")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((complaint, idx) => {
                  const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                  return (
                    <tr
                      key={complaint.id}
                      className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                    >
                      {/* 1. Complaint Title & Description preview */}
                      <td className="px-4 py-3 min-w-64 max-w-md">
                        <div className="space-y-1">
                          <button
                            onClick={() => setViewComplaint(complaint)}
                            className="font-semibold text-foreground hover:text-primary transition-colors text-start cursor-pointer line-clamp-1 block text-xs"
                          >
                            {complaint.complaintTitle}
                          </button>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {complaint.complaintDescription}
                          </p>
                        </div>
                      </td>

                      {/* 2. Student Name with Avatar */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="relative size-8 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0 flex items-center justify-center">
                            {complaint.studentImage ? (
                              <Image
                                src={complaint.studentImage}
                                alt={complaint.studentName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <User className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-semibold text-foreground text-xs">
                            {complaint.studentName}
                          </span>
                        </div>
                      </td>

                      {/* 3. Phone Number */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        <PhoneLink
                          phone={complaint.phoneNumber}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-emerald-600"
                        >
                          <Phone className="size-3 text-muted-foreground/70 shrink-0" />
                          <span dir="ltr">{complaint.phoneNumber}</span>
                        </PhoneLink>
                      </td>

                      {/* 4. Date of Complaint */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-muted-foreground/70 shrink-0" />
                          <span>{formatDate(complaint.dateOfComplaint, locale)}</span>
                        </div>
                      </td>

                      {/* 5. Actions Dropdown Menu */}
                      <td className="px-4 py-3 whitespace-nowrap text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full data-[state=open]:bg-accent cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">{tComplaints("columns.actions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isAr ? "start" : "end"} className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleShare(complaint)}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <Share2 className="h-4 w-4 text-primary" />
                              <span>{tComplaints("actions.share")}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setViewComplaint(complaint)}
                              className="flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <CircleAlert className="h-4 w-4 text-muted-foreground" />
                              <span>{t("actions.viewDetails")}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setComplaintToDelete(complaint)}
                              className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer text-xs"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{tComplaints("actions.dismiss")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination ───────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-border/60 bg-muted/20">
          <ContentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            showingText={tComplaints("pagination.showing", {
              start: Math.min(startIndex + 1, totalItems),
              end: Math.min(startIndex + itemsPerPage, totalItems),
              total: totalItems,
            })}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* ── 4. VIEW COMPLAINT DETAILS DIALOG ────────────────────────────────── */}
      <Dialog open={!!viewComplaint} onOpenChange={(open) => !open && setViewComplaint(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CircleAlert className="size-5 text-primary shrink-0" />
              <span>{viewComplaint?.complaintTitle}</span>
            </DialogTitle>
            <DialogDescription>
              {exam.title} • {formatDate(viewComplaint?.dateOfComplaint || "", locale)}
            </DialogDescription>
          </DialogHeader>

          {viewComplaint && (
            <div className="space-y-4 py-2 text-xs">
              {/* Student Details Card */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="relative size-9 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0 flex items-center justify-center">
                  {viewComplaint.studentImage ? (
                    <Image
                      src={viewComplaint.studentImage}
                      alt={viewComplaint.studentName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-xs">
                    {viewComplaint.studentName}
                  </div>
                  <PhoneLink
                    phone={viewComplaint.phoneNumber}
                    className="text-muted-foreground font-mono text-[11px] hover:text-emerald-600"
                  >
                    {viewComplaint.phoneNumber}
                  </PhoneLink>
                </div>
              </div>

              {/* Description Content */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground text-xs">
                  {tComplaints("columns.complaintTitle")}
                </label>
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-foreground/90 leading-relaxed text-xs">
                  {viewComplaint.complaintDescription}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare(viewComplaint!)}
              className="gap-1.5 cursor-pointer text-xs"
            >
              <Share2 className="size-3.5 text-primary" />
              <span>{tComplaints("actions.share")}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewComplaint(null)}
              className="cursor-pointer"
            >
              {t("deleteDialog.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 5. CONFIRM DISMISS DIALOG ───────────────────────────────────────── */}
      <Dialog
        open={!!complaintToDelete}
        onOpenChange={(open) => !open && setComplaintToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5 shrink-0" />
              <span>{tComplaints("actions.dismiss")}</span>
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs leading-relaxed">
              {t("deleteDialog.description", {
                title: complaintToDelete?.complaintTitle || "",
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComplaintToDelete(null)}
              className="cursor-pointer"
            >
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDismiss}
              className="cursor-pointer"
            >
              {tComplaints("actions.dismiss")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
