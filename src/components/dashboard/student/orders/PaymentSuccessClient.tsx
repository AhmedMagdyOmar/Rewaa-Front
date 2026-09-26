"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CheckCircle2, Home, BookOpen, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentSuccessClient() {
  const t = useTranslations("studentOrders.paymentSuccess");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Animated success icon */}
        <div className="relative flex items-center justify-center">
          {/* Glow ring */}
          <div className="absolute size-40 rounded-full bg-emerald-500/10 animate-ping [animation-duration:2s]" />
          <div className="absolute size-32 rounded-full bg-emerald-500/15" />
          <div className="relative flex items-center justify-center size-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="size-12 text-emerald-500" strokeWidth={1.5} />
          </div>
          {/* Sparkles decoration */}
          <Sparkles className="absolute top-0 right-6 size-5 text-emerald-400 opacity-60 animate-pulse" />
          <Sparkles className="absolute bottom-2 left-4 size-4 text-emerald-300 opacity-40 animate-pulse [animation-delay:0.5s]" />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <GraduationCap className="size-5" />
            <span className="text-sm font-medium uppercase tracking-widest">{t("badge")}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-4">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs text-muted-foreground font-medium">{t("nextSteps")}</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 h-12 text-base font-semibold gap-2 shadow-md">
            <Link href="/student-dashboard/courses" id="go-to-courses-btn">
              <BookOpen className="size-5" />
              {t("goToCourses")}
            </Link>
          </Button>

          <Button asChild variant="outline" className="flex-1 h-12 text-base font-medium gap-2">
            <Link href="/" id="go-to-home-btn">
              <Home className="size-5" />
              {t("goToHome")}
            </Link>
          </Button>
        </div>

        {/* Orders link */}
        <p className="text-sm text-muted-foreground">
          {t("viewOrdersPrefix")}{" "}
          <Link
            href="/student-dashboard/orders"
            className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity font-medium"
            id="view-orders-link"
          >
            {t("viewOrdersLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
