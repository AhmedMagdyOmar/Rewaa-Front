"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { ArrowUpDown, X } from "lucide-react";
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SortOptionItem<T extends string = string> {
  value: T;
  label: string;
}

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count: number;
}

export interface ContentFiltersProps<TTab extends string = string, TSort extends string = string> {
  searchQuery: string;
  searchPlaceholder: string;
  activeTab: TTab;
  tabs: TabItem<TTab>[];
  sortBy: TSort;
  sortOptions: SortOptionItem<TSort>[];
  clearFiltersLabel: string;
  defaultTab?: TTab;
  defaultSort?: TSort;
  extraFilters?: React.ReactNode;
  isFilterActiveCustom?: boolean;
  onSearchChange: ((search: string) => void) | ((e: React.ChangeEvent<HTMLInputElement>) => void);
  onTabChange: (tab: TTab) => void;
  onSortChange: (sort: TSort) => void;
  onResetFilters?: () => void;
}

export function ContentFilters<TTab extends string = string, TSort extends string = string>({
  searchQuery,
  searchPlaceholder,
  activeTab,
  tabs,
  sortBy,
  sortOptions,
  clearFiltersLabel,
  defaultTab,
  defaultSort,
  extraFilters,
  isFilterActiveCustom = false,
  onSearchChange,
  onTabChange,
  onSortChange,
  onResetFilters,
}: ContentFiltersProps<TTab, TSort>) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const effectiveDefaultTab = defaultTab ?? (tabs[0]?.value || ("all" as TTab));
  const effectiveDefaultSort = defaultSort ?? (sortOptions[0]?.value || ("latest" as TSort));

  const isFilterActive =
    searchQuery.trim() !== "" ||
    activeTab !== effectiveDefaultTab ||
    sortBy !== effectiveDefaultSort ||
    isFilterActiveCustom;

  const currentSortObj = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  const handleSearchValueChange = (val: string) => {
    if (typeof onSearchChange === "function") {
      // Check if it's expecting event or string
      try {
        (onSearchChange as (s: string) => void)(val);
      } catch {
        // Fallback for SyntheticEvent handler
        (onSearchChange as (e: unknown) => void)({ target: { value: val } });
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-start justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-start gap-3 flex-1">
        {/* Search Box */}
        <DebouncedSearchInput
          placeholder={searchPlaceholder}
          value={searchQuery}
          onValueChange={handleSearchValueChange}
        />

        {/* Tab Selector */}
        <div className="flex items-center p-1 bg-muted rounded-lg border border-border/40 text-xs font-medium self-start sm:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === tab.value
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Extra Filters (e.g. Type / Category Selects) */}
        {extraFilters}
      </div>

      {/* Controls: Sort Menu & Clear Filters */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        {isFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 px-2.5"
          >
            <X className="h-3.5 w-3.5 me-1.5" />
            {clearFiltersLabel}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{currentSortObj?.label || sortBy}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isAr ? "start" : "end"} className="w-48">
            {sortOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => onSortChange(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
