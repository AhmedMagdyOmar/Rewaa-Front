"use client";

import React from "react";
import {
  DashboardBanner,
  TotalStudentsCard,
  EducationalContentCard,
  ClassesDistributionCard,
  ExamActivityCard,
  LastBillingRequestsCard,
  GovernoratesBreakdown,
} from "@/components/dashboard/overview";
import { useDashboardStatistics } from "@/hooks/use-dashboard";

const DashboardPage = () => {
  const { data: stats, isLoading } = useDashboardStatistics();

  const totalStudentsCount = stats?.students?.total ?? 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ROW 1: Banner */}
      <DashboardBanner />

      {/* ROW 2: Total Students & Educational Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TotalStudentsCard students={stats?.students} isLoading={isLoading} />
        <EducationalContentCard educationalContent={stats?.content} isLoading={isLoading} />
      </div>

      {/* ROW 3: Classes Distribution, Exam Activity, Last Billing Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-128">
        <ClassesDistributionCard
          classesDistribution={stats?.educational_stage_distribution?.stages}
          totalStudents={totalStudentsCount}
          isLoading={isLoading}
        />
        <ExamActivityCard examActivityToday={stats?.exam_activity_today} isLoading={isLoading} />
        <LastBillingRequestsCard />
      </div>

      {/* ROW 4: Governorates Breakdown */}
      <GovernoratesBreakdown governorates={stats?.governorate_distribution} isLoading={isLoading} />
    </div>
  );
};

export default DashboardPage;
