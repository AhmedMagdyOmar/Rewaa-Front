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
export type CourseVenueFilter = "all" | "online" | "onsite" | "hybrid";
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
  venueFilter: CourseVenueFilter;
  stageFilter?: string;
  subjectFilter?: string;
  instructorFilter?: string;
  stages?: FilterOptionItem[];
  subjects?: FilterOptionItem[];
  instructors?: FilterOptionItem[];
  sortBy: SortOption;
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTabChange: (tab: FilterTab) => void;
  onVenueChange: (venue: string) => void;
  onStageChange?: (stageId: string) => void;
  onSubjectChange?: (subjectId: string) => void;
  onInstructorChange?: (instructorId: string) => void;
  onSortChange: (sort: SortOption) => void;
  onResetFilters?: () => void;
}

export function CourseFilters({
  isLoading = false,
  searchQuery,
  activeTab,
  venueFilter,
  stageFilter = "all",
  subjectFilter = "all",
  instructorFilter = "all",
  stages = [],
  subjects = [],
  instructors = [],
  sortBy,
  totalCount,
  publishedCount,
  draftCount,
  scheduledCount,
  onSearchChange,
  onTabChange,
  onVenueChange,
  onStageChange,
  onSubjectChange,
  onInstructorChange,
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

  const hasExtraFilters =
    venueFilter !== "all" ||
    stageFilter !== "all" ||
    subjectFilter !== "all" ||
    instructorFilter !== "all";

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
          {/* Venue / Delivery Mode filter */}
          <div className="w-36">
            <Select value={venueFilter} onValueChange={onVenueChange}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder={t("filters.venue.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.venue.all")}</SelectItem>
                <SelectItem value="online">{t("filters.venue.online")}</SelectItem>
                <SelectItem value="onsite">{t("filters.venue.onsite")}</SelectItem>
                <SelectItem value="hybrid">{t("filters.venue.hybrid")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {/* Subject filter */}
          {subjects.length > 0 && onSubjectChange && (
            <div className="w-36">
              <Select value={subjectFilter} onValueChange={onSubjectChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue
                    placeholder={t.has("filters.subject") ? t("filters.subject") : "المادة"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.has("filters.allSubjects") ? t("filters.allSubjects") : "جميع المواد"}
                  </SelectItem>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={String(sub.id)}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Instructor filter */}
          {instructors.length > 0 && onInstructorChange && (
            <div className="w-36">
              <Select value={instructorFilter} onValueChange={onInstructorChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue
                    placeholder={t.has("filters.instructor") ? t("filters.instructor") : "المعلم"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t.has("filters.allInstructors")
                      ? t("filters.allInstructors")
                      : "جميع المعلمين"}
                  </SelectItem>
                  {instructors.map((ins) => (
                    <SelectItem key={ins.id} value={String(ins.id)}>
                      {ins.name}
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
