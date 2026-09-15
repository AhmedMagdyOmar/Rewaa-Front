"use client";

import React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProviderProfile } from "@/hooks/use-auth-queries";
import { Link } from "@/i18n/routing";
import { Plus } from "lucide-react";

export function DashboardBanner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("dashboard");

  // Read from Zustand store first (already hydrated at login, no extra network call)
  const storeUser = useAuthStore((s) => s.user);

  // Background refresh from the live API
  const { data: profileData } = useProviderProfile();
  const apiUser = profileData as Record<string, unknown> | undefined;

  // Prefer live API name, fall back to persisted store name
  const resolvedFullName =
    (apiUser?.full_name as string | undefined) ??
    storeUser?.full_name ??
    (isAr ? (apiUser?.firstNameAr as string | undefined) : undefined) ??
    storeUser?.email?.split("@")[0] ??
    "Admin";

  return (
    <div className="relative h-64 w-full rounded-2xl border bg-card p-6 md:p-8 flex flex-col justify-center overflow-hidden shadow-sm">
      {/* Background Image on the end side with smooth gradient overlay */}
      <div className="absolute inset-y-0 right-0 left-auto rtl:left-0 rtl:right-auto w-full md:w-1/2 pointer-events-none overflow-hidden">
        <Image
          src="/dashboard-bg.jpg"
          alt="Dashboard Header"
          fill
          priority
          className="object-cover object-center opacity-25 mask-radial-fade ltr:mask-[linear-gradient(to_right,transparent,black_70%)] rtl:mask-[linear-gradient(to_left,transparent,black_70%)]"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {t("welcomeTitle", { userName: resolvedFullName })}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {t("welcomeSubtitle")}
        </p>
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button asChild size="default" className="font-bold gap-2">
            <Link href="/dashboard/courses/new">
              <Plus className="h-4 w-4" />
              <span>{t("addNewCourse")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="default" className="font-bold">
            <Link href="/dashboard/settings">
              <span>{t("manageSettings")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
