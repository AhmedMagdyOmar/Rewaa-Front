"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Award, Sparkles } from "lucide-react";

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

        <div className="relative w-full max-w-[280px] sm:max-w-xs aspect-square rounded-full bg-white/10 flex items-center justify-center p-6 border border-white/15">
          {/* Top Right Floating Icon (Secondary Themed) */}
          <div className="absolute -top-3 right-8 sm:right-10 size-10 sm:size-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md shadow-secondary/20 z-30">
            <Sparkles className="size-5 sm:size-6" />
          </div>

          {/* Bottom Left Floating Icon (Reverse Primary: White bg, Primary fg) */}
          <div className="absolute -bottom-3 left-8 sm:left-10 size-10 sm:size-12 rounded-full bg-white text-primary flex items-center justify-center shadow-md shadow-black/5 border border-slate-100 z-30">
            <Award className="size-5 sm:size-6" />
          </div>

          {/* Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src="/images/gradcap.png"
              alt="Graduation Cap"
              width={200}
              height={200}
              className="object-contain max-h-full drop-shadow-sm"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
