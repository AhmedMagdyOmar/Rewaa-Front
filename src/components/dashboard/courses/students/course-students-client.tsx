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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PhoneLink, WhatsAppIcon } from "@/components/ui/phone-link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useProviderCourse } from "@/hooks/use-courses";
import { useDeleteStudent, useStudentsList } from "@/hooks/use-students";
import { adaptBackendStudentToUI } from "@/lib/adapters/student-adapter";
import { Student } from "@/types/student";

export type StudentSortOption = "newest" | "oldest" | "name-asc" | "name-desc";

interface CourseStudentsClientProps {
  courseId: string;
}

export function CourseStudentsClient({ courseId }: CourseStudentsClientProps) {
  const locale = useLocale();

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

  // Real backend queries
  const { data: backendCourse } = useProviderCourse(courseId);
  const {
    data: studentsResponse,
    isLoading,
    refetch,
  } = useStudentsList({
    course_id: courseId,
    search: searchQuery || undefined,
    gender: selectedGender !== "all" ? (selectedGender as "male" | "female") : undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const deleteStudentMutation = useDeleteStudent();
  const [deletingStudent, setDeletingStudent] = React.useState<Student | null>(null);

  const students: Student[] = React.useMemo(() => {
    return (studentsResponse?.students || []).map((s) => adaptBackendStudentToUI(s, locale));
  }, [studentsResponse, locale]);

  const courseTitle =
    backendCourse?.title?.[locale as "ar" | "en"] ||
    backendCourse?.title?.ar ||
    backendCourse?.title?.en ||
    "";

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

  const totalItems = studentsResponse?.pagination?.total ?? students.length;
  const totalPages =
    studentsResponse?.pagination?.last_page ?? (Math.ceil(totalItems / itemsPerPage) || 1);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedGender !== "all" ||
    selectedGrade !== "all" ||
    selectedLocation !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    updateUrlParams({
      search: null,
      gender: null,
      grade: null,
      location: null,
      sort: null,
      page: 1,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deletingStudent) {
      await deleteStudentMutation.mutateAsync(deletingStudent.id);
      setDeletingStudent(null);
    }
  };

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
              {courseTitle ? `${courseTitle} - ${t("title")}` : t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">{tGlobalStudents("refresh") || "تحديث"}</span>
          </Button>

          <Button asChild size="sm" className="flex items-center gap-2">
            <Link href={`/${locale}/dashboard/students/new?courseId=${courseId}`}>
              <Plus className="size-4" />
              <span>{t("addStudent")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          2. STATS OVERVIEW CARDS
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t("stats.total")}</p>
            <h3 className="text-2xl font-bold mt-0.5">{totalItems}</h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t("stats.active")}</p>
            <h3 className="text-2xl font-bold mt-0.5">
              {students.filter((s) => s.status === "active").length}
            </h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t("stats.male")}</p>
            <h3 className="text-2xl font-bold mt-0.5">
              {students.filter((s) => s.gender === "male").length}
            </h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t("stats.female")}</p>
            <h3 className="text-2xl font-bold mt-0.5">
              {students.filter((s) => s.gender === "female").length}
            </h3>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. FILTERS AND CONTROLS
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
              placeholder={t("filters.searchPlaceholder")}
              className="ps-9"
            />
          </div>

          {/* Gender Filter */}
          <Select
            value={selectedGender}
            onValueChange={(val) => updateUrlParams({ gender: val, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("columns.gender")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allGenders")}</SelectItem>
              <SelectItem value="male">{t("filters.male")}</SelectItem>
              <SelectItem value="female">{t("filters.female")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Grade Filter */}
          <GradeSelect
            value={selectedGrade === "all" ? "" : selectedGrade}
            onValueChange={(val) => updateUrlParams({ grade: val || "all", page: 1 })}
            label=""
            placeholder={t("filters.allGrades")}
          />
        </div>

        {/* Second row: Location filter + Sorting + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Select */}
            {availableLocations.length > 0 && (
              <Select
                value={selectedLocation}
                onValueChange={(val) => updateUrlParams({ location: val, page: 1 })}
              >
                <SelectTrigger className="w-44">
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
            )}

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={(val) => updateUrlParams({ sort: val, page: 1 })}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filters.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("filters.newest")}</SelectItem>
                <SelectItem value="oldest">{t("filters.oldest")}</SelectItem>
                <SelectItem value="name-asc">{t("filters.nameAsc")}</SelectItem>
                <SelectItem value="name-desc">{t("filters.nameDesc")}</SelectItem>
              </SelectContent>
            </Select>

            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5 me-1.5" />
                {t("resetFilters")}
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {tGlobalStudents("showing", {
              start: startIndex + 1,
              end: Math.min(startIndex + itemsPerPage, totalItems),
              total: totalItems,
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          4. STUDENTS LIST / TABLE
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Users className="size-8" />
            </div>
            <h3 className="text-lg font-bold">{t("empty.title")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
              {t("empty.description")}
            </p>
            {isFilterActive ? (
              <Button variant="outline" onClick={handleResetFilters}>
                {t("resetFilters")}
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/${locale}/dashboard/students/new?courseId=${courseId}`}>
                  <Plus className="size-4 me-2" />
                  {t("addStudent")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                <tr>
                  <th className="py-3.5 px-4 text-start">{t("columns.fullName")}</th>
                  <th className="py-3.5 px-4 text-start">{t("columns.phoneNumbers")}</th>
                  <th className="py-3.5 px-4 text-start">{t("columns.grade")}</th>
                  <th className="py-3.5 px-4 text-start">{t("columns.gender")}</th>
                  <th className="py-3.5 px-4 text-end">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => {
                  const fullName = [
                    student.firstName,
                    student.middleName,
                    student.lastName,
                    student.additionalName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                            {student.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={student.image}
                                alt={fullName}
                                className="size-full object-cover"
                              />
                            ) : (
                              fullName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/${locale}/dashboard/students/${student.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                              {fullName}
                            </Link>
                            <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <PhoneLink phone={student.phoneNumber} />
                            <a
                              href={`https://wa.me/${student.phoneNumber.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="WhatsApp"
                            >
                              <WhatsAppIcon className="size-3.5" />
                            </a>
                          </div>
                          {student.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {student.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Academic Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                            <span>{formatGrade(student.grade)}</span>
                          </div>
                          {(student.state || student.country) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {[student.state, student.country].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            student.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {student.status === "active"
                            ? tGlobalStudents("statuses.active")
                            : tGlobalStudents("statuses.suspended")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/students/${student.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="size-4" />
                                <span>{t("actions.viewDetails")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/dashboard/students/${student.id}/edit`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="size-4" />
                                <span>{t("actions.edit")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingStudent(student)}
                              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
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

        {/* ──────────────────────────────────────────────────────────────────────────────
            5. PAGINATION
        ────────────────────────────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <ContentPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              showingText={tGlobalStudents("showing", {
                start: startIndex + 1,
                end: Math.min(startIndex + itemsPerPage, totalItems),
                total: totalItems,
              })}
              onPageChange={(page) => updateUrlParams({ page })}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingStudent && (
        <DeleteStudentDialog
          isOpen={Boolean(deletingStudent)}
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
