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

import { CourseFiltersSkeleton } from "./manage-courses/components/course-filters-skeleton";

export type FilterTab = "all" | "published" | "draft" | "scheduled";
export type SortOption =
  | "date-newest"
  | "date-oldest"
  | "sales-desc"
  | "sales-asc"
  | "price-asc"
  | "price-desc";

export interface FilterOptionItem {
  id: number | string;
  name: string;
}

interface CourseFiltersProps {
  isLoading?: boolean;
  searchQuery: string;
  activeTab: FilterTab;
  categoryFilter?: string;
  categories?: FilterOptionItem[];
  stageFilter?: string;
  stages?: FilterOptionItem[];
  sortBy: SortOption;
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTabChange: (tab: FilterTab) => void;
  onCategoryChange?: (categoryId: string) => void;
  onStageChange?: (stageId: string) => void;
  onSortChange: (sort: SortOption) => void;
  onResetFilters?: () => void;
}

export function CourseFilters({
  isLoading = false,
  searchQuery,
  activeTab,
  categoryFilter = "all",
  categories = [],
  stageFilter = "all",
  stages = [],
  sortBy,
  totalCount,
  publishedCount,
  draftCount,
  scheduledCount,
  onSearchChange,
  onTabChange,
  onCategoryChange,
  onStageChange,
  onSortChange,
  onResetFilters,
}: CourseFiltersProps) {
  const t = useTranslations("courses");

  const tabs: TabItem<FilterTab>[] = [
    { value: "all", label: t("tabs.all"), count: totalCount },
    { value: "published", label: t("tabs.published"), count: publishedCount },
    { value: "draft", label: t("tabs.draft"), count: draftCount },
    {
      value: "scheduled",
      label: t.has("tabs.scheduled") ? t("tabs.scheduled") : "المجدولة",
      count: scheduledCount,
    },
  ];

  const sortOptions: SortOptionItem<SortOption>[] = [
    { value: "date-newest", label: t("sort.newest") },
    { value: "date-oldest", label: t("sort.oldest") },
    { value: "sales-desc", label: t("sort.salesDesc") },
    { value: "sales-asc", label: t("sort.salesAsc") },
    { value: "price-asc", label: t("sort.priceAsc") },
    { value: "price-desc", label: t("sort.priceDesc") },
  ];

  const hasExtraFilters = stageFilter !== "all" || categoryFilter !== "all";

  if (isLoading) {
    return <CourseFiltersSkeleton />;
  }

  return (
    <ContentFilters<FilterTab, SortOption>
      searchQuery={searchQuery}
      searchPlaceholder={t("searchPlaceholder")}
      activeTab={activeTab}
      tabs={tabs}
      sortBy={sortBy}
      sortOptions={sortOptions}
      clearFiltersLabel={t("clearFilters")}
      isFilterActiveCustom={hasExtraFilters}
      extraFilters={
        <div className="flex flex-wrap items-center gap-2">
          {/* Category / Classification filter */}
          {categories.length > 0 && onCategoryChange && (
            <div className="w-36 sm:w-40">
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue
                    placeholder={t.has("filters.category") ? t("filters.category") : "تصنيف الدورة"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.has("filters.allCategories") ? t("filters.allCategories") : "جميع التصنيفات"}
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stage filter */}
          {stages.length > 0 && onStageChange && (
            <div className="w-36">
              <Select value={stageFilter} onValueChange={onStageChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue
                    placeholder={t.has("filters.stage") ? t("filters.stage") : "المرحلة"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.has("filters.allStages") ? t("filters.allStages") : "جميع المراحل"}
                  </SelectItem>
                  {stages.map((st) => (
                    <SelectItem key={st.id} value={String(st.id)}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      }
      onSearchChange={onSearchChange}
      onTabChange={onTabChange}
      onSortChange={onSortChange}
      onResetFilters={onResetFilters}
    />
  );
}
