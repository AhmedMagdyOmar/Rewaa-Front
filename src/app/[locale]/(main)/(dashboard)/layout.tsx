import { AppSidebar } from "@/components/dashboard/layout/AppSidebar";
import { DashboardNavbar } from "@/components/dashboard/layout/DashboardNavbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfile } from "@/types/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { serverApi } from "@/lib/apiServerClient";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const cookieStore = await cookies();

  // Read the Sanctum token stored by authTokens.setToken("provider")
  const token =
    cookieStore.get("rewaa_provider_token")?.value ??
    cookieStore.get("rewaa_auth_token")?.value ??
    cookieStore.get("rewaa_auth")?.value;

  if (!token) {
    redirect(`/${locale}/auth/login`);
  }

  const sidebarState = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true;

  let profileData: UserProfile | null = null;
  try {
    const res = await serverApi<UserProfile | { user?: UserProfile; data?: UserProfile }>(
      { url: "/api/dashboard/provider/profile", method: "GET" },
      "provider",
    );
    profileData =
      (res as { user?: UserProfile })?.user ??
      (res as { data?: UserProfile })?.data ??
      (res as UserProfile);
  } catch {
    profileData = null;
  }

  if (!profileData) {
    redirect(`/${locale}/auth/login`);
  }

  // Guard admin dashboard against student access
  const role = profileData?.role;
  if (role === "student") {
    redirect(`/${locale}/student-dashboard`);
  }

  const initialProfileData = profileData;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar initialProfileData={initialProfileData} />
      <div className="flex w-full flex-col flex-1">
        <DashboardNavbar initialProfileData={initialProfileData} />
        <main className="flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </SidebarProvider>
  );
}
