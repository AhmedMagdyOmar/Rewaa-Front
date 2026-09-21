/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ArrowLeft,
  Edit2,
  Eye,
  GraduationCap,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ContentPagination } from "@/components/dashboard/common/content-pagination";
import { DeleteStudentDialog } from "@/components/dashboard/students/delete-student-dialog";
import { GradeSelect } from "@/components/ui/academic-selects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneLink, WhatsAppIcon } from "@/components/ui/phone-link";

import { getStoredCourses } from "@/lib/courses-storage";
import {
  deleteStoredStudent,
  getCourseEnrolledStudents,
  resetStoredStudents,
} from "@/lib/students-storage";
import { Course } from "@/types/course";
import { RegistrationType, Student } from "@/types/student";

export type StudentSortOption = "newest" | "oldest" | "name-asc" | "name-desc";

const REGISTRATION_TYPE_BADGES: Record<RegistrationType, string> = {
  center: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  online: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  hybrid: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  external: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

interface CourseStudentsClientProps {
  courseId: string;
}

export function CourseStudentsClient({ courseId }: CourseStudentsClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const t = useTranslations("courses.studentsPage");
  const tGlobalStudents = useTranslations("studentsPage");
  const tGrades = useTranslations("courses.new.grades");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL query state
  const searchQuery = searchParams.get("search") || "";
  const selectedGender = searchParams.get("gender") || "all";
  const selectedGrade = searchParams.get("grade") || "all";
  const selectedRegType = searchParams.get("regType") || "all";
  const selectedLocation = searchParams.get("location") || "all";
  const sortBy = (searchParams.get("sort") as StudentSortOption) || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const itemsPerPage = 10;

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "gender" && value === "all") ||
          (key === "grade" && value === "all") ||
          (key === "regType" && value === "all") ||
          (key === "location" && value === "all") ||
          (key === "sort" && value === "newest") ||
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

  const [course, setCourse] = React.useState<Course | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Deletion State
  const [deletingStudent, setDeletingStudent] = React.useState<Student | null>(null);

  React.useEffect(() => {
    const allCourses = getStoredCourses(locale);
    const foundCourse = allCourses.find((c) => c.id === courseId) || null;
    setCourse(foundCourse);

    const loadedStudents = getCourseEnrolledStudents(locale, courseId);
    setStudents(loadedStudents);
    setIsLoading(false);

    const handleUpdate = () => {
      const freshCourses = getStoredCourses(locale);
      setCourse(freshCourses.find((c) => c.id === courseId) || null);
      setStudents(getCourseEnrolledStudents(locale, courseId));
    };

    window.addEventListener("rewaa_students_updated", handleUpdate);
    window.addEventListener("rewaa_courses_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("rewaa_students_updated", handleUpdate);
      window.removeEventListener("rewaa_courses_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [locale, courseId]);

  // Available locations (state / country) from enrolled students
  const availableLocations = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.state) set.add(s.state);
    });
    return Array.from(set);
  }, [students]);

  // Format grade helper
  const formatGrade = React.useCallback(
    (key?: string) => {
      if (!key) return "";
      return tGrades.has(key as Parameters<typeof tGrades.has>[0])
        ? tGrades(key as Parameters<typeof tGrades>[0])
        : key;
    },
    [tGrades],
  );

  // Filter and sort students
  const filteredAndSortedStudents = React.useMemo(() => {
    return students
      .filter((student) => {
        // Search query (fullName, phone, parentPhone, email, ID)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fullName = [
            student.firstName,
            student.middleName,
            student.lastName,
            student.additionalName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesName = fullName.includes(q);
          const matchesPhone = student.phoneNumber?.toLowerCase().includes(q);
          const matchesParentPhone = student.parentPhoneNumber?.toLowerCase().includes(q);
          const matchesEmail = student.email?.toLowerCase().includes(q);
          const matchesId = student.id?.toLowerCase().includes(q);

          if (!matchesName && !matchesPhone && !matchesParentPhone && !matchesEmail && !matchesId) {
            return false;
          }
        }

        // Gender filter
        if (selectedGender !== "all" && student.gender !== selectedGender) {
          return false;
        }

        // Grade filter
        if (selectedGrade !== "all" && student.grade !== selectedGrade) {
          return false;
        }

        // Registration Type filter
        if (selectedRegType !== "all" && student.registrationType !== selectedRegType) {
          return false;
        }

        // Location / State filter
        if (selectedLocation !== "all" && student.state !== selectedLocation) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "name-asc") {
          return (a.firstName || "").localeCompare(b.firstName || "");
        }
        if (sortBy === "name-desc") {
          return (b.firstName || "").localeCompare(a.firstName || "");
        }
        // Default: newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [
    students,
    searchQuery,
    selectedGender,
    selectedGrade,
    selectedRegType,
    selectedLocation,
    sortBy,
  ]);

  // Pagination bounds
  const totalItems = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = React.useMemo(() => {
    return filteredAndSortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedStudents, startIndex, itemsPerPage]);

  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedGender !== "all" ||
    selectedGrade !== "all" ||
    selectedRegType !== "all" ||
    selectedLocation !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    updateUrlParams({
      search: null,
      gender: null,
      grade: null,
      regType: null,
      location: null,
      sort: null,
      page: 1,
    });
  };

  const handleResetData = () => {
    resetStoredStudents(locale);
  };

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      deleteStoredStudent(locale, deletingStudent.id);
      setDeletingStudent(null);
    }
  };

  const showingNumber =
    Math.min(startIndex + itemsPerPage, totalItems) - Math.min(startIndex + 1, totalItems) + 1;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* ──────────────────────────────────────────────────────────────────────────────
          1. HEADER SECTION (WITH STANDARD ROUND BACK BUTTON)
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard/courses`}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {course ? `${course.title} - ${t("title")}` : t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleResetData}
            title={tGlobalStudents("refreshData")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            <span className="hidden md:inline">{tGlobalStudents("refreshData")}</span>
          </Button>

          <Button asChild className="gap-2 shadow-xs font-semibold">
            <Link href={`/${locale}/dashboard/students/new?courseId=${courseId}`}>
              <Plus className="size-4" />
              <span>{t("addStudent")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. FILTERS & SEARCH TOOLBAR
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={t("filters.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
              className="ps-9 h-10 w-full"
            />
          </div>

          {/* Grade Select */}
          <GradeSelect
            className="w-full lg:w-48"
            triggerClassName="h-10 w-full"
            value={selectedGrade}
            onValueChange={(val) => updateUrlParams({ grade: val, page: 1 })}
            placeholder={t("filters.allGrades")}
            showAllOption
            allOptionLabel={t("filters.allGrades")}
          />

          {/* Governorate / Location Select */}
          <Select
            value={selectedLocation}
            onValueChange={(val) => updateUrlParams({ location: val, page: 1 })}
          >
            <SelectTrigger className="h-10 w-full lg:w-44">
              <SelectValue placeholder={t("filters.allLocations")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allLocations")}</SelectItem>
              {availableLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Registration Type Select */}
          <Select
            value={selectedRegType}
            onValueChange={(val) => updateUrlParams({ regType: val, page: 1 })}
          >
            <SelectTrigger className="h-10 w-full lg:w-44">
              <SelectValue placeholder={t("filters.allRegTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allRegTypes")}</SelectItem>
              <SelectItem value="center">{tGlobalStudents("registrationTypes.center")}</SelectItem>
              <SelectItem value="online">{tGlobalStudents("registrationTypes.online")}</SelectItem>
              <SelectItem value="hybrid">{tGlobalStudents("registrationTypes.hybrid")}</SelectItem>
              <SelectItem value="external">
                {tGlobalStudents("registrationTypes.external")}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select value={sortBy} onValueChange={(val) => updateUrlParams({ sort: val, page: 1 })}>
            <SelectTrigger className="h-10 w-full lg:w-44">
              <SelectValue placeholder={t("filters.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("filters.newest")}</SelectItem>
              <SelectItem value="oldest">{t("filters.oldest")}</SelectItem>
              <SelectItem value="name-asc">{t("filters.nameAsc")}</SelectItem>
              <SelectItem value="name-desc">{t("filters.nameDesc")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="gap-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>{t("resetFilters")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          4. STUDENTS TABLE & PAGINATION
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-xl shadow-2xs overflow-hidden flex flex-col">
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
            <h3 className="text-base font-semibold text-foreground">{t("empty.title")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t("empty.description")}</p>
            <div className="flex items-center gap-3 mt-2">
              {isFilterActive && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  {t("resetFilters")}
                </Button>
              )}
              <Button asChild size="sm">
                <Link href={`/${locale}/dashboard/students/new?courseId=${courseId}`}>
                  <Plus className="size-4 me-1" />
                  <span>{t("addStudent")}</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground text-xs font-semibold">
                  <th className="px-4 py-3.5 text-start font-bold">{t("columns.fullName")}</th>
                  <th className="px-4 py-3.5 text-start font-bold">{t("columns.phoneNumbers")}</th>
                  <th className="px-4 py-3.5 text-start font-bold">{t("columns.location")}</th>
                  <th className="px-4 py-3.5 text-start font-bold">{t("columns.grade")}</th>
                  <th className="px-4 py-3.5 text-center font-bold">
                    {t("columns.registrationType")}
                  </th>
                  <th className="px-4 py-3.5 text-end font-bold">{t("columns.actions")}</th>
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
                  const regTypeLabel = tGlobalStudents(
                    `registrationTypes.${regTypeKey}` as Parameters<typeof tGlobalStudents>[0],
                  );

                  return (
                    <tr key={student.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Full Name & Student ID / Email */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <Link
                            href={`/${locale}/dashboard/students/${student.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{fullName}</span>
                          </Link>
                          <div className="flex flex-col items-start gap-0 mt-0.5">
                            <span className="text-xs text-muted-foreground font-mono">
                              ID: {student.id}
                            </span>
                            {student.email && (
                              <span className="text-xs text-muted-foreground truncate max-w-45">
                                {student.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone Number & Parent Phone */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <PhoneLink
                            phone={student.phoneNumber}
                            className="text-xs text-foreground flex items-center gap-1 hover:text-emerald-600"
                          >
                            <WhatsAppIcon className="size-3 shrink-0" />
                            <span dir="ltr">{student.phoneNumber}</span>
                          </PhoneLink>
                          {student.parentPhoneNumber && (
                            <PhoneLink
                              phone={student.parentPhoneNumber}
                              className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 hover:text-emerald-600"
                            >
                              <WhatsAppIcon className="size-3 shrink-0" />
                              <span dir="ltr">{student.parentPhoneNumber}</span>
                            </PhoneLink>
                          )}
                        </div>
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

                      {/* Grade */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{formatGrade(student.grade)}</span>
                        </div>
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
                          <DropdownMenuContent align={isAr ? "start" : "end"} className="w-44">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/students/${student.id}`}
                                className="cursor-pointer gap-2"
                              >
                                <Eye className="size-4" />
                                <span>{t("actions.viewDetails")}</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/students/${student.id}/edit`}
                                className="cursor-pointer gap-2"
                              >
                                <Edit2 className="size-4" />
                                <span>{t("actions.edit")}</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setDeletingStudent(student)}
                              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4" />
                              <span>{t("actions.delete")}</span>
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
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              showingText={`${locale === "ar" ? "عرض" : "Showing"} ${showingNumber} ${locale === "ar" ? "من إجمالي" : "of"} ${totalItems}`}
              onPageChange={(page) => updateUrlParams({ page })}
            />
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          5. DELETE CONFIRMATION DIALOG
      ────────────────────────────────────────────────────────────────────────────── */}
      <DeleteStudentDialog
        isOpen={!!deletingStudent}
        studentName={
          deletingStudent
            ? [
                deletingStudent.firstName,
                deletingStudent.middleName,
                deletingStudent.lastName,
                deletingStudent.additionalName,
              ]
                .filter(Boolean)
                .join(" ")
            : ""
        }
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
