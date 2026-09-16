import { Skeleton } from "@/components/ui/skeleton";

export function CourseFiltersSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-start justify-between gap-4 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
      {/* Search & Tabs (Line 1) + Extra Select Filters (Line 2 as filters wrap) */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-start gap-3 flex-1">
        {/* Search input skeleton */}
        <div className="flex-1 min-w-55">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Tab pills skeleton */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/40">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-22 rounded-md" />
        </div>

        {/* Line 2 / Wrapped Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Venue filter */}
          <Skeleton className="h-9 w-36 rounded-md" />
          {/* Stage filter */}
          <Skeleton className="h-9 w-36 rounded-md" />
          {/* Subject filter */}
          <Skeleton className="h-9 w-36 rounded-md" />
          {/* Instructor filter */}
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Sort button skeleton */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}
