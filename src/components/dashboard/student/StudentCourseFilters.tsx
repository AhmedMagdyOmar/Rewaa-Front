"use client";

import { Button } from "@/components/ui/button";
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

export interface SortOptionItem {
  value: string;
  label: string;
}

interface StudentCourseFiltersProps {
  searchQuery: string;
  sortBy: string;
  sortOptions?: SortOptionItem[];
  defaultSort?: string;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onResetFilters?: () => void;
}

export function StudentCourseFilters({
  searchQuery,
  sortBy,
  sortOptions = [],
  defaultSort,
  onSearchChange,
  onSortChange,
  onResetFilters,
}: StudentCourseFiltersProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.coursesPage");

  const effectiveDefaultSort = defaultSort || sortOptions[0]?.value || "latest";
  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];
  const isFilterActive =
    searchQuery.trim() !== "" || (Boolean(sortBy) && sortBy !== effectiveDefaultSort);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
      {/* Search Box */}
      <DebouncedSearchInput
        placeholder={t("searchPlaceholder")}
        value={searchQuery}
        onValueChange={onSearchChange}
      />

      {/* Sort & Reset Actions */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {isFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5"
          >
            <X className="h-3.5 w-3.5 me-1.5" />
            {t("clearFilters")}
          </Button>
        )}

        {sortOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 text-xs sm:text-sm">
                <ArrowUpDown className="h-3.5 w-3.5" />
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
  );
}
