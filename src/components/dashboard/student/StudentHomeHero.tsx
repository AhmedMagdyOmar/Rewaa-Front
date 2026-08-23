"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useAuthControllerGetProfile } from "@/hooks/use-auth";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getStoredPlatformInfo } from "@/lib/settings-storage";
import { getWhatsAppUrl } from "@/components/ui/phone-link";

interface StudentHomeHeroProps {
  studentName?: string;
}

export function StudentHomeHero({ studentName: initialStudentName }: StudentHomeHeroProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("studentDashboard.hero");

  const [whatsappUrl, setWhatsappUrl] = useState<string>(() => {
    return getWhatsAppUrl(getStoredPlatformInfo().communication.whatsappPhone);
  });

  useEffect(() => {
    const handlePlatformInfoUpdate = () => {
      const info = getStoredPlatformInfo();
      setWhatsappUrl(getWhatsAppUrl(info.communication.whatsappPhone));
    };

    handlePlatformInfoUpdate();
    window.addEventListener("rewaa_platform_info_updated", handlePlatformInfoUpdate);
    return () =>
      window.removeEventListener("rewaa_platform_info_updated", handlePlatformInfoUpdate);
  }, []);

  const { data } = useAuthControllerGetProfile({
    query: {
      staleTime: 1000 * 60 * 5,
    },
  });

  const user = data?.data;

  // Resolve student name dynamically from auth query profile or initial fallback
  const resolvedFirstName =
    isAr && (user as Record<string, unknown>)?.firstNameAr
      ? String((user as Record<string, unknown>).firstNameAr)
      : user?.firstName || "";
  const resolvedLastName =
    isAr && (user as Record<string, unknown>)?.lastNameAr
      ? String((user as Record<string, unknown>).lastNameAr)
      : user?.lastName || "";
  const resolvedFullName =
    `${resolvedFirstName} ${resolvedLastName}`.trim() ||
    (typeof (user as Record<string, unknown>)?.name === "string"
      ? ((user as Record<string, unknown>).name as string)
      : "") ||
    user?.email ||
    "";

  const studentName: string = initialStudentName || resolvedFullName || t("defaultStudentName");

  return (
    <section className="relative w-full overflow-hidden rounded-2xl bg-neutral-900 text-white min-h-80 sm:min-h-90 flex items-center shadow-lg">
      {/* Background Image */}
      <Image
        src="/student-dashboard-home-hero.jpg"
        alt={t("bgAlt")}
        fill
        priority
        className="object-cover object-center"
      />

      {/* Gradient Overlay */}
      <div
        className={cn(
          " absolute inset-0 z-10 ",
          "bg-[linear-gradient(to_right,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0)_100%)] ",
          "rtl:bg-[linear-gradient(to_left,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0)_100%)]",
        )}
      />

      {/* Content Container */}
      <div className="relative z-20 w-full px-6 py-10 sm:px-12 sm:py-14 max-w-3xl flex flex-col items-start gap-4 text-right rtl:text-right ltr:text-left">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          {t("welcome", { name: studentName })}
        </h1>

        <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal">
          {t("description")}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          {/* Default CTA Button */}
          <Button
            asChild
            variant="default"
            size="lg"
            className="px-8 py-6 text-lg font-semibold hover:bg-primary/90!"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              {t("contactUs")}
            </a>
          </Button>

          {/* Secondary CTA Button */}
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="px-8 py-6 text-lg font-semibold hover:bg-white/90!"
          >
            <Link href="/student-dashboard/courses/explore">{t("discoverCourses")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
