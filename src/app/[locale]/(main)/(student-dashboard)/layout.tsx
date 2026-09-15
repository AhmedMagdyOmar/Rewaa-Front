import { AppSidebar } from "@/components/dashboard/layout/AppSidebar";
import { DashboardNavbar } from "@/components/dashboard/layout/DashboardNavbar";
import { CourseSearchInput } from "@/components/dashboard/layout/CourseSearchInput";
import { PageContainer } from "@/components/layout/PageContainer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { studentNavConfig, studentNavbarLinks } from "@/config/nav-config";
import { UserProfile } from "@/types/auth";
import { serverApi } from "@/lib/apiServerClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function StudentDashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const cookieStore = await cookies();

  // Read the Sanctum token stored by authTokens.setToken("student")
  const token =
    cookieStore.get("rewaa_student_token")?.value ??
    cookieStore.get("rewaa_auth_token")?.value ??
    cookieStore.get("rewaa_auth")?.value;

  if (!token) {
    redirect(`/${locale}/auth/login`);
  }

  const sidebarState = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true;

  let profileData: UserProfile | null = null;
  try {
    const res = await serverApi<
      UserProfile | { student?: UserProfile; user?: UserProfile; data?: UserProfile }
    >({ url: "/api/website/profile", method: "GET" }, "student");
    profileData =
      (res as { student?: UserProfile })?.student ??
      (res as { user?: UserProfile })?.user ??
      (res as { data?: UserProfile })?.data ??
      (res as UserProfile);
  } catch {
    profileData = null;
  }

  if (!profileData) {
    redirect(`/${locale}/auth/login`);
  }

  // Guard student dashboard — if this is a provider token, send them to /dashboard
  const role = profileData?.role;
  if (role && role !== "student") {
    redirect(`/${locale}/dashboard`);
  }

  const initialProfileData = profileData;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar initialProfileData={initialProfileData} variant="student" />
      <div className="flex w-full flex-col flex-1">
        <DashboardNavbar
          initialProfileData={initialProfileData}
          links={studentNavbarLinks}
          primaryHref={studentNavConfig.primaryLink.href}
          centerContent={<CourseSearchInput />}
          variant="student"
        />
        <main className="flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </SidebarProvider>
  );
}
