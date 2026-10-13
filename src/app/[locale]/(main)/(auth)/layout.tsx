import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthBanner } from "@/components/landing/auth/AuthBanner";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";
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
  const t = await getTranslations("nav.landing");
  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || `/${locale}`;
  const cookieStore = await cookies();
  const cookieName = process.env.COOKIE_NAME || "rewaa_auth";
  const authCookie = cookieStore.get(cookieName);

  if (authCookie && authCookie.value) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="relative min-h-screen lg:h-screen bg-[#2659aa] text-white overflow-hidden flex flex-col lg:flex-row">
      {/* Background Decorative Mesh & Ambient Lighting (matching landing footer) */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 right-1/4 w-96 h-96 bg-primary-light/15 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute top-4 end-4 z-50 flex items-center gap-2">
        <a
          href={landingUrl}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
        >
          <Home className="h-4 w-4" />
          <span>{t("home")}</span>
        </a>
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="flex-1 relative z-10 flex flex-col justify-start lg:justify-center items-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-8 min-h-screen lg:min-h-full lg:h-full lg:overflow-y-auto lg:w-1/2 overscroll-contain">
        {children}
      </div>
      <AuthBanner />
    </div>
  );
}
