"use client";

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
import { ArrowUpDown, GraduationCap, Layers, Search, Tag, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

export interface SortOptionItem {
  value: string;
  label: string;
}

export interface FilterOptionItem {
  id: string | number;
  name: string;
}

interface StudentCourseFiltersProps {
  searchQuery: string;
  sortBy: string;
  sortOptions?: SortOptionItem[];
  defaultSort?: string;
  selectedGradeId?: string | number | null;
  selectedSubjectId?: string | number | null;
  selectedCategory?: string | null;
  grades?: FilterOptionItem[];
  subjects?: FilterOptionItem[];
  categories?: FilterOptionItem[];
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onGradeChange?: (gradeId: string | null) => void;
  onSubjectChange?: (subjectId: string | null) => void;
  onCategoryChange?: (category: string | null) => void;
  onResetFilters?: () => void;
}

export function StudentCourseFilters({
  searchQuery,
  sortBy,
  sortOptions = [],
  defaultSort,
  selectedGradeId,
  selectedSubjectId,
  selectedCategory,
  grades = [],
  subjects = [],
  categories = [],
  onSearchChange,
  onSortChange,
  onGradeChange,
  onSubjectChange,
  onCategoryChange,
  onResetFilters,
}: StudentCourseFiltersProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.exploreCoursesPage");

  const effectiveDefaultSort = defaultSort || sortOptions[0]?.value || "latest";
  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  const isFilterActive =
    searchQuery.trim() !== "" ||
    (Boolean(sortBy) && sortBy !== effectiveDefaultSort) ||
    Boolean(selectedGradeId && selectedGradeId !== "all") ||
    Boolean(selectedSubjectId && selectedSubjectId !== "all") ||
    Boolean(selectedCategory && selectedCategory !== "all");

  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = React.useState(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [localSearch, searchQuery, onSearchChange]);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 shadow-xs space-y-4">
      {/* ────────────────────────────────────────────────────────────────────────
          Top Row: Landing-style Search Input Box
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <Search className="absolute start-4 size-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full h-12 ps-12 pe-10 rounded-xl bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/70 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground text-sm sm:text-base font-medium transition-all outline-none"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              onSearchChange("");
            }}
            className="absolute end-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={t("clearFilters")}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Bottom Row: Dropdown Filters & Sort & Reset
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Grade / Stage Filter */}
          {onGradeChange && grades.length > 0 && (
            <div className="w-fit">
              <Select
                value={selectedGradeId ? String(selectedGradeId) : "all"}
                onValueChange={(val) => onGradeChange(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-9.5 text-xs sm:text-sm bg-background border-border/80 rounded-xl px-3 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder={t("filters.allGrades")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allGrades")}</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={String(grade.id)}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject Filter */}
          {onSubjectChange && subjects.length > 0 && (
            <div className="w-fit">
              <Select
                value={selectedSubjectId ? String(selectedSubjectId) : "all"}
                onValueChange={(val) => onSubjectChange(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-9.5 text-xs sm:text-sm bg-background border-border/80 rounded-xl px-3 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="size-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder={t("filters.allSubjects")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allSubjects")}</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Classification / Category Filter */}
          {onCategoryChange && (
            <div className="w-fit">
              <Select
                value={selectedCategory ? String(selectedCategory) : "all"}
                onValueChange={(val) => onCategoryChange(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-9.5 text-xs sm:text-sm bg-background border-border/80 rounded-xl px-3 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <Tag className="size-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder={t("filters.allClassifications")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allClassifications")}</SelectItem>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="workshops_training">
                        {t("filters.workshopsClassification")}
                      </SelectItem>
                      <SelectItem value="revisions">
                        {t("filters.revisionClassification")}
                      </SelectItem>
                      <SelectItem value="important_topics">
                        {t("filters.importantTopicsClassification")}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sort Menu */}
          {sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9.5 text-xs sm:text-sm rounded-xl border-border/80 font-medium px-3"
                >
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <span>{currentSortObj?.label || sortBy}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"} className="w-52">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onSortChange(opt.value)}
                    className={sortBy === opt.value ? "font-semibold bg-accent/60" : ""}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Clear Filters Button */}
        {isFilterActive && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs sm:text-sm h-9.5 px-3 rounded-xl gap-1.5 transition-colors"
          >
            <X className="size-3.5" />
            <span>{t("clearFilters")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
