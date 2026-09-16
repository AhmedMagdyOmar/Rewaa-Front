import { CourseVenueFilter, FilterTab, SortOption } from "../course-filters";

export interface CourseUrlFiltersState {
  searchQuery: string;
  activeTab: FilterTab;
  venueFilter: CourseVenueFilter;
  stageFilter: string;
  subjectFilter: string;
  instructorFilter: string;
  sortBy: SortOption;
  currentPage: number;
}

export interface FilterOptionItem {
  id: number | string;
  name: string;
}
