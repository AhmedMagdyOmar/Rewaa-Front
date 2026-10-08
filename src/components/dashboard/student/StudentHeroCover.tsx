"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

interface StudentHeroCoverProps {
  imageSrc?: string;
  alt?: string;
}

export function StudentHeroCover({
  imageSrc = "/student-dashboard-home-hero.png",
  alt,
}: StudentHeroCoverProps) {
  const t = useTranslations("studentDashboard.hero");

  return (
    <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72 overflow-hidden rounded-2xl shadow-sm border border-border/40">
      <Image
        src={imageSrc}
        alt={alt || t("bgAlt")}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        className="object-cover object-center transition-transform duration-500 hover:scale-[1.02]"
      />
    </div>
  );
}
