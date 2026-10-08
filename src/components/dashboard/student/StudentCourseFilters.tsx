"use client";

import { Button } from "@/components/ui/button";
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
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
import { ArrowUpDown, GraduationCap, Layers, Tag, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

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

  const hasFacetFilters = Boolean(onGradeChange || onSubjectChange || onCategoryChange);
  const isFilterActive =
    searchQuery.trim() !== "" ||
    (Boolean(sortBy) && sortBy !== effectiveDefaultSort) ||
    Boolean(selectedGradeId && selectedGradeId !== "all") ||
    Boolean(selectedSubjectId && selectedSubjectId !== "all") ||
    Boolean(selectedCategory && selectedCategory !== "all");

  return (
    <div className="space-y-3 bg-card p-4 rounded-2xl border border-border/70 shadow-2xs">
      {/* Primary Row: Search, Sort & Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="flex-1">
          <DebouncedSearchInput
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onValueChange={onSearchChange}
          />
        </div>

        {/* Sort & Reset Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5 rounded-lg"
            >
              <X className="h-3.5 w-3.5 me-1.5" />
              {t("clearFilters")}
            </Button>
          )}

          {sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 text-xs sm:text-sm rounded-lg border-border/80"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
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
      </div>

      {/* Secondary Row: Facet Select Dropdowns (Grade, Subject, Classification) */}
      {hasFacetFilters && (
        <div className="flex flex-row items-center gap-2.5 pt-2 border-t border-border/40">
          {/* Grade Filter */}
          {onGradeChange && grades.length > 0 && (
            <div className="w-fit">
              <Select
                value={selectedGradeId ? String(selectedGradeId) : "all"}
                onValueChange={(val) => onGradeChange(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm bg-background/50 border-border/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
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
                <SelectTrigger className="h-9 text-xs sm:text-sm bg-background/50 border-border/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="size-3.5 text-muted-foreground shrink-0" />
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

          {/* Classification Filter */}
          {onCategoryChange && (
            <div className="w-fit">
              <Select
                value={selectedCategory ? String(selectedCategory) : "all"}
                onValueChange={(val) => onCategoryChange(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm bg-background/50 border-border/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="size-3.5 text-muted-foreground shrink-0" />
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
                      <SelectItem value="general">{t("filters.generalClassification")}</SelectItem>
                      <SelectItem value="revision">
                        {t("filters.revisionClassification")}
                      </SelectItem>
                      <SelectItem value="secondary">
                        {t("filters.secondaryClassification")}
                      </SelectItem>
                      <SelectItem value="preparatory">
                        {t("filters.preparatoryClassification")}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
