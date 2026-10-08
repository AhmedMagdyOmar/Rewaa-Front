"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentTeachers } from "@/hooks/use-student-teachers";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight, GraduationCap, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export function StudentTeachersSection() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("studentDashboard.teachers");

  const { data: teachers = [], isLoading } = useStudentTeachers();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

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

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();

    const handleScroll = () => checkScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [checkScroll, teachers]);

  const scroll = (direction: "prev" | "next") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Card width (approx 176px - 200px) + gap
    const scrollAmount = 240;
    const sign = direction === "next" ? 1 : -1;
    const actualSign = isRtl ? -sign : sign;

    el.scrollBy({
      left: actualSign * scrollAmount,
      behavior: "smooth",
    });
  };

  if (!isLoading && teachers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 w-full">
      {/* Header with Title and Carousel Controls */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t("title")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">{t("subtitle")}</p>
        </div>

        {/* Navigation Forward / Backward Buttons */}
        <div className="flex items-center gap-2 rtl:flex-row-reverse">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-border/80 hover:bg-accent disabled:opacity-35"
            disabled={!canScrollStart}
            onClick={() => scroll("prev")}
            aria-label={t("scrollPrev")}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-border/80 hover:bg-accent disabled:opacity-35"
            disabled={!canScrollEnd}
            onClick={() => scroll("next")}
            aria-label={t("scrollNext")}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {/* Teachers Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="w-40 sm:w-48 shrink-0 flex flex-col items-center p-5 bg-card rounded-2xl border border-border/60 shadow-2xs space-y-3"
              >
                <Skeleton className="size-20 sm:size-24 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : teachers.map((teacher) => {
              const nameParts = teacher.name.trim().split(/\s+/);
              const initials =
                nameParts.length >= 2
                  ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
                  : teacher.name.slice(0, 2);

              return (
                <Link
                  key={teacher.id}
                  href={`/student-dashboard/teachers/${teacher.id}`}
                  className={cn(
                    "w-44 sm:w-52 shrink-0 snap-start flex flex-col items-center text-center",
                    "p-5 rounded-2xl bg-card border border-border/70 shadow-2xs",
                    "transition-all duration-200 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
                    "group cursor-pointer select-none",
                  )}
                >
                  {/* Rounded Profile Picture */}
                  <div className="relative size-20 sm:size-24 rounded-full border-2 border-border/80 bg-muted overflow-hidden shrink-0 shadow-2xs group-hover:border-primary/50 transition-colors">
                    {teacher.avatar ? (
                      <Image
                        src={teacher.avatar}
                        alt={teacher.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : initials ? (
                      <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg sm:text-xl">
                        {initials}
                      </div>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted text-muted-foreground">
                        <User className="size-8" />
                      </div>
                    )}
                  </div>

                  {/* Teacher Name */}
                  <h3 className="mt-3.5 text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {teacher.name}
                  </h3>

                  {/* Teacher Subject */}
                  <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                    {teacher.subject ||
                      (teacher.subjects && teacher.subjects.length > 0
                        ? teacher.subjects.join(", ")
                        : "—")}
                  </p>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
