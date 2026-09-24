"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Pencil,
  Search,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviderExam, useProviderExamAttempts } from "@/hooks/use-exams";
import { BackendExamAttempt } from "@/types/api-contracts";

interface ExamSubmissionsClientProps {
  examId?: string;
}

type TabKey = "all" | "pending_review" | "graded" | "in_progress";

export function ExamSubmissionsClient({ examId }: ExamSubmissionsClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("exams.submissions");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const perPage = 15;

  const { data: examData, isLoading: isExamLoading } = useProviderExam(examId || "");

  const {
    data: attemptsData,
    isLoading: isAttemptsLoading,
    refetch,
  } = useProviderExamAttempts({
    ...(examId ? { exam_id: examId } : {}),
    ...(activeTab !== "all" ? { status: activeTab } : {}),
    page: currentPage,
    per_page: perPage,
  });

  const isLoading = isExamLoading || isAttemptsLoading;
  const pagination = attemptsData?.pagination;

  // Filter client side search by student name or email or exam title
  const filteredAttempts = React.useMemo(() => {
    const list = attemptsData?.attempts || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((attempt: BackendExamAttempt) => {
      const studentName = attempt.student?.full_name?.toLowerCase() || "";
      const studentEmail = attempt.student?.email?.toLowerCase() || "";
      const examTitle =
        (isAr
          ? attempt.exam.title.ar || attempt.exam.title.en
          : attempt.exam.title.en || attempt.exam.title.ar
        )?.toLowerCase() || "";
      return studentName.includes(q) || studentEmail.includes(q) || examTitle.includes(q);
    });
  }, [attemptsData?.attempts, searchQuery, isAr]);

  const examTitle = examData
    ? isAr
      ? examData.title.ar || examData.title.en
      : examData.title.en || examData.title.ar
    : "";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={examId ? `/${locale}/dashboard/exams/${examId}` : `/${locale}/dashboard/exams`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className={`size-3.5 ${isAr ? "rotate-180" : ""}`} />
              <span>{examId ? t("backToStats") : t("backToExams")}</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <GraduationCap className="size-7 text-primary" />
            <span>
              {examId && examTitle ? t("examSubmissionsTitle", { title: examTitle }) : t("title")}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer font-semibold shadow-2xs"
          >
            {tCommon("refresh") || "Refresh"}
          </Button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              isAr
                ? "ابحث باسم الطالب أو البريد أو الامتحان..."
                : "Search by student name, email or exam..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="ps-9 bg-background"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-muted rounded-lg border border-border/40 text-xs font-medium overflow-x-auto">
          {(
            [
              { key: "all", label: t("tabs.all") },
              { key: "pending_review", label: t("tabs.pendingReview") },
              { key: "graded", label: t("tabs.graded") },
              { key: "in_progress", label: t("tabs.inProgress") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-3 text-start whitespace-nowrap">{t("columns.student")}</th>
                {!examId && (
                  <th className="px-4 py-3 text-start whitespace-nowrap">{t("columns.exam")}</th>
                )}
                <th className="px-4 py-3 text-start whitespace-nowrap">{t("columns.attempt")}</th>
                <th className="px-4 py-3 text-start whitespace-nowrap">{t("columns.status")}</th>
                <th className="px-4 py-3 text-start whitespace-nowrap">{t("columns.score")}</th>
                <th className="px-4 py-3 text-start whitespace-nowrap">
                  {t("columns.submittedAt")}
                </th>
                <th className="px-4 py-3 text-end whitespace-nowrap">{t("columns.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    {!examId && (
                      <td className="px-4 py-3">
                        <Skeleton className="h-3.5 w-28" />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Skeleton className="h-3.5 w-12" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-3.5 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-3.5 w-24" />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Skeleton className="h-8 w-20 ms-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={examId ? 6 : 7}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <UserCheck className="size-10 text-muted-foreground/40 mb-2.5" />
                      <h3 className="text-base font-semibold text-foreground">{t("emptyTitle")}</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {t("emptyDescription")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt: BackendExamAttempt, idx: number) => {
                  const isNeedsReview = attempt.status === "pending_review";
                  const isGraded = attempt.status === "graded";
                  const studentName = attempt.student?.full_name || (isAr ? "طالب" : "Student");
                  const examAttemptTitle = isAr
                    ? attempt.exam.title.ar || attempt.exam.title.en
                    : attempt.exam.title.en || attempt.exam.title.ar;

                  return (
                    <tr
                      key={attempt.id}
                      className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${
                        idx % 2 === 0 ? "" : "bg-muted/20"
                      }`}
                    >
                      {/* Student */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="relative size-8 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0">
                            {attempt.student?.avatar ? (
                              <Image
                                src={attempt.student.avatar}
                                alt={studentName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                {studentName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{studentName}</p>
                            {attempt.student?.email && (
                              <p className="text-[11px] text-muted-foreground">
                                {attempt.student.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Exam (if global view) */}
                      {!examId && (
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-foreground">
                          {examAttemptTitle}
                        </td>
                      )}

                      {/* Attempt Number */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-semibold">
                          #{attempt.attempt_number}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isNeedsReview && (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-bold"
                          >
                            <Sparkles className="size-3 me-1 text-amber-600 animate-pulse" />
                            {t("status.pendingReview")}
                          </Badge>
                        )}
                        {isGraded && (
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${
                              attempt.is_passed
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            }`}
                          >
                            {attempt.is_passed ? (
                              <CheckCircle2 className="size-3 me-1 text-emerald-600" />
                            ) : (
                              <XCircle className="size-3 me-1 text-rose-600" />
                            )}
                            {t("status.graded")}
                          </Badge>
                        )}
                        {attempt.status === "in_progress" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-medium"
                          >
                            <Clock className="size-3 me-1 text-blue-600" />
                            {t("status.inProgress")}
                          </Badge>
                        )}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {attempt.score !== null && attempt.score !== undefined ? (
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>
                              {attempt.score} / {attempt.max_score}
                            </span>
                            {attempt.percentage !== null && attempt.percentage !== undefined && (
                              <span className="text-[11px] font-normal text-muted-foreground">
                                ({attempt.percentage}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            -- / {attempt.max_score}
                          </span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {attempt.submitted_at
                          ? new Date(attempt.submitted_at).toLocaleString(locale, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--"}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap text-end">
                        <Link
                          href={`/${locale}/dashboard/exams/${attempt.exam_id}/submissions/${attempt.id}/grade`}
                        >
                          <Button
                            size="sm"
                            variant={isNeedsReview ? "default" : "outline"}
                            className={`cursor-pointer font-bold text-xs h-8 ${
                              isNeedsReview
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                                : ""
                            }`}
                          >
                            {isNeedsReview ? (
                              <>
                                <Pencil className="size-3.5 me-1.5" />
                                {t("actions.grade")}
                              </>
                            ) : (
                              <>
                                <Eye className="size-3.5 me-1.5" />
                                {t("actions.review")}
                              </>
                            )}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="p-4 border-t border-border/40">
            <ContentPagination
              currentPage={pagination.current_page}
              totalPages={pagination.last_page}
              totalItems={pagination.total}
              startIndex={(pagination.current_page - 1) * perPage}
              itemsPerPage={perPage}
              showingText={
                isAr
                  ? `عرض ${(pagination.current_page - 1) * perPage + 1} إلى ${Math.min(
                      pagination.current_page * perPage,
                      pagination.total,
                    )} من إجمالي ${pagination.total} تسليم`
                  : `Showing ${(pagination.current_page - 1) * perPage + 1} to ${Math.min(
                      pagination.current_page * perPage,
                      pagination.total,
                    )} of ${pagination.total} submissions`
              }
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
