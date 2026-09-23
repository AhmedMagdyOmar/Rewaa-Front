"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Video, HelpCircle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";
import { StatTile } from "./stat-tile";

export interface EducationalContentStatsData {
  courses_count?: number;
  courses?: number;
  lectures_count?: number;
  lectures?: number;
  lessons_count?: number;
  questions_count?: number;
  questions?: number;
  exams_count?: number;
  exams?: number;
}

interface EducationalContentCardProps {
  educationalContent?: EducationalContentStatsData;
  isLoading?: boolean;
}

export function EducationalContentCard({
  educationalContent,
  isLoading = false,
}: EducationalContentCardProps) {
  const t = useTranslations("dashboard");

  const courses = educationalContent?.courses_count ?? educationalContent?.courses ?? 0;
  const lectures =
    educationalContent?.lectures_count ??
    educationalContent?.lessons_count ??
    educationalContent?.lectures ??
    0;
  const questions = educationalContent?.questions_count ?? educationalContent?.questions ?? 0;
  const exams = educationalContent?.exams_count ?? educationalContent?.exams ?? 0;

  const items = [
    {
      label: t("coursesCount"),
      value: isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : courses.toLocaleString(),
      icon: <BookOpen className="size-5 text-primary" />,
    },
    {
      label: t("lecturesCount"),
      value: isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : lectures.toLocaleString(),
      icon: <Video className="size-5 text-primary" />,
    },
    {
      label: t("questionsCount"),
      value: isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : questions.toLocaleString(),
      icon: <HelpCircle className="size-5 text-primary" />,
    },
    {
      label: t("examsCount"),
      value: isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : exams.toLocaleString(),
      icon: <FileText className="size-5 text-primary" />,
    },
  ];

  return (
    <DashboardCard className="lg:col-span-7 min-h-64">
      <DashboardCardHeader
        icon={<BookOpen className="size-5 text-primary" />}
        title={t("totalEducationalContent")}
        action={{
          label: t("manageCourses"),
          href: "/dashboard/courses",
        }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 h-full">
        {items.map((item, idx) => (
          <StatTile key={idx} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>
    </DashboardCard>
  );
}
