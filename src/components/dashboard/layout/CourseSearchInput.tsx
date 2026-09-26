"use client";

import * as React from "react";
import { Search, BookOpen } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyCourses } from "@/hooks/use-my-courses";
import { useExploreCourses } from "@/hooks/use-explore-courses";

export function CourseSearchInput({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const locale = useLocale() as "ar" | "en";
  const router = useRouter();
  const tCommon = useTranslations("common");

  let modifier = "Ctrl";
  if (typeof navigator !== "undefined") {
    modifier = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl";
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch student enrolled courses from live API
  const { data: myCoursesData } = useMyCourses({ per_page: 20 });
  // Fetch available courses from live API
  const { data: exploreCoursesData } = useExploreCourses({ per_page: 20 });

  const resolveText = (val: Record<string, string> | string | undefined | null): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || "";
  };

  const enrolledCourses = myCoursesData?.courses || [];
  const exploreCourses = exploreCoursesData?.courses || [];

  const handleSelectCourse = (courseId: number | string | undefined) => {
    if (!courseId) return;
    setOpen(false);
    router.push(`/student-dashboard/courses/${courseId}`);
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-44 md:w-60 lg:w-72 justify-start rounded-full bg-muted/50 text-xs font-normal text-muted-foreground shadow-none transition-all hover:bg-accent hover:text-accent-foreground px-3",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 shrink-0" />
        <span className="truncate">{tCommon("search")}</span>
        <kbd className="pointer-events-none absolute right-[0.4rem] rtl:right-auto rtl:left-[0.4rem] top-[0.35rem] hidden h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-[10px]">{modifier}+</span>
          <span>K</span>
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={tCommon("search")} />
        <CommandList>
          <CommandEmpty>{locale === "ar" ? "لا توجد نتائج" : "No courses found."}</CommandEmpty>

          {enrolledCourses.length > 0 && (
            <CommandGroup heading={locale === "ar" ? "دوراتي المشترك بها" : "My Enrolled Courses"}>
              {enrolledCourses.map((c) => {
                const id = c.course_id ?? c.id;
                const title = resolveText(c.title);
                const teacherName = c.instructor?.full_name || "";
                return (
                  <CommandItem
                    key={`enrolled-${id}`}
                    value={`${title} ${teacherName}`}
                    onSelect={() => handleSelectCourse(id)}
                    className="cursor-pointer flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-sm truncate">{title}</span>
                        {teacherName && (
                          <span className="text-xs text-muted-foreground truncate">
                            {teacherName}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {exploreCourses.length > 0 && (
            <CommandGroup heading={locale === "ar" ? "الدورات المتاحة" : "Available Courses"}>
              {exploreCourses.map((course) => {
                const title = resolveText(course.title);
                const teacherName = course.instructor?.full_name || "";
                return (
                  <CommandItem
                    key={`available-${course.id}`}
                    value={`${title} ${teacherName}`}
                    onSelect={() => handleSelectCourse(course.id)}
                    className="cursor-pointer flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <BookOpen className="h-4 w-4 text-primary/70 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-sm truncate">{title}</span>
                        {teacherName && (
                          <span className="text-xs text-muted-foreground truncate">
                            {teacherName}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
