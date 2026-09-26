"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCourses } from "@/hooks/use-my-courses";
import { Link } from "@/i18n/routing";
import type { BackendMyCourse } from "@/types/api-contracts";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { StudentEnrolledCourseCard } from "./StudentEnrolledCourseCard";

interface StudentEnrolledCoursesProps {
  courses?: BackendMyCourse[];
}

export function StudentEnrolledCourses({ courses: propCourses }: StudentEnrolledCoursesProps) {
  const t = useTranslations("studentDashboard.enrolledCourses");

  // Fetch live enrolled courses from API
  const { data: apiData, isLoading: isApiLoading } = useMyCourses({
    per_page: 4,
    sort: "latest",
  });

  const apiCourses = propCourses ?? apiData?.courses;
  const hasCourses = Boolean(apiCourses && apiCourses.length > 0);

  return (
    <section className="space-y-4 w-full">
      {/* Section Header with Title and "View All" */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h2>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5 font-semibold text-sm h-8 px-3 rounded-lg group"
        >
          <Link href="/student-dashboard/courses">
            <span>{t("viewAll")}</span>
            <ArrowRight className="size-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </Button>
      </div>

      {/* Courses List */}
      {isApiLoading && !propCourses ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 p-4 sm:p-5 rounded-2xl bg-card border border-border/60"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <Skeleton className="aspect-video sm:aspect-4/3 w-full sm:w-36 md:w-44 h-auto sm:h-28 rounded-xl" />
                <div className="space-y-3 flex-1 w-full">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded-xl self-end md:self-center" />
            </div>
          ))}
        </div>
      ) : hasCourses ? (
        <div className="grid grid-cols-1 gap-4">
          {apiCourses!.map((course, idx) => (
            <StudentEnrolledCourseCard
              key={course.course_id ?? course.enrollment_id ?? course.id ?? `course-${idx}`}
              course={course}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground bg-card/50">
          {t("empty")}
        </div>
      )}
    </section>
  );
}
