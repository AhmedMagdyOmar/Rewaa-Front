import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Compass, GraduationCap } from "lucide-react";
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
    <div className="relative w-full min-h-55 sm:min-h-65 md:min-h-72.5 overflow-hidden rounded-2xl shadow-sm border border-border/40 flex items-center">
      {/* Background Image with slight zoom transition */}
      <Image
        src={imageSrc}
        alt={alt || t("bgAlt")}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        className="object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
      />

      {/* Dark / Gradient Overlay for optimal text readability */}
      <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/10 to-black/5 rtl:bg-linear-to-l" />

      {/* Hero Content Overlay */}
      <div className="relative z-10 w-full p-5 sm:p-7 md:p-9 flex flex-col justify-center items-start text-white max-w-2xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-white mb-2 drop-shadow-xs">
          {t("heading")}
        </h2>
        <p className="text-sm sm:text-base md:text-lg font-medium text-white/90 mb-5 sm:mb-6">
          {t("subheading")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Explore Courses Button with amber CTA palette */}
          <Button
            asChild
            variant="amber"
            size="default"
            className="rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Link href="/student-dashboard/courses/explore" className="flex items-center gap-2">
              <Compass className="size-4" />
              <span>{t("discoverCourses")}</span>
            </Link>
          </Button>

          {/* Exams Button */}
          <Button
            asChild
            variant="outline"
            size="default"
            className="rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold bg-white/15 border-white/30 text-white hover:bg-white/25 hover:text-white backdrop-blur-xs transition-colors"
          >
            <Link href="/student-dashboard/exams" className="flex items-center gap-2">
              <GraduationCap className="size-4" />
              <span>{t("exams")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
