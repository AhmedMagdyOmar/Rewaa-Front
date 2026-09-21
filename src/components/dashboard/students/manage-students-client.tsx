"use client";

import {
  ArrowUpDown,
  BookOpen,
  Edit2,
  Eye,
  FileText,
  FilterX,
  GraduationCap,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
  Trash2,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { GradeSelect } from "@/components/ui/academic-selects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PhoneLink, WhatsAppIcon } from "@/components/ui/phone-link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { adaptBackendStudentToUI } from "@/lib/adapters/student-adapter";
import {
  useAdjustStudentWallet,
  useDeleteStudent,
  useStudentOptions,
  useStudentsList,
  useUpdateStudentStatus,
} from "@/hooks/use-students";
import { RegistrationType, Student, TransactionType } from "@/types/student";
import { toast } from "sonner";
import { ContentPagination } from "../common/content-pagination";
import { BalanceTransactionDialog } from "./balance-transaction-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";
import { StudentReportModal } from "./student-report-modal";

export type StudentSortOption =
  | "date-newest"
  | "date-oldest"
  | "name-asc"
  | "name-desc"
  | "grade-asc"
  | "rating-high"
  | "rating-low"
  | "registration-type";

const REGISTRATION_TYPE_BADGES: Record<RegistrationType, string> = {
  center: "bg-emerald-500/10 text-emerald-600  border-emerald-500/20",
  online: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  hybrid: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  external: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export function ManageStudentsClient() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("studentsPage");
  const tGrades = useTranslations("courses.new.grades");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL query state
  const searchQuery = searchParams.get("search") || "";
  const selectedGrade = searchParams.get("grade") || "all";
  const selectedRegType = searchParams.get("regType") || "all";
  const selectedCountry = searchParams.get("country") || "all";
  const selectedState = searchParams.get("state") || "all";
  const sortBy = (searchParams.get("sort") as StudentSortOption) || "date-newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 10;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "grade" && value === "all") ||
          (key === "regType" && value === "all") ||
          (key === "country" && value === "all") ||
          (key === "state" && value === "all") ||
          (key === "sort" && value === "date-newest") ||
          (key === "page" && value === 1)
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, pathname, router],
  );

  // Queries and Mutations
  const { data: optionsData, refetch: refetchOptions } = useStudentOptions();

  const educationalStagesList = React.useMemo(() => {
    if (!optionsData?.educational_stages) return undefined;
    return optionsData.educational_stages.map((s) => ({
      id: String(s.id),
      name: s.name[locale] || s.name.ar || s.name.en || "",
    }));
  }, [optionsData, locale]);

  const selectedStageId = React.useMemo(() => {
    if (selectedGrade === "all") return undefined;
    const matched = optionsData?.educational_stages?.find(
      (s) =>
        String(s.id) === selectedGrade ||
        (s.name[locale] || s.name.ar || s.name.en) === selectedGrade,
    );
    return matched ? matched.id : Number(selectedGrade) || undefined;
  }, [selectedGrade, optionsData, locale]);

  const {
    data: studentsData,
    isLoading,
    isRefetching,
    refetch: refetchStudents,
  } = useStudentsList({
    search: searchQuery || undefined,
    country_id: selectedCountry !== "all" ? selectedCountry : undefined,
    governorate_id: selectedState !== "all" ? selectedState : undefined,
    educational_stage_id: selectedStageId,
    registration_type: selectedRegType !== "all" ? selectedRegType : undefined,
    per_page: itemsPerPage,
    page: currentPage,
  });

  const updateStatusMutation = useUpdateStudentStatus();
  const deleteStudentMutation = useDeleteStudent();
  const adjustWalletMutation = useAdjustStudentWallet();

  const students: Student[] = React.useMemo(() => {
    if (!studentsData?.students) return [];
    return studentsData.students.map((s) => adaptBackendStudentToUI(s, locale));
  }, [studentsData, locale]);

  // Dialog & Modal States
  const [deletingStudent, setDeletingStudent] = React.useState<Student | null>(null);
  const [balanceStudent, setBalanceStudent] = React.useState<Student | null>(null);
  const [reportStudent, setReportStudent] = React.useState<Student | null>(null);

  const availableCountries: string[] = React.useMemo(() => {
    if (optionsData?.countries) {
      return optionsData.countries.map((c) => c.name[locale] || c.name.ar || c.name.en || "");
    }
    const set = new Set<string>();
    students.forEach((s) => s.country && set.add(s.country));
    return Array.from(set);
  }, [optionsData, students, locale]);

  const availableStates: string[] = React.useMemo(() => {
    if (optionsData?.governorates) {
      return optionsData.governorates.map((g) => g.name[locale] || g.name.ar || g.name.en || "");
    }
    const set = new Set<string>();
    students.forEach((s) => {
      if (selectedCountry === "all" || s.country === selectedCountry) {
        if (s.state) set.add(s.state);
      }
    });
    return Array.from(set);
  }, [optionsData, students, selectedCountry, locale]);

  // Safe Grade Formatter
  const formatGrade = React.useCallback(
    (key?: string) => {
      if (!key) return "";
      return tGrades.has(key as Parameters<typeof tGrades.has>[0])
        ? tGrades(key as Parameters<typeof tGrades>[0])
        : key;
    },
    [tGrades],
  );

  // Filter Logic
  const filteredStudents = React.useMemo(() => {
    return students.filter((student) => {
      if (selectedGrade !== "all" && student.grade !== selectedGrade) {
        return false;
      }

      if (selectedRegType !== "all" && student.registrationType !== selectedRegType) {
        return false;
      }

      if (selectedCountry !== "all" && student.country !== selectedCountry) {
        return false;
      }

      if (selectedState !== "all" && student.state !== selectedState) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = [
          student.firstName,
          student.middleName,
          student.lastName,
          student.additionalName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesName = fullName.includes(query);
        const matchesEmail = student.email.toLowerCase().includes(query);
        const matchesPhone = student.phoneNumber.toLowerCase().includes(query);
        const matchesParentPhone = (student.parentPhoneNumber || "").toLowerCase().includes(query);
        const matchesId = student.id.toLowerCase().includes(query);
        const matchesCountry = (student.country || "").toLowerCase().includes(query);
        const matchesState = (student.state || "").toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesParentPhone &&
          !matchesId &&
          !matchesCountry &&
          !matchesState
        ) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedGrade, selectedRegType, selectedCountry, selectedState, searchQuery]);

  // Sort Logic
  const sortedStudents = React.useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      switch (sortBy) {
        case "date-newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "date-oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name-asc": {
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          return nameA.localeCompare(nameB, locale);
        }
        case "name-desc": {
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          return nameB.localeCompare(nameA, locale);
        }
        case "grade-asc":
          return (a.grade || "").localeCompare(b.grade || "", locale);
        case "rating-high": {
          const ratingA = a.averageRating ?? (a.gpa ? parseFloat(a.gpa) : 3.85);
          const ratingB = b.averageRating ?? (b.gpa ? parseFloat(b.gpa) : 3.85);
          return ratingB - ratingA;
        }
        case "rating-low": {
          const ratingA = a.averageRating ?? (a.gpa ? parseFloat(a.gpa) : 3.85);
          const ratingB = b.averageRating ?? (b.gpa ? parseFloat(b.gpa) : 3.85);
          return ratingA - ratingB;
        }
        case "registration-type":
          return a.registrationType.localeCompare(b.registrationType);
        default:
          return 0;
      }
    });
  }, [filteredStudents, sortBy, locale]);

  // Pagination Logic
  const totalItems = studentsData?.pagination?.total ?? sortedStudents.length;
  const totalPages =
    studentsData?.pagination?.last_page ?? (Math.ceil(totalItems / itemsPerPage) || 1);
  const paginatedStudents = sortedStudents;

  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedGrade !== "all" ||
    selectedRegType !== "all" ||
    selectedCountry !== "all" ||
    selectedState !== "all" ||
    sortBy !== "date-newest";

  const handleResetFilters = () => {
    updateUrlParams({
      search: null,
      grade: null,
      regType: null,
      country: null,
      state: null,
      sort: null,
      page: 1,
    });
  };

  const handleSuspendToggle = (student: Student) => {
    const newStatus = student.status === "suspended" ? "active" : "suspended";
    updateStatusMutation.mutate(
      {
        studentId: student.id,
        status: newStatus,
      },
      {
        onSuccess: () => {
          toast.success(
            newStatus === "suspended"
              ? locale === "ar"
                ? "تم تجميد حساب الطالب"
                : "Student suspended successfully"
              : locale === "ar"
                ? "تم تنشيط حساب الطالب"
                : "Student activated successfully",
          );
        },
        onError: (err: unknown) => {
          const message =
            (err as { apiMessage?: string })?.apiMessage ||
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as { message?: string })?.message ||
            (locale === "ar"
              ? "حدث خطأ أثناء تعديل حالة الطالب"
              : "Failed to update student status");
          toast.error(message);
        },
      },
    );
  };

  const handleBalanceSubmit = ({
    type,
    amount,
    notes,
  }: {
    type: TransactionType;
    amount: number;
    notes?: string;
  }) => {
    if (!balanceStudent) return;
    const direction = type === "withdraw" ? "debit" : "credit";
    const reason = type === "deposit" ? "admin_top_up" : "adjustment";
    const fundingSource = type === "deposit" ? "cash" : undefined;
    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });

    adjustWalletMutation.mutate(
      {
        studentId: balanceStudent.id,
        data: {
          direction,
          amount,
          reason,
          funding_source: fundingSource,
          notes,
          idempotency_key: idempotencyKey,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar" ? "تم تعديل رصيد الطالب بنجاح" : "Student balance updated successfully",
          );
          setBalanceStudent(null);
        },
        onError: (err: unknown) => {
          const validationErrors =
            (err as { validationErrors?: unknown })?.validationErrors ||
            (err as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors;
          if (validationErrors) {
            const firstError = Object.values(validationErrors).flat()[0] as string;
            if (firstError) {
              toast.error(firstError);
              return;
            }
          }
          const message =
            (err as { apiMessage?: string })?.apiMessage ||
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as { message?: string })?.message ||
            (locale === "ar"
              ? "حدث خطأ أثناء تعديل الرصيد"
              : "An error occurred while updating balance");
          toast.error(message);
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingStudent) return;
    deleteStudentMutation.mutate(deletingStudent.id, {
      onSuccess: () => {
        toast.success(locale === "ar" ? "تم حذف الطالب بنجاح" : "Student deleted successfully");
        setDeletingStudent(null);
      },
      onError: (err: unknown) => {
        const message =
          (err as { apiMessage?: string })?.apiMessage ||
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as { message?: string })?.message ||
          (locale === "ar" ? "حدث خطأ أثناء حذف الطالب" : "Failed to delete student");
        toast.error(message);
      },
    });
  };

  const handleRefresh = () => {
    refetchStudents();
    refetchOptions();
  };

  const sortOptions = [
    { value: "date-newest", label: t("sort.dateNewest") },
    { value: "date-oldest", label: t("sort.dateOldest") },
    { value: "name-asc", label: t("sort.nameAsc") },
    { value: "name-desc", label: t("sort.nameDesc") },
    { value: "grade-asc", label: t("sort.gradeAsc") },
    { value: "rating-high", label: t("sort.ratingHigh") },
    { value: "rating-low", label: t("sort.ratingLow") },
    { value: "registration-type", label: t("sort.registrationType") },
  ];

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || t("sort.dateNewest");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="default"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="gap-2 shadow-xs font-semibold"
          >
            <RotateCcw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span>{t("refreshData")}</span>
          </Button>

          <Button asChild size="default" className="gap-2 shadow-xs font-semibold">
            <Link href={`/${locale}/dashboard/students/new`}>
              <Plus className="h-4 w-4" />
              <span>{t("addNewStudent")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <DebouncedSearchInput
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onValueChange={(val) => updateUrlParams({ search: val, page: 1 })}
            containerClassName="min-w-60"
          />

          {/* Sort & Reset Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5"
              >
                <FilterX className="h-3.5 w-3.5 me-1.5" />
                {t("emptyState.resetFilters")}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>{currentSortLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"} className="w-52">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => updateUrlParams({ sort: opt.value, page: 1 })}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40">
          {/* Grade Filter */}
          <GradeSelect
            value={selectedGrade}
            onValueChange={(val) => updateUrlParams({ grade: val, page: 1 })}
            placeholder={t("allGrades")}
            showAllOption
            allOptionLabel={t("allGrades")}
            grades={educationalStagesList}
            triggerClassName="bg-background h-9 text-xs w-full"
            className="w-full"
          />

          {/* Registration Type Filter */}
          <Select
            value={selectedRegType}
            onValueChange={(val) => updateUrlParams({ regType: val, page: 1 })}
          >
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder={t("allRegistrationTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRegistrationTypes")}</SelectItem>
              <SelectItem value="center">{t("registrationTypes.center")}</SelectItem>
              <SelectItem value="online">{t("registrationTypes.online")}</SelectItem>
              <SelectItem value="hybrid">{t("registrationTypes.hybrid")}</SelectItem>
              <SelectItem value="external">{t("registrationTypes.external")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Country Filter */}
          <Select
            value={selectedCountry}
            onValueChange={(val) => updateUrlParams({ country: val, state: "all", page: 1 })}
          >
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder={t("allCountries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCountries")}</SelectItem>
              {availableCountries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Governorate / State Filter */}
          <Select
            value={selectedState}
            onValueChange={(val) => updateUrlParams({ state: val, page: 1 })}
          >
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder={t("allStates")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStates")}</SelectItem>
              {availableStates.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Users className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{t("emptyState.title")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t("emptyState.description")}</p>
            {isFilterActive && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2">
                {t("emptyState.resetFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground text-xs font-semibold">
                  <th className="px-4 py-3.5 text-start font-medium">
                    {t("columns.fullNameAndId")}
                  </th>
                  <th className="px-4 py-3.5 text-start font-medium">{t("columns.phoneNumber")}</th>
                  <th className="px-4 py-3.5 text-start font-medium">{t("columns.state")}</th>
                  <th className="px-4 py-3.5 text-center font-medium">
                    {t("columns.coursesCount")}
                  </th>
                  <th className="px-4 py-3.5 text-start font-medium">{t("columns.grade")}</th>
                  <th className="px-4 py-3.5 text-center font-medium">
                    {t("columns.averageRating")}
                  </th>
                  <th className="px-4 py-3.5 text-center font-medium">
                    {t("columns.registrationType")}
                  </th>
                  <th className="px-4 py-3.5 text-end font-medium">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedStudents.map((student) => {
                  const fullName = [
                    student.firstName,
                    student.middleName,
                    student.lastName,
                    student.additionalName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const regTypeKey = student.registrationType;
                  const regTypeLabel = t(
                    `registrationTypes.${regTypeKey}` as Parameters<typeof t>[0],
                  );

                  const isSuspended = student.status === "suspended";

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isSuspended ? "bg-muted/15 opacity-80 hover:opacity-100" : ""
                      }`}
                    >
                      {/* Full Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <Link
                            href={`/${locale}/dashboard/students/${student.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{fullName}</span>
                            {isSuspended && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium h-4 px-1.5"
                              >
                                {t("statuses.suspended")}
                              </Badge>
                            )}
                          </Link>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-4 py-3.5">
                        <TooltipProvider delayDuration={150}>
                          <div className="flex flex-col gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PhoneLink
                                  phone={student.phoneNumber}
                                  className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium w-fit hover:text-emerald-600 transition-colors"
                                >
                                  <span className="flex items-center justify-center size-4 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                    <WhatsAppIcon className="size-3" />
                                  </span>
                                  <span dir="ltr" className="tracking-tight">
                                    {student.phoneNumber}
                                  </span>
                                </PhoneLink>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {t("columns.studentPhoneTooltip")}
                              </TooltipContent>
                            </Tooltip>

                            {student.parentPhoneNumber && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <PhoneLink
                                    phone={student.parentPhoneNumber}
                                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground w-fit hover:text-emerald-600 transition-colors"
                                  >
                                    <span className="flex items-center justify-center size-4 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                      <WhatsAppIcon className="size-3" />
                                    </span>
                                    <span dir="ltr" className="tracking-tight">
                                      {student.parentPhoneNumber}
                                    </span>
                                  </PhoneLink>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                  {t("columns.parentPhoneTooltip")}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </td>

                      {/* Governorate / Country */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                          <span>
                            {student.state}
                            {student.country ? `, ${student.country}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Courses Count */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="secondary" className="font-semibold text-xs gap-1">
                          <BookOpen className="size-3" />
                          <span>{student.coursesCount ?? 0}</span>
                        </Badge>
                      </td>

                      {/* Grade */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{formatGrade(student.grade)}</span>
                        </div>
                      </td>

                      {/* Average CGPA / GPA Column */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-semibold text-foreground">
                          {student.gpa || `${(student.averageRating ?? 3.85).toFixed(2)} / 4.0`}
                        </span>
                      </td>

                      {/* Registration Type Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize font-medium ${
                            REGISTRATION_TYPE_BADGES[student.registrationType] || ""
                          }`}
                        >
                          {regTypeLabel}
                        </Badge>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="px-4 py-3.5 text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                              <MoreVertical className="size-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isAr ? "start" : "end"} className="w-48">
                            {/* 1. View Details */}
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/students/${student.id}`}
                                className="cursor-pointer gap-2"
                              >
                                <Eye className="size-4 text-muted-foreground" />
                                <span>{t("actions.viewDetails")}</span>
                              </Link>
                            </DropdownMenuItem>

                            {/* 2. Edit */}
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/students/${student.id}/edit`}
                                className="cursor-pointer gap-2"
                              >
                                <Edit2 className="size-4 text-muted-foreground" />
                                <span>{t("actions.editStudent")}</span>
                              </Link>
                            </DropdownMenuItem>

                            {/* 3. View Report */}
                            <DropdownMenuItem
                              onClick={() => setReportStudent(student)}
                              className="cursor-pointer gap-2"
                            >
                              <FileText className="size-4 text-primary" />
                              <span>{t("actions.viewReport")}</span>
                            </DropdownMenuItem>

                            {/* 4. Change Balance */}
                            <DropdownMenuItem
                              onClick={() => setBalanceStudent(student)}
                              className="cursor-pointer gap-2"
                            >
                              <Wallet className="size-4 text-emerald-600" />
                              <span>{t("actions.changeBalance")}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* 5. Suspend / Activate (Status) */}
                            <DropdownMenuItem
                              onClick={() => handleSuspendToggle(student)}
                              className={`cursor-pointer gap-2 ${
                                isSuspended
                                  ? "text-emerald-600 focus:text-emerald-600"
                                  : "text-amber-600 focus:text-amber-600"
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <UserCheck className="size-4" />
                                  <span>{t("actions.activate")}</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="size-4" />
                                  <span>{t("actions.suspend")}</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            {/* 6. Delete */}
                            <DropdownMenuItem
                              onClick={() => setDeletingStudent(student)}
                              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4" />
                              <span>{t("actions.deleteStudent")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-border/60">
            <ContentPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={(currentPage - 1) * itemsPerPage}
              itemsPerPage={itemsPerPage}
              showingText={t("showing", {
                start: Math.min((currentPage - 1) * itemsPerPage + 1, totalItems),
                end: Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, totalItems),
                total: totalItems,
              })}
              onPageChange={(page) => updateUrlParams({ page })}
            />
          </div>
        )}
      </div>

      {/* Balance Transaction Dialog */}
      {balanceStudent && (
        <BalanceTransactionDialog
          studentName={[balanceStudent.firstName, balanceStudent.lastName]
            .filter(Boolean)
            .join(" ")}
          studentId={balanceStudent.id}
          currentBalance={balanceStudent.balance ?? 0}
          isOpen={!!balanceStudent}
          onClose={() => setBalanceStudent(null)}
          onConfirm={handleBalanceSubmit}
        />
      )}

      {/* Student Comprehensive Report Modal */}
      {reportStudent && (
        <StudentReportModal
          student={reportStudent}
          isOpen={!!reportStudent}
          onClose={() => setReportStudent(null)}
          formatGrade={formatGrade}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingStudent && (
        <DeleteStudentDialog
          isOpen={!!deletingStudent}
          studentName={[deletingStudent.firstName, deletingStudent.lastName]
            .filter(Boolean)
            .join(" ")}
          onClose={() => setDeletingStudent(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
