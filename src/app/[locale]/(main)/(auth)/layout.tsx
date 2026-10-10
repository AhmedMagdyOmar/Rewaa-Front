import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthBanner } from "@/components/landing/auth/AuthBanner";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

/**
 * Layout component for the auth route group.
 * If user is already authenticated (has active session cookie), redirects to /[locale]/dashboard.
 */
export default async function AuthLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const cookieName = process.env.COOKIE_NAME || "rewaa_auth";
  const authCookie = cookieStore.get(cookieName);

  if (authCookie && authCookie.value) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      <div className="absolute top-4 end-4 z-50 flex items-center gap-2">
        <LanguageSwitcher variant="dark" />
      </div>
      <div className="flex-1 flex flex-col justify-start lg:justify-center items-center p-4 sm:p-8 sm:pt-32 min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto lg:w-1/2 overscroll-contain">
        {children}
      </div>
      <AuthBanner />
    </div>
  );
}
