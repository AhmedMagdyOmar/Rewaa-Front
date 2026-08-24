"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Video, HelpCircle, FileText } from "lucide-react";
import { dashboardMockData } from "@/lib/mockData";
import { DashboardCard } from "./dashboard-card";
import { DashboardCardHeader } from "./dashboard-card-header";
import { StatTile } from "./stat-tile";

interface EducationalContentCardProps {
  educationalContent: typeof dashboardMockData.educationalContent;
}

export function EducationalContentCard({ educationalContent }: EducationalContentCardProps) {
  const t = useTranslations("dashboard");

  const items = [
    {
      label: t("coursesCount"),
      value: educationalContent.courses,
      icon: <BookOpen className="size-5 text-primary" />,
    },
    {
      label: t("lecturesCount"),
      value: educationalContent.lectures,
      icon: <Video className="size-5 text-primary" />,
    },
    {
      label: t("questionsCount"),
      value: educationalContent.questions.toLocaleString(),
      icon: <HelpCircle className="size-5 text-primary" />,
    },
    {
      label: t("examsCount"),
      value: educationalContent.exams,
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
          <StatTile
            key={idx}
            label={item.label}
            value={item.value}
            icon={item.icon}
            subtitle={
              <span className="text-xs font-semibold text-success text-center">
                {t("addedToday", { count: 5 })}
              </span>
            }
          />
        ))}
      </div>
    </DashboardCard>
  );
}
