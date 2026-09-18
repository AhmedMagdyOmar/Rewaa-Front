"use client";

import { useTranslations } from "next-intl";
import { DashboardCard } from "../overview/dashboard-card";
import { Course } from "@/types/course";

interface CourseSidebarProps {
  course: Course;
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const t = useTranslations("courses");
  const tNew = useTranslations("courses.new");

  const formatGrade = (gradeKey: string) => {
    return tNew.has(`grades.${gradeKey}` as Parameters<typeof tNew.has>[0])
      ? tNew(`grades.${gradeKey}` as Parameters<typeof tNew>[0])
      : gradeKey;
  };

  const formatSubject = (subjectKey: string) => {
    return tNew.has(`subjects.${subjectKey}` as Parameters<typeof tNew.has>[0])
      ? tNew(`subjects.${subjectKey}` as Parameters<typeof tNew>[0])
      : subjectKey;
  };

  return (
    <DashboardCard className="p-6 space-y-4">
      <h2 className="text-base font-bold text-foreground border-b border-border/60 pb-3">
        {t("details.overview")}
      </h2>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.teacher")}</span>
          <span className="font-semibold text-foreground">{course.teacherName}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.grade")}</span>
          <span className="font-semibold text-foreground">{formatGrade(course.grade)}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.subject")}</span>
          <span className="font-semibold text-foreground">{formatSubject(course.subject)}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.period")}</span>
          <span className="font-semibold text-foreground">
            {["monthly", "yearly", "term"].includes(course.period)
              ? t(`period.${course.period}`)
              : course.period}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.venue")}</span>
          <span className="font-semibold text-foreground">
            {course.venue === "online"
              ? t("venue.online")
              : course.venue === "onsite"
                ? t("venue.onsite")
                : t("venue.hybrid")}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.timeLimit")}</span>
          <span className="font-semibold text-foreground">
            {course.hasTimeLimit && course.timeLimitValue
              ? t("details.timeLimitDays", { days: course.timeLimitValue })
              : t("details.noTimeLimit")}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">{t("details.sectionsSplit")}</span>
          <span className="font-semibold text-foreground">
            {course.isSplitToSections
              ? t("details.sectionsSplitYes")
              : t("details.sectionsSplitNo")}
          </span>
        </div>

        {course.hasOffer && (
          <>
            {course.offerPercentage && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("details.offerLabel")}</span>
                <span className="font-bold text-emerald-600">{course.offerPercentage}</span>
              </div>
            )}
            {course.offerStartDate && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("details.offerStartDate")}</span>
                <span className="font-semibold text-foreground">{course.offerStartDate}</span>
              </div>
            )}
            {course.offerEndDate && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{t("details.offerEndDate")}</span>
                <span className="font-semibold text-foreground">{course.offerEndDate}</span>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardCard>
  );
}
