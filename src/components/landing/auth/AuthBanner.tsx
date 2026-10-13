"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function AuthBanner() {
  const t = useTranslations("auth.banner");

  return (
    <div className="hidden lg:flex w-1/2 min-h-screen lg:min-h-full lg:h-full shrink-0 sticky top-0 bg-transparent p-8 xl:p-12 flex-col justify-center items-center relative z-10 overflow-hidden">
      <div className="w-full max-w-xl text-white text-center flex flex-col items-center gap-6">
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-white/90 text-sm xl:text-base leading-relaxed font-normal">
            {t("subtitle")}
          </p>
        </div>

        <div className="w-full relative aspect-16/10 overflow-hidden rounded-xl z-20">
          <Image src="/auth-bg.jpg" alt={t("title")} fill className="object-cover" priority />
        </div>
      </div>
    </div>
  );
}
