"use client";

import React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuthControllerGetProfile } from "@/hooks/use-auth";

import { Link } from "@/i18n/routing";
import { Plus } from "lucide-react";

export function DashboardBanner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("dashboard");

  const { data } = useAuthControllerGetProfile({
    query: {
      staleTime: 1000 * 60 * 5,
    },
  });

  const user = data?.data;

  // Localized user display name
  const firstName =
    isAr && (user as Record<string, unknown>)?.firstNameAr
      ? String((user as Record<string, unknown>).firstNameAr)
      : user?.firstName || "";
  const lastName =
    isAr && (user as Record<string, unknown>)?.lastNameAr
      ? String((user as Record<string, unknown>).lastNameAr)
      : user?.lastName || "";
  const resolvedFullName =
    `${firstName} ${lastName}`.trim() ||
    (typeof (user as Record<string, unknown>)?.name === "string"
      ? ((user as Record<string, unknown>).name as string)
      : "") ||
    user?.email?.split("@")[0] ||
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
