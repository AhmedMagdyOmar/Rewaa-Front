"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  CheckCircle2,
  Home,
  BookOpen,
  Sparkles,
  GraduationCap,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentSuccessClient() {
  const t = useTranslations("studentOrders.paymentSuccess");
  const searchParams = useSearchParams();
  const isPending = searchParams.get("status") === "pending";
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Animated icon */}
        <div className="relative flex items-center justify-center">
          {/* Glow ring */}
          <div
            className={`absolute size-40 rounded-full animate-ping [animation-duration:2.5s] ${
              isPending ? "bg-amber-500/10" : "bg-emerald-500/10"
            }`}
          />
          <div
            className={`absolute size-32 rounded-full ${
              isPending ? "bg-amber-500/15" : "bg-emerald-500/15"
            }`}
          />
          <div
            className={`relative flex items-center justify-center size-24 rounded-full border-2 shadow-xl ${
              isPending
                ? "bg-amber-500/20 border-amber-500/30 shadow-amber-500/10"
                : "bg-emerald-500/20 border-emerald-500/30 shadow-emerald-500/10"
            }`}
          >
            {isPending ? (
              <Clock className="size-12 text-amber-500 animate-pulse" strokeWidth={1.5} />
            ) : (
              <CheckCircle2 className="size-12 text-emerald-500" strokeWidth={1.5} />
            )}
          </div>
          {/* Sparkles decoration */}
          {!isPending && (
            <>
              <Sparkles className="absolute top-0 right-6 size-5 text-emerald-400 opacity-60 animate-pulse" />
              <Sparkles className="absolute bottom-2 left-4 size-4 text-emerald-300 opacity-40 animate-pulse [animation-delay:0.5s]" />
            </>
          )}
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <div
            className={`flex items-center justify-center gap-2 ${
              isPending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
            }`}
          >
            {isPending ? <Clock className="size-5" /> : <GraduationCap className="size-5" />}
            <span className="text-sm font-medium uppercase tracking-widest">
              {isPending ? t("pendingBadge") : t("badge")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug">
            {isPending ? t("pendingTitle") : t("title")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            {isPending ? t("pendingSubtitle") : t("subtitle")}
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
          {isPending ? (
            <Button asChild className="flex-1 h-12 text-base font-semibold gap-2 shadow-md">
              <Link
                href={
                  orderId ? `/student-dashboard/orders/${orderId}` : "/student-dashboard/orders"
                }
                id="go-to-order-btn"
              >
                <FileText className="size-5" />
                {orderId ? t("viewOrderDetail") : t("viewAllOrders")}
              </Link>
            </Button>
          ) : (
            <Button asChild className="flex-1 h-12 text-base font-semibold gap-2 shadow-md">
              <Link href="/student-dashboard/courses" id="go-to-courses-btn">
                <BookOpen className="size-5" />
                {t("goToCourses")}
              </Link>
            </Button>
          )}

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
