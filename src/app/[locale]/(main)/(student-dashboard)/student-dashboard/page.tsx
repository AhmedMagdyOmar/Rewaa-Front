"use client";

import { StudentEnrolledCourses } from "@/components/dashboard/student/StudentEnrolledCourses";
import { StudentGeneralOverview } from "@/components/dashboard/student/StudentGeneralOverview";
import { StudentHomeHero } from "@/components/dashboard/student/StudentHomeHero";
import { StudentLatestCourses } from "@/components/dashboard/student/StudentLatestCourses";
import { StudentRecentAnnouncement } from "@/components/dashboard/student/StudentRecentAnnouncement";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function StudentDashboardPage() {
  const storeUser = useAuthStore((s) => s.user);
  const studentName = storeUser?.full_name ?? storeUser?.email ?? undefined;

  return (
    <div className="space-y-8 w-full">
      <StudentHomeHero studentName={studentName} />
      <StudentGeneralOverview />
      <StudentRecentAnnouncement />
      <StudentEnrolledCourses />
      <StudentLatestCourses />
    </div>
  );
}
