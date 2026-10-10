"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function AuthBanner() {
  const t = useTranslations("auth.banner");

  return (
    <div className="hidden lg:flex w-1/2 h-screen shrink-0 sticky top-0 bg-primary p-8 xl:p-12 flex-col justify-center items-center relative overflow-hidden">
      <div
        className="w-full max-w-xl bg-white/10 border border-white/20 rounded-2xl p-8 xl:p-12 text-white text-center flex flex-col items-center gap-6"
        style={{
          boxShadow: "0px 8px 32px 0px #1F26875E",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
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
