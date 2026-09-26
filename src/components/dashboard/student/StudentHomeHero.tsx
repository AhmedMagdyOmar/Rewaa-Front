"use client";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/components/ui/phone-link";
import { useStudentProfile } from "@/hooks/use-auth-queries";
import { Link } from "@/i18n/routing";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface StudentHomeHeroProps {
  studentName?: string;
}

export function StudentHomeHero({ studentName: initialStudentName }: StudentHomeHeroProps) {
  const t = useTranslations("studentDashboard.hero");

  // Read authenticated student details from store & query cache
  const storeUser = useAuthStore((s) => s.user);
  const { data: profileData } = useStudentProfile();
  const apiUser = profileData as Record<string, unknown> | undefined;

  const whatsappPhone = "+201009876543";
  const whatsappUrl = getWhatsAppUrl(whatsappPhone);

  const resolvedFullName =
    (apiUser?.full_name as string | undefined) ?? storeUser?.full_name ?? storeUser?.email ?? "";

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
