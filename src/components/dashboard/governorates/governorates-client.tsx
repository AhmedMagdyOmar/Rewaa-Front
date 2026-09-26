"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowUpDown,
  Building2,
  Globe2,
  GraduationCap,
  Laptop,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/charts/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useDashboardStatistics } from "@/hooks/use-dashboard";
import { useStudentOptions, useStudentsList } from "@/hooks/use-students";
import type { BackendStudent } from "@/types/api-contracts";

const ITEMS_PER_PAGE = 10;

interface ProcessedGovernorate {
  id: string | number;
  nameAr: string;
  nameEn: string;
  countryId?: number | null;
  countryNameAr: string;
  countryNameEn: string;
  flagEmoji: string;
  studentsCount: number;
  activeStudentsCount: number;
  percentage: number;
  centerStudents: number;
  onlineStudents: number;
  topGradeName: string;
}

export function GovernoratesClient() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("governoratesPage");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"studentsDesc" | "studentsAsc" | "activeDesc" | "nameAsc">(
    "studentsDesc",
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Live Backend Data
  const { data: dashboardStats, isLoading: isStatsLoading } = useDashboardStatistics();
  const { data: studentOptions, isLoading: isOptionsLoading } = useStudentOptions();
  const { data: studentsResponse, isLoading: isStudentsLoading } = useStudentsList({
    per_page: 500, // Fetch student sample for client-side aggregations and real student distribution
  });

  const countries = studentOptions?.countries ?? [];

  // Construct flag helper
  const getFlagEmoji = (countryName: string) => {
    const cn = countryName.toLowerCase();
    if (cn.includes("egypt") || cn.includes("مصر")) return "🇪🇬";
    if (cn.includes("saudi") || cn.includes("سعود")) return "🇸🇦";
    if (cn.includes("emirates") || cn.includes("uae") || cn.includes("إمارات")) return "🇦🇪";
    if (cn.includes("kuwait") || cn.includes("كويت")) return "🇰🇼";
    if (cn.includes("qatar") || cn.includes("قطر")) return "🇶🇦";
    if (cn.includes("jordan") || cn.includes("أردن")) return "🇯🇴";
    if (cn.includes("oman") || cn.includes("عمان") || cn.includes("عُمان")) return "🇴🇲";
    return "🌐";
  };

  // Process data per governorate
  const processedGovernorates: ProcessedGovernorate[] = useMemo(() => {
    const students: BackendStudent[] = studentsResponse?.students ?? [];
    const optionsGovernorates = studentOptions?.governorates ?? [];
    const currentCountries = studentOptions?.countries ?? [];
    const totalStudents = dashboardStats?.students?.total ?? students.length;
    const backendGovDistribution = dashboardStats?.governorate_distribution?.all_governorates ?? [];

    // Group students by governorate
    const govMap = new Map<
      string,
      {
        id: number | string;
        nameAr: string;
        nameEn: string;
        countryId?: number | null;
        countryNameAr: string;
        countryNameEn: string;
        studentsCount: number;
        activeStudentsCount: number;
        centerStudents: number;
        onlineStudents: number;
        stagesCountMap: Record<string, number>;
        percentage: number;
      }
    >();

    // 1. Seed with options governorates so we know metadata & all governorates in Egypt / foreign
    optionsGovernorates.forEach((gov) => {
      const country = currentCountries.find((c) => c.id === gov.country_id);
      const key = String(gov.id);
      govMap.set(key, {
        id: gov.id,
        nameAr: gov.name?.ar || gov.name?.en || "",
        nameEn: gov.name?.en || gov.name?.ar || "",
        countryId: gov.country_id,
        countryNameAr: country?.name?.ar || country?.name?.en || "مصر",
        countryNameEn: country?.name?.en || country?.name?.ar || "Egypt",
        studentsCount: 0,
        activeStudentsCount: 0,
        centerStudents: 0,
        onlineStudents: 0,
        stagesCountMap: {},
        percentage: 0,
      });
    });

    // 2. Merge authoritative backend statistics (governorate_distribution from database)
    backendGovDistribution.forEach((bg) => {
      let existing: ReturnType<typeof govMap.get> | undefined;

      if (bg.id !== null && bg.id !== undefined) {
        existing = govMap.get(String(bg.id));
      }

      // Fallback matching by name if key didn't hit
      if (!existing && (bg.name?.ar || bg.name?.en)) {
        for (const entry of govMap.values()) {
          if (
            (bg.name.ar && entry.nameAr === bg.name.ar) ||
            (bg.name.en && entry.nameEn.toLowerCase() === bg.name.en.toLowerCase())
          ) {
            existing = entry;
            break;
          }
        }
      }

      if (existing) {
        existing.studentsCount = bg.students_count;
        existing.percentage = bg.percentage;
        if (bg.name?.ar) existing.nameAr = bg.name.ar;
        if (bg.name?.en) existing.nameEn = bg.name.en;
      } else {
        const key =
          bg.id !== null && bg.id !== undefined
            ? String(bg.id)
            : `custom-${bg.name?.ar || bg.name?.en || "unknown"}`;
        govMap.set(key, {
          id: bg.id ?? key,
          nameAr: bg.name?.ar || bg.name?.en || t("unspecified"),
          nameEn: bg.name?.en || bg.name?.ar || t("unspecified"),
          countryId: 5, // Egypt default
          countryNameAr: "مصر",
          countryNameEn: "Egypt",
          studentsCount: bg.students_count,
          activeStudentsCount: 0,
          centerStudents: 0,
          onlineStudents: 0,
          stagesCountMap: {},
          percentage: bg.percentage,
        });
      }
    });

    // 3. Aggregate student-level breakdown (center vs online, active status, educational stages)
    const hasBackendCounts = backendGovDistribution.length > 0;
    students.forEach((st) => {
      const rawGovId = st.governorate_id ?? st.governorate?.id;
      let existing: ReturnType<typeof govMap.get> | undefined;

      if (rawGovId !== null && rawGovId !== undefined) {
        existing = govMap.get(String(rawGovId));
      }

      if (!existing) {
        const stGovNameAr = st.governorate?.name?.ar;
        const stGovNameEn = st.governorate?.name?.en;
        if (stGovNameAr || stGovNameEn) {
          for (const entry of govMap.values()) {
            if (
              (stGovNameAr && entry.nameAr === stGovNameAr) ||
              (stGovNameEn && entry.nameEn.toLowerCase() === stGovNameEn.toLowerCase())
            ) {
              existing = entry;
              break;
            }
          }
        }
      }

      if (!existing) {
        const govId = rawGovId ?? "unspecified";
        const govNameAr = st.governorate?.name?.ar || st.governorate?.name?.en || t("unspecified");
        const govNameEn = st.governorate?.name?.en || st.governorate?.name?.ar || t("unspecified");
        const countryNameAr = st.country?.name?.ar || st.country?.name?.en || "مصر";
        const countryNameEn = st.country?.name?.en || st.country?.name?.ar || "Egypt";

        existing = {
          id: govId,
          nameAr: govNameAr,
          nameEn: govNameEn,
          countryId: st.country_id || st.country?.id,
          countryNameAr,
          countryNameEn,
          studentsCount: 0,
          activeStudentsCount: 0,
          centerStudents: 0,
          onlineStudents: 0,
          stagesCountMap: {},
          percentage: 0,
        };
        govMap.set(String(govId), existing);
      }

      // If backend distribution wasn't available, count directly from students list
      if (!hasBackendCounts) {
        existing.studentsCount += 1;
      }

      if (st.status === "active") {
        existing.activeStudentsCount += 1;
      }
      if (st.registration_type === "center") {
        existing.centerStudents += 1;
      } else {
        existing.onlineStudents += 1;
      }

      const stageName =
        st.educational_stage?.name?.[locale] ||
        st.educational_stage?.name?.ar ||
        st.educational_stage?.name?.en;
      if (stageName) {
        existing.stagesCountMap[stageName] = (existing.stagesCountMap[stageName] || 0) + 1;
      }
    });

    // 4. Convert map to list and compute percentages / fallback estimations
    const list: ProcessedGovernorate[] = [];
    govMap.forEach((entry) => {
      // Find top stage
      let topStageName = "-";
      let topCount = 0;
      Object.entries(entry.stagesCountMap).forEach(([stName, cnt]) => {
        if (cnt > topCount) {
          topCount = cnt;
          topStageName = stName;
        }
      });

      // If we have student counts from backend stats but no individual student sample yet,
      // assume default active count or online
      if (entry.studentsCount > 0 && entry.centerStudents === 0 && entry.onlineStudents === 0) {
        entry.onlineStudents = entry.studentsCount;
        if (entry.activeStudentsCount === 0) {
          entry.activeStudentsCount = entry.studentsCount;
        }
      }

      const percentage =
        entry.percentage > 0
          ? entry.percentage
          : totalStudents > 0
            ? Number(((entry.studentsCount / totalStudents) * 100).toFixed(1))
            : 0;

      list.push({
        id: entry.id,
        nameAr: entry.nameAr,
        nameEn: entry.nameEn,
        countryId: entry.countryId,
        countryNameAr: entry.countryNameAr,
        countryNameEn: entry.countryNameEn,
        flagEmoji: getFlagEmoji(entry.countryNameEn || entry.countryNameAr),
        studentsCount: entry.studentsCount,
        activeStudentsCount: entry.activeStudentsCount,
        percentage,
        centerStudents: entry.centerStudents,
        onlineStudents: entry.onlineStudents,
        topGradeName: topStageName,
      });
    });

    return list;
  }, [
    dashboardStats,
    studentsResponse?.students,
    studentOptions?.governorates,
    studentOptions?.countries,
    locale,
    t,
  ]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const totalStudents =
      dashboardStats?.students?.total ??
      processedGovernorates.reduce((acc, curr) => acc + curr.studentsCount, 0);
    const totalActive =
      dashboardStats?.students?.active_today ??
      processedGovernorates.reduce((acc, curr) => acc + curr.activeStudentsCount, 0);

    const egyptItems = processedGovernorates.filter(
      (g) => g.countryNameEn.toLowerCase().includes("egypt") || g.countryNameAr.includes("مصر"),
    );
    const egyptStudents = egyptItems.reduce((acc, curr) => acc + curr.studentsCount, 0);

    const internationalItems = processedGovernorates.filter(
      (g) =>
        !g.countryNameEn.toLowerCase().includes("egypt") &&
        !g.countryNameAr.includes("مصر") &&
        g.studentsCount > 0,
    );
    const internationalStudents = internationalItems.reduce(
      (acc, curr) => acc + curr.studentsCount,
      0,
    );

    // Find top governorate
    const sortedByStudents = [...processedGovernorates].sort(
      (a, b) => b.studentsCount - a.studentsCount,
    );
    const topGov = sortedByStudents[0];

    const activeRate = totalStudents > 0 ? ((totalActive / totalStudents) * 100).toFixed(1) : "0.0";

    return {
      totalStudents,
      egyptStudents,
      egyptPercentage: totalStudents > 0 ? ((egyptStudents / totalStudents) * 100).toFixed(1) : "0",
      internationalStudents,
      internationalPercentage:
        totalStudents > 0 ? ((internationalStudents / totalStudents) * 100).toFixed(1) : "0",
      topGovernorateName: topGov
        ? isAr
          ? topGov.nameAr
          : topGov.nameEn
        : isAr
          ? "لا يوجد"
          : "None",
      topGovernorateCount: topGov?.studentsCount || 0,
      activeRate,
    };
  }, [dashboardStats, processedGovernorates, isAr]);

  // Filter & Sort Logic
  const filteredGovernorates = useMemo(() => {
    return processedGovernorates
      .filter((gov) => {
        // Country filter
        if (selectedCountryId !== "all") {
          if (String(gov.countryId) !== String(selectedCountryId)) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchNameAr = gov.nameAr.toLowerCase().includes(q);
          const matchNameEn = gov.nameEn.toLowerCase().includes(q);
          const matchCountryAr = gov.countryNameAr.toLowerCase().includes(q);
          const matchCountryEn = gov.countryNameEn.toLowerCase().includes(q);

          if (!matchNameAr && !matchNameEn && !matchCountryAr && !matchCountryEn) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "studentsDesc") {
          return b.studentsCount - a.studentsCount;
        }
        if (sortBy === "studentsAsc") {
          return a.studentsCount - b.studentsCount;
        }
        if (sortBy === "activeDesc") {
          const rateA = a.studentsCount > 0 ? a.activeStudentsCount / a.studentsCount : 0;
          const rateB = b.studentsCount > 0 ? b.activeStudentsCount / b.studentsCount : 0;
          return rateB - rateA;
        }
        if (sortBy === "nameAsc") {
          const nameA = isAr ? a.nameAr : a.nameEn;
          const nameB = isAr ? b.nameAr : b.nameEn;
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
  }, [processedGovernorates, selectedCountryId, searchQuery, sortBy, isAr]);

  // Pagination Slice
  const totalItems = filteredGovernorates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGovernorates = filteredGovernorates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isFilterActive =
    Boolean(searchQuery.trim()) || selectedCountryId !== "all" || sortBy !== "studentsDesc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCountryId("all");
    setSortBy("studentsDesc");
    setCurrentPage(1);
  };

  const handleCountryChange = (val: string) => {
    setSelectedCountryId(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val as "studentsDesc" | "studentsAsc" | "activeDesc" | "nameAsc");
    setCurrentPage(1);
  };

  const showingText = t("pagination.showing", {
    start: totalItems === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + ITEMS_PER_PAGE, totalItems),
    total: totalItems,
  });

  const isLoading = isStatsLoading || isStudentsLoading || isOptionsLoading;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: PAGE HEADER & STANDARDIZED BACK BUTTON
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard`} title={t("backToDashboard")}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {isFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-medium h-9"
            >
              <RotateCcw className="size-3.5 me-1.5" />
              {t("filters.reset")}
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: 4 SUMMARY STAT CARDS
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.totalStudents")}
            </span>
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalStudents.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="size-3" />
              100%
            </span>
          </div>
        </DashboardCard>

        {/* Egypt Students */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.egyptStudents")}
            </span>
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.egyptStudents.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {stats.egyptPercentage}%
            </span>
          </div>
        </DashboardCard>

        {/* International Students */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.internationalStudents")}
            </span>
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Globe2 className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                stats.internationalStudents.toLocaleString()
              )}
            </span>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {stats.internationalPercentage}%
            </span>
          </div>
        </DashboardCard>

        {/* Top Governorate */}
        <DashboardCard className="border-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("stats.topGovernorate")}
            </span>
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-black text-foreground truncate">
              {isLoading ? <Skeleton className="h-7 w-24" /> : stats.topGovernorateName}
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
              {stats.topGovernorateCount.toLocaleString()}
            </span>
          </div>
        </DashboardCard>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: FILTERS & SEARCH TOOLBAR
      ────────────────────────────────────────────────────────────────────────────── */}
      <DashboardCard className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("filters.searchPlaceholder")}
              className="ps-9 h-9 text-xs w-full"
            />
          </div>

          {/* Filters: Country Select & Sort Select */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Country Selector */}
            <Select value={selectedCountryId} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-44 shrink-0">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("filters.country.label")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  {t("filters.country.all")}
                </SelectItem>
                {countries.map((c) => {
                  const countryName = c.name?.[locale] || c.name?.ar || c.name?.en || "";
                  const emoji = getFlagEmoji(countryName);
                  return (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {emoji} {countryName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-44 shrink-0">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("filters.sort.label")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studentsDesc" className="text-xs">
                  {t("filters.sort.studentsDesc")}
                </SelectItem>
                <SelectItem value="studentsAsc" className="text-xs">
                  {t("filters.sort.studentsAsc")}
                </SelectItem>
                <SelectItem value="activeDesc" className="text-xs">
                  {t("filters.sort.activeDesc")}
                </SelectItem>
                <SelectItem value="nameAsc" className="text-xs">
                  {t("filters.sort.nameAsc")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DashboardCard>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 4: GOVERNORATES DATA TABLE
      ────────────────────────────────────────────────────────────────────────────── */}
      <DashboardCard className="p-0 overflow-hidden border-border/80 shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 *:rtl:text-start">
                <TableHead className="text-xs font-bold min-w-44">
                  {t("table.columns.region")}
                </TableHead>
                <TableHead className="text-xs font-bold min-w-32">
                  {t("table.columns.country")}
                </TableHead>
                <TableHead className="text-xs font-bold min-w-32">
                  {t("table.columns.studentsCount")}
                </TableHead>
                <TableHead className="text-xs font-bold min-w-44">
                  {t("table.columns.percentage")}
                </TableHead>
                <TableHead className="text-xs font-bold min-w-36">
                  {t("table.columns.learningMode")}
                </TableHead>
                <TableHead className="text-xs font-bold min-w-32">
                  {t("table.columns.activeStudents")}
                </TableHead>
                <TableHead className="text-xs font-bold min-w-32">
                  {t("table.columns.topGrade")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span className="text-xs">{t("loadingData")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedGovernorates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <MapPin className="size-10 text-muted-foreground/40" />
                      <p className="font-semibold text-sm">{t("table.empty.title")}</p>
                      <p className="text-xs">{t("table.empty.description")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGovernorates.map((gov) => {
                  const displayName = isAr ? gov.nameAr : gov.nameEn;
                  const displayCountry = isAr ? gov.countryNameAr : gov.countryNameEn;
                  const activePercent =
                    gov.studentsCount > 0
                      ? Math.round((gov.activeStudentsCount / gov.studentsCount) * 100)
                      : 0;

                  return (
                    <TableRow key={gov.id} className="hover:bg-muted/30 transition-colors">
                      {/* Governorate / Region */}
                      <TableCell className="text-xs font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <MapPin className="size-3.5" />
                          </span>
                          <span>{displayName}</span>
                        </div>
                      </TableCell>

                      {/* Country */}
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{gov.flagEmoji}</span>
                          <span className="truncate max-w-28">{displayCountry}</span>
                        </div>
                      </TableCell>

                      {/* Students Count */}
                      <TableCell className="text-xs font-extrabold text-foreground">
                        {gov.studentsCount.toLocaleString()}
                      </TableCell>

                      {/* Share Percentage + Progress Bar */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-1 max-w-36">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-primary">{gov.percentage}%</span>
                            <span className="text-muted-foreground text-[10px]">
                              {t("studentsCount", { count: gov.studentsCount })}
                            </span>
                          </div>
                          <ProgressBar value={Math.min(gov.percentage * 3.5, 100)} />
                        </div>
                      </TableCell>

                      {/* Learning Mode (Center vs Online) */}
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {gov.centerStudents > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-1.5 py-0"
                            >
                              <Building2 className="size-2.5" />
                              <span>
                                {t("table.centerShort")} ({gov.centerStudents})
                              </span>
                            </Badge>
                          )}
                          {gov.onlineStudents > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 px-1.5 py-0"
                            >
                              <Laptop className="size-2.5" />
                              <span>
                                {t("table.onlineShort")} ({gov.onlineStudents})
                              </span>
                            </Badge>
                          )}
                          {gov.centerStudents === 0 && gov.onlineStudents === 0 && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Active Students */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">
                            {gov.activeStudentsCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {t("table.activeRateBadge", { percentage: activePercent })}
                          </span>
                        </div>
                      </TableCell>

                      {/* Primary Grade Level */}
                      <TableCell className="text-xs">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-normal gap-1 px-2 py-0.5"
                        >
                          <GraduationCap className="size-3 text-muted-foreground" />
                          <span>{gov.topGradeName}</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-border/80">
            <ContentPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              itemsPerPage={ITEMS_PER_PAGE}
              showingText={showingText}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
