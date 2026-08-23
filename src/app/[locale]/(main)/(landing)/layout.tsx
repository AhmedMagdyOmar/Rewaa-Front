import { Navbar } from "@/components/landing/layout/navbar";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

/**
 * Layout component for the landing route group.
 * Uses i18n translations (ar.json / en.json) for branding, routes, and actions.
 */
export default async function LandingLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav.landing" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const navRoutes = [] as {
    href: string;
    label: string;
  }[];

  return (
    <>
      {/* Global Landing Navbar */}
      <Navbar
        brandName={tCommon("brandName")}
        routes={navRoutes}
        actionSlot={
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild size="sm" className="font-bold">
              <Link href={`/${locale}/auth/login`}>{tNav("login")}</Link>
            </Button>
          </div>
        }
      />
      {children}
    </>
  );
}
