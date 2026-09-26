"use client";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebsiteAnnouncements } from "@/hooks/use-website-announcements";
import { Link } from "@/i18n/routing";
import { ArrowRight, ExternalLink, Megaphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export function StudentRecentAnnouncement() {
  const t = useTranslations("studentDashboard.announcement");
  const locale = useLocale();

  const { data: announcements, isLoading } = useWebsiteAnnouncements();

  if (isLoading) {
    return (
      <DashboardCard className="p-6 sm:p-8 bg-card border border-border/80 shadow-xs">
        <div className="space-y-4 max-w-xl">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </DashboardCard>
    );
  }

  // Active published announcements from API
  const activeAnnouncements = (announcements || []).filter(
    (a) => a.is_active !== false && a.active !== false,
  );

  const recent = activeAnnouncements[0];

  if (!recent) {
    return null;
  }

  const resolveText = (val: Record<string, string> | string | undefined | null): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[locale] || val.ar || val.en || Object.values(val)[0] || "";
  };

  const title = resolveText(recent.title);
  const description = resolveText(recent.details || recent.description);
  const imageUrl = recent.image;
  const linkUrl = recent.link || recent.url;

  const hasLink = Boolean(linkUrl && linkUrl.trim().length > 0);
  const isExternal = hasLink && /^https?:\/\//i.test(linkUrl!);

  return (
    <DashboardCard className="relative overflow-hidden p-0 bg-card border border-border/80 shadow-xs">
      {/* End-aligned Image with fade effect from white/card background */}
      {imageUrl && (
        <div className="absolute inset-y-0 inset-e-0 w-full sm:w-1/2 md:w-5/12 pointer-events-none overflow-hidden select-none">
          <Image
            src={imageUrl}
            alt={title || t("imageAlt")}
            fill
            className="object-cover object-center opacity-30 ltr:mask-[linear-gradient(to_right,transparent_0%,black_70%)] rtl:mask-[linear-gradient(to_left,transparent_0%,black_70%)]"
            unoptimized
          />
          {/* Subtle gradient wash over the image */}
          <div className="absolute inset-0 bg-linear-to-e from-card via-card/70 to-transparent" />
        </div>
      )}

      {/* Content Container (Start aligned) */}
      <div className="relative z-10 p-6 sm:p-8 max-w-2xl flex flex-col items-start gap-4 text-start">
        {/* Announcement Badge */}
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1 font-semibold text-xs rounded-full"
        >
          <Megaphone className="size-3.5" />
          <span>{t("badge")}</span>
        </Badge>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* CTA Button */}
        <div className="pt-2">
          {hasLink ? (
            isExternal ? (
              <Button asChild size="default" className="gap-2 font-semibold shadow-xs">
                <a href={linkUrl!} target="_blank" rel="noopener noreferrer">
                  <span>{t("viewLink")}</span>
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : (
              <Button asChild size="default" className="gap-2 font-semibold shadow-xs">
                <Link href={linkUrl!}>
                  <span>{t("viewLink")}</span>
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
            )
          ) : (
            <Button
              asChild
              variant="default"
              size="default"
              className="gap-2 font-semibold shadow-xs"
            >
              <Link href="/contact-us">
                <span>{t("contactUs")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
