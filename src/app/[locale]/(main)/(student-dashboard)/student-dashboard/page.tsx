"use client";

import { StudentEnrolledCourses } from "@/components/dashboard/student/StudentEnrolledCourses";
import { StudentHeroCover } from "@/components/dashboard/student/StudentHeroCover";
import { StudentHeroProfile } from "@/components/dashboard/student/StudentHeroProfile";
import { StudentLatestCourses } from "@/components/dashboard/student/StudentLatestCourses";
import { StudentTeachersSection } from "@/components/dashboard/student/StudentTeachersSection";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function StudentDashboardPage() {
  const storeUser = useAuthStore((s) => s.user);
  const studentName = storeUser?.full_name ?? storeUser?.email ?? undefined;

  return (
    <div className="space-y-8 w-full">
      {/* 1. Student Hero Profile (bg-primary with avatar & welcome info) */}
      <StudentHeroProfile studentName={studentName} />

      {/* 2. Student Hero Cover Image (without overlay text) */}
      <StudentHeroCover />

      {/* 3. Teachers Carousel Section */}
      <StudentTeachersSection />

      {/* 4. Enrolled Courses */}
      <StudentEnrolledCourses />

      {/* 5. Explore / Latest Courses */}
      <StudentLatestCourses />
    </div>
  );
}
