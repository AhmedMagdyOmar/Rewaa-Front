"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentFilters, SortOptionItem, TabItem } from "../common/content-filters";

export type FilterTab = "all" | "published" | "draft";
export type CourseVenueFilter = "all" | "center" | "online";
export type SortOption =
  | "date-newest"
  | "date-oldest"
  | "sales-desc"
  | "sales-asc"
  | "price-asc"
  | "price-desc";

interface CourseFiltersProps {
  searchQuery: string;
  activeTab: FilterTab;
  venueFilter: CourseVenueFilter;
  sortBy: SortOption;
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTabChange: (tab: FilterTab) => void;
  onVenueChange: (venue: string) => void;
  onSortChange: (sort: SortOption) => void;
  onResetFilters?: () => void;
}

export function CourseFilters({
  searchQuery,
  activeTab,
  venueFilter,
  sortBy,
  totalCount,
  publishedCount,
  draftCount,
  onSearchChange,
  onTabChange,
  onVenueChange,
  onSortChange,
  onResetFilters,
}: CourseFiltersProps) {
  const t = useTranslations("courses");

  const tabs: TabItem<FilterTab>[] = [
    { value: "all", label: t("tabs.all"), count: totalCount },
    { value: "published", label: t("tabs.published"), count: publishedCount },
    { value: "draft", label: t("tabs.draft"), count: draftCount },
  ];

  const sortOptions: SortOptionItem<SortOption>[] = [
    { value: "date-newest", label: t("sort.newest") },
    { value: "date-oldest", label: t("sort.oldest") },
    { value: "sales-desc", label: t("sort.salesDesc") },
    { value: "sales-asc", label: t("sort.salesAsc") },
    { value: "price-asc", label: t("sort.priceAsc") },
    { value: "price-desc", label: t("sort.priceDesc") },
  ];

  return (
    <ContentFilters<FilterTab, SortOption>
      searchQuery={searchQuery}
      searchPlaceholder={t("searchPlaceholder")}
      activeTab={activeTab}
      tabs={tabs}
      sortBy={sortBy}
      sortOptions={sortOptions}
      clearFiltersLabel={t("clearFilters")}
      isFilterActiveCustom={venueFilter !== "all"}
      extraFilters={
        <div className="w-full sm:w-44 self-start sm:self-auto">
          <Select value={venueFilter} onValueChange={onVenueChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder={t("filters.venue.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.venue.all")}</SelectItem>
              <SelectItem value="center">{t("filters.venue.center")}</SelectItem>
              <SelectItem value="online">{t("filters.venue.online")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      onSearchChange={onSearchChange}
      onTabChange={onTabChange}
      onSortChange={onSortChange}
      onResetFilters={onResetFilters}
    />
  );
}
