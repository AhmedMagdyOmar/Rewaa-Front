"use client";

import {
  ArrowUpDown,
  Edit2,
  FileQuestion,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentPagination } from "../common/content-pagination";
import {
  useDeleteQuestion,
  useProviderQuestionOptions,
  useProviderQuestions,
} from "@/hooks/use-questions";
import type { BackendQuestion } from "@/types/api-contracts";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-300/40",
  medium: "bg-amber-100 text-amber-700 border-amber-300/40",
  hard: "bg-red-100 text-red-700 border-red-300/40",
};

const emptySubscribe = () => () => {};

export type QuestionSortOption = "latest" | "oldest";

export function ManageQuestionsClient() {
  const locale = useLocale();
  const t = useTranslations("questionsPage");
  const tExams = useTranslations("exams");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // URL state
  const searchQuery = searchParams.get("search") || "";
  const selectedGrade = searchParams.get("grade") || "all";
  const selectedSubject = searchParams.get("subject") || "all";
  const selectedType = searchParams.get("type") || "all";
  const sortBy = (searchParams.get("sort") as QuestionSortOption) || "latest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 12;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "grade" && value === "all") ||
          (key === "subject" && value === "all") ||
          (key === "type" && value === "all") ||
          (key === "sort" && value === "latest") ||
          (key === "page" && value === 1)
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // Live Query from backend
  const {
    data: questionsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useProviderQuestions({
    search: searchQuery || undefined,
    type: selectedType !== "all" ? selectedType : undefined,
    educational_stage_id: selectedGrade !== "all" ? selectedGrade : undefined,
    subject_id: selectedSubject !== "all" ? selectedSubject : undefined,
    sort: sortBy,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const { data: optionsData } = useProviderQuestionOptions(
    selectedGrade !== "all" ? selectedGrade : undefined,
  );

  const deleteQuestionMutation = useDeleteQuestion();

  const questions: BackendQuestion[] = questionsResponse?.questions || [];
  const pagination = questionsResponse?.pagination;
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const handleDelete = async (questionId: number) => {
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      toast.success(t("messages.deletedSuccessfully") || "تم حذف السؤال بنجاح");
    } catch {
      toast.error(t("messages.deleteFailed") || "فشل في حذف السؤال");
    }
  };

  const handleGradeChange = (val: string) => updateUrlParams({ grade: val, page: 1 });

  const handleSubjectChange = (val: string) => updateUrlParams({ subject: val, page: 1 });

  const handleTypeChange = (val: string) =>
    updateUrlParams({ type: val === "all" ? null : val, page: 1 });

  const handleSortChange = (sort: QuestionSortOption) => updateUrlParams({ sort, page: 1 });

  const handleResetFilters = () =>
    updateUrlParams({ search: null, grade: null, subject: null, type: null, sort: null, page: 1 });

  const formatGrade = (q: BackendQuestion) => {
    return q.educational_stage?.name?.[locale] || q.educational_stage?.name?.ar || "";
  };

  const formatSubject = (q: BackendQuestion) => {
    return q.subject?.name?.[locale] || q.subject?.name?.ar || "";
  };

  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedGrade !== "all" ||
    selectedSubject !== "all" ||
    selectedType !== "all" ||
    sortBy !== "latest";

  const sortOptions: { value: QuestionSortOption; label: string }[] = [
    { value: "latest", label: t("sort.timesUsedDesc") || "الأحدث" },
    { value: "oldest", label: t("sort.timesUsedAsc") || "الأقدم" },
  ];

  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("manageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("manageSubtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isMounted && isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isMounted && isFetching ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>

          <Button asChild size="default" className="gap-2 shadow-xs font-semibold shrink-0">
            <Link href={`/${locale}/dashboard/questions/new`}>
              <Plus className="h-4 w-4" />
              <span>{t("addNewQuestion")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar: Search Box, Grade Select, Subject Select, Type Select, Sort Dropdown & Reset button */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          {/* Search Box */}
          <DebouncedSearchInput
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onValueChange={(val) => updateUrlParams({ search: val, page: 1 })}
          />

          {/* Educational Stage Select */}
          <div className="w-full sm:w-44">
            <Select value={selectedGrade} onValueChange={handleGradeChange}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder={t("allGrades")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allGrades")}</SelectItem>
                {optionsData?.educational_stages.map((stage) => (
                  <SelectItem key={stage.id} value={String(stage.id)}>
                    {stage.name[locale] || stage.name.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Select */}
          <div className="w-full sm:w-44">
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder={t("allSubjects")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allSubjects")}</SelectItem>
                {optionsData?.subjects.map((sub) => (
                  <SelectItem key={sub.id} value={String(sub.id)}>
                    {sub.name[locale] || sub.name.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Type Select */}
          <div className="w-full sm:w-44">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                {optionsData?.types ? (
                  Object.entries(optionsData.types).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="multiple_choice">
                      {tExams("questionDialog.types.mcq")}
                    </SelectItem>
                    <SelectItem value="true_false">
                      {tExams("questionDialog.types.trueFalse")}
                    </SelectItem>
                    <SelectItem value="essay">{tExams("questionDialog.types.text")}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Controls: Clear Filters & Sort Dropdown */}
        <div className="flex items-center gap-2 self-start xl:self-auto shrink-0">
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5"
            >
              <X className="h-3.5 w-3.5 me-1.5" />
              {t("clearFilters")}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{currentSortObj?.label || sortBy}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"} className="w-48">
              {sortOptions.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Component */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                {[
                  t("table.columns.questionName"),
                  t("table.columns.subject"),
                  t("table.columns.grade"),
                  t("table.columns.category"),
                  t("table.columns.type"),
                  t("table.columns.difficulty"),
                  t("table.columns.timesUsed"),
                  t("table.columns.actions"),
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td colSpan={8} className="px-4 py-3">
                      <Skeleton className="h-6 w-full rounded-md" />
                    </td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <h3 className="text-base font-semibold text-foreground">
                        {t("empty.title")}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {t("empty.description")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q, idx) => {
                  const rowBg = idx % 2 === 0 ? "" : "bg-muted/20";
                  const qTitle = q.title[locale] || q.title.ar || "";
                  const qBody = q.body?.[locale] || q.body?.ar || "";
                  return (
                    <tr
                      key={q.id}
                      className={`border-b border-border/40 hover:bg-accent/40 transition-colors ${rowBg}`}
                    >
                      {/* Question Name & Content preview */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground truncate">{qTitle}</span>
                          {qBody && (
                            <span className="text-xs text-muted-foreground truncate">{qBody}</span>
                          )}
                          {q.instructor && (
                            <span className="text-[11px] text-primary/80 font-medium">
                              {q.instructor.full_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold"
                        >
                          {formatSubject(q)}
                        </Badge>
                      </td>

                      {/* Grade */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-foreground">
                        {formatGrade(q)}
                      </td>

                      {/* Classification */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-xs font-medium bg-muted/50 border-border/70 text-foreground"
                        >
                          {q.classification_label || q.classification}
                        </Badge>
                      </td>

                      {/* Question Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {q.type_label || q.type}
                        </Badge>
                      </td>

                      {/* Difficulty */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${DIFFICULTY_COLORS[q.difficulty] || ""}`}
                        >
                          {q.difficulty_label || q.difficulty}
                        </Badge>
                      </td>

                      {/* Times Used */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {t("table.timesUsedCount", { count: q.usage_count || 0 })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/questions/${q.id}/edit`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span>{t("actions.edit")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => handleDelete(q.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{t("actions.delete")}</span>
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

        {/* Footer pagination */}
        {!isLoading && totalItems > 0 && (
          <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
            <ContentPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              showingText={t("pagination.showing", {
                start: startIndex + 1,
                end: Math.min(startIndex + itemsPerPage, totalItems),
                total: totalItems,
              })}
              onPageChange={(page) => updateUrlParams({ page })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
