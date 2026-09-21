"use client";

import {
  Barcode,
  CheckCircle2,
  Eye,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseSelect } from "@/components/ui/academic-selects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { adaptBackendCodeGroupToUI } from "@/lib/adapters/activation-code-adapter";
import { adaptBackendCourseToCourse } from "@/components/dashboard/courses/manage-courses/manage-courses-utils";
import { useCodeGroupsList, useCreateCodeGroup } from "@/hooks/use-activation-codes";
import { useProviderCourses } from "@/hooks/use-courses";
import { CodeGroup } from "@/types/code-group";
import { Course } from "@/types/course";
import { AddCodeGroupDialog } from "./add-code-group-dialog";

function formatDate(dateStr?: string, locale: string = "ar") {
  if (!dateStr) return "-";
  const normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CodeGroupsClient() {
  const locale = useLocale();
  const t = useTranslations("codeGroupsPage");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const selectedCourseFilter = searchParams.get("courseId") || "all";
  const sortBy = searchParams.get("sort") || "latest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 8;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "courseId" && value === "all") ||
          (key === "sort" && (value === "latest" || value === "newest")) ||
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

  // Queries
  const {
    data: rawGroupsData,
    isRefetching: isGroupsRefetching,
    refetch: refetchGroups,
  } = useCodeGroupsList({
    search: searchQuery || undefined,
    course_id: selectedCourseFilter !== "all" ? selectedCourseFilter : undefined,
    sort: sortBy,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const { data: rawCoursesData } = useProviderCourses({ per_page: 100 });

  // Mutations
  const createCodeGroupMutation = useCreateCodeGroup();

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Adapted backend data
  const groups: CodeGroup[] = React.useMemo(() => {
    if (!rawGroupsData?.groups) return [];
    return rawGroupsData.groups.map((g) => adaptBackendCodeGroupToUI(g, locale));
  }, [rawGroupsData, locale]);

  const courses: Course[] = React.useMemo(() => {
    if (!rawCoursesData?.courses) return [];
    return rawCoursesData.courses.map((c) => adaptBackendCourseToCourse(c, locale));
  }, [rawCoursesData, locale]);

  // Overall platform statistics calculation
  const stats = React.useMemo(() => {
    if (rawGroupsData?.statistics) {
      return {
        total: rawGroupsData.statistics.total_codes,
        available: rawGroupsData.statistics.available_codes,
        sold: rawGroupsData.statistics.sold_codes,
        used: rawGroupsData.statistics.used_codes,
      };
    }
    return groups.reduce(
      (acc, item) => {
        acc.total += item.totalCodes;
        acc.sold += item.soldCodes;
        acc.used += item.usedCodes;
        acc.available += item.availableCodes;
        return acc;
      },
      { total: 0, sold: 0, used: 0, available: 0 },
    );
  }, [rawGroupsData, groups]);

  // Handle adding new code group
  const handleAddCodeGroup = (data: {
    courseId: string;
    courseTitle: string;
    price: number;
    totalCodes: number;
    availableCodes: number;
    codePrefix?: string;
    expiryDate: string;
  }) => {
    createCodeGroupMutation.mutate(
      {
        course_id: Number(data.courseId) || data.courseId,
        price: data.price,
        quantity: data.totalCodes,
        prefix: data.codePrefix,
        expires_at: data.expiryDate,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
        },
      },
    );
  };

  // Pagination bounds from backend
  const totalItems = rawGroupsData?.pagination?.total ?? groups.length;
  const totalPages =
    rawGroupsData?.pagination?.last_page ?? (Math.ceil(totalItems / itemsPerPage) || 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = groups;

  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedCourseFilter !== "all" ||
    (sortBy !== "latest" && sortBy !== "newest");

  const handleResetFilters = () => {
    updateUrlParams({ search: null, courseId: null, sort: null, page: 1 });
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* ──────────────────────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => refetchGroups()}
            disabled={isGroupsRefetching}
            title={t("refreshData")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className={`size-4 ${isGroupsRefetching ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">{t("refreshData")}</span>
          </Button>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="gap-2 shadow-sm font-semibold"
          >
            <Plus className="size-4" />
            <span>{t("createButton")}</span>
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          2. STAT CARDS (4 CARDS)
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Codes */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.totalCodes")}
            </span>
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Barcode className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.total}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t("stats.totalCodesDesc")}</p>
        </DashboardCard>

        {/* Sold Codes */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.soldCodes")}
            </span>
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.sold}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t("stats.soldCodesDesc")}</p>
        </DashboardCard>

        {/* Used Codes */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.usedCodes")}
            </span>
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.used}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t("stats.usedCodesDesc")}</p>
        </DashboardCard>

        {/* Available Codes */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.availableCodes")}
            </span>
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Tag className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.available}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t("stats.availableCodesDesc")}</p>
        </DashboardCard>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. FILTERS SECTION
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card border border-border/80 p-4 rounded-xl shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={t("filters.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
              className="ps-9 h-10 w-full"
            />
          </div>

          {/* Course Filter Select */}
          <CourseSelect
            className="w-full sm:w-60"
            triggerClassName="h-10 w-full"
            value={selectedCourseFilter}
            onValueChange={(val) => updateUrlParams({ courseId: val, page: 1 })}
            placeholder={t("filters.allCourses")}
            showAllOption
            allOptionLabel={t("filters.allCourses")}
            courses={courses}
          />

          {/* Sort Select */}
          <Select value={sortBy} onValueChange={(val) => updateUrlParams({ sort: val, page: 1 })}>
            <SelectTrigger className="h-10 w-full sm:w-52">
              <SelectValue placeholder={t("filters.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t("filters.newest")}</SelectItem>
              <SelectItem value="oldest">{t("filters.oldest")}</SelectItem>
              <SelectItem value="price_desc">{t("filters.priceDesc")}</SelectItem>
              <SelectItem value="price_asc">{t("filters.priceAsc")}</SelectItem>
              <SelectItem value="codes_desc">{t("filters.totalCodesDescSort")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <RotateCcw className="size-3.5" />
            {t("filters.resetFilters")}
          </Button>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          4. TABLE & PAGINATION
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 *:text-start">
                <TableHead className="font-bold">{t("table.courseName")}</TableHead>
                <TableHead className="font-bold">{t("table.codePrice")}</TableHead>
                <TableHead className="font-bold">{t("table.totalCodes")}</TableHead>
                <TableHead className="font-bold">{t("table.availableCodes")}</TableHead>
                <TableHead className="font-bold">{t("table.soldCodes")}</TableHead>
                <TableHead className="font-bold">{t("table.usedCodes")}</TableHead>
                <TableHead className="font-bold">{t("table.createdAt")}</TableHead>
                <TableHead className="font-bold text-center">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {t("table.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGroups.map((group) => (
                  <TableRow key={group.id} className="hover:bg-muted/20 transition-colors">
                    {/* Course Name */}
                    <TableCell className="font-semibold text-foreground max-w-xs truncate">
                      {group.courseTitle}
                    </TableCell>

                    {/* Code Price */}
                    <TableCell className="font-bold text-primary">
                      {group.price}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {t("addDialog.currency")}
                      </span>
                    </TableCell>

                    {/* Total Codes */}
                    <TableCell className="font-semibold">{group.totalCodes}</TableCell>

                    {/* Available */}
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                        {group.availableCodes}
                      </span>
                    </TableCell>

                    {/* Sold */}
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                        {group.soldCodes}
                      </span>
                    </TableCell>

                    {/* Used */}
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                        {group.usedCodes}
                      </span>
                    </TableCell>

                    {/* Date of Creation */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(group.createdAt, locale)}
                    </TableCell>

                    {/* Actions: View Details button linking to /dashboard/courses/[courseId]/codes/[groupId] */}
                    <TableCell className="text-center">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        title={t("table.viewDetails")}
                      >
                        <Link
                          href={`/${locale}/dashboard/courses/${group.courseId}/codes/${group.id}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border/60">
          <ContentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            showingText={`${locale === "ar" ? "عرض" : "Showing"} ${Math.min(startIndex + 1, totalItems)} - ${Math.min(startIndex + itemsPerPage, totalItems)} ${locale === "ar" ? "من إجمالي" : "of"} ${totalItems}`}
            onPageChange={(page) => updateUrlParams({ page })}
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          5. ADD CODE GROUP DIALOG
      ────────────────────────────────────────────────────────────────────────────── */}
      <AddCodeGroupDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        courses={courses}
        isLoading={createCodeGroupMutation.isPending}
        onSubmit={handleAddCodeGroup}
      />
    </div>
  );
}
