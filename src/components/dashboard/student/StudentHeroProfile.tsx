"use client";

import { useStudentProfile } from "@/hooks/use-auth-queries";
import { useAuthStore } from "@/lib/stores/auth-store";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface StudentHeroProfileProps {
  studentName?: string;
}

export function StudentHeroProfile({ studentName: initialStudentName }: StudentHeroProfileProps) {
  const t = useTranslations("studentDashboard.hero");

  const storeUser = useAuthStore((s) => s.user);
  const { data: profileData } = useStudentProfile();
  const apiUser = profileData as Record<string, unknown> | undefined;

  const resolvedFullName =
    (apiUser?.full_name as string | undefined) ?? storeUser?.full_name ?? storeUser?.email ?? "";

  const studentName: string = initialStudentName || resolvedFullName || t("defaultStudentName");
  const avatarUrl: string | undefined =
    (apiUser?.avatar_url as string | undefined) ?? storeUser?.avatarUrl ?? undefined;

  // Split name for initials fallback
  const nameParts = studentName.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
      : studentName.slice(0, 2);

  return (
    <section className="relative w-full overflow-hidden rounded-xl bg-primary text-primary-foreground p-4 sm:p-5 lg:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left / Start: Profile Picture + Welcome Info */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Student Profile Picture / Placeholder */}
          <div className="relative shrink-0 size-12 sm:size-14 rounded-full border-2 border-white/20 bg-white/10 shadow-inner flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={studentName}
                fill
                sizes="56px"
                className="object-cover"
                unoptimized
              />
            ) : initials ? (
              <span className="text-base sm:text-lg font-bold uppercase text-white tracking-wide">
                {initials}
              </span>
            ) : (
              <User className="size-6 sm:size-7 text-white/80" />
            )}
          </div>

          {/* Texts: Welcome & Description */}
          <div className="space-y-0.5 text-right rtl:text-right ltr:text-left">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              {t("welcome", { name: studentName })}
            </h1>
            <p className="text-xs sm:text-sm text-primary-foreground/90 font-normal leading-normal max-w-xl">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
