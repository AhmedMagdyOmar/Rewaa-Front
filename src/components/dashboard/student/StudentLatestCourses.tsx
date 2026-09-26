"use client";

import { StudentAvailableCourseCard } from "@/components/dashboard/student/StudentAvailableCourseCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExploreCourses } from "@/hooks/use-explore-courses";
import { Link } from "@/i18n/routing";
import type { AvailableCourse } from "@/types/api-contracts";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

interface StudentLatestCoursesProps {
  courses?: AvailableCourse[];
}

export function StudentLatestCourses({ courses: propCourses }: StudentLatestCoursesProps) {
  const locale = useLocale();
  const t = useTranslations("studentDashboard.latestCourses");
  const isRtl = locale === "ar";

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  // Fetch latest 6 available (unenrolled) courses from live API
  const { data: apiData, isLoading } = useExploreCourses({
    sort: "latest",
    per_page: 6,
  });

  const latestCourses = propCourses ?? apiData?.courses ?? [];

  // Handle scroll check
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 5) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }

    if (isRtl) {
      const positiveScrollLeft = Math.abs(scrollLeft);
      setCanScrollStart(positiveScrollLeft > 5);
      setCanScrollEnd(positiveScrollLeft < maxScroll - 5);
    } else {
      setCanScrollStart(scrollLeft > 5);
      setCanScrollEnd(scrollLeft < maxScroll - 5);
    }
  }, [isRtl]);

  const handleScroll = (direction: "start" | "end") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardWidth = 320;
    const scrollAmount = cardWidth + 16;
    let scrollDelta = direction === "start" ? -scrollAmount : scrollAmount;

    if (isRtl) {
      scrollDelta = -scrollDelta;
    }

    el.scrollBy({ left: scrollDelta, behavior: "smooth" });
  };

  if (isLoading && !propCourses) {
    return (
      <section className="space-y-4 w-full">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="flex gap-4 overflow-hidden pb-4 pt-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="w-70 sm:w-[320px] shrink-0">
              <Skeleton className="aspect-16/10 w-full rounded-2xl mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (latestCourses.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 w-full">
      {/* Header with Title, Navigation Controls, and View All */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full cursor-pointer disabled:opacity-30"
              onClick={() => handleScroll("start")}
              disabled={!canScrollStart}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full cursor-pointer disabled:opacity-30"
              onClick={() => handleScroll("end")}
              disabled={!canScrollEnd}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5 font-semibold text-sm h-8 px-3 rounded-lg group"
          >
            <Link href="/student-dashboard/courses/explore">
              <span>{t("viewAll")}</span>
              <ArrowRight className="size-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        dir={isRtl ? "rtl" : "ltr"}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none -mx-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {latestCourses.map((course) => (
          <div key={course.id} className="w-70 sm:w-[320px] shrink-0 snap-start flex flex-col">
            <StudentAvailableCourseCard
              course={course}
              enrollHref={`/student-dashboard/courses/${course.id}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
