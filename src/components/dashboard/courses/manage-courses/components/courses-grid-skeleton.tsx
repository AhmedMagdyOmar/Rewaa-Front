import { Skeleton } from "@/components/ui/skeleton";

interface CoursesGridSkeletonProps {
  count?: number;
}

export function CoursesGridSkeleton({ count = 6 }: CoursesGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden p-4 space-y-3"
        >
          <Skeleton className="h-44 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="pt-4 flex items-center justify-between border-t border-border/40">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
