"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Wallet, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PaymentTab = "wallet" | "manual";

interface StudentCheckoutPaymentMethodSelectorProps {
  selectedTab: PaymentTab;
  onSelectTab: (tab: PaymentTab) => void;
  walletBalance: number;
  remainingAmount: number;
  currency: string;
}

export function StudentCheckoutPaymentMethodSelector({
  selectedTab,
  onSelectTab,
  walletBalance,
  remainingAmount,
  currency,
}: StudentCheckoutPaymentMethodSelectorProps) {
  const t = useTranslations("studentOrders.paymentMethods");

  const hasSufficientWallet = walletBalance >= remainingAmount && remainingAmount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {/* Wallet Option */}
      <Card
        onClick={() => onSelectTab("wallet")}
        className={cn(
          "p-4 cursor-pointer transition-all duration-200 border-2 flex items-start gap-3.5 relative",
          selectedTab === "wallet"
            ? "border-primary bg-primary/5 shadow-xs"
            : "border-border/60 hover:border-border hover:bg-muted/30",
        )}
      >
        <div
          className={cn(
            "p-2.5 rounded-xl shrink-0 transition-colors",
            selectedTab === "wallet"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Wallet className="size-5" />
        </div>

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm text-foreground">{t("wallet")}</h4>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                hasSufficientWallet
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600",
              )}
            >
              {walletBalance.toFixed(2)} {currency}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("walletSubtitle")}</p>
        </div>
      </Card>

      {/* Manual Bank Transfer Option */}
      <Card
        onClick={() => onSelectTab("manual")}
        className={cn(
          "p-4 cursor-pointer transition-all duration-200 border-2 flex items-start gap-3.5 relative",
          selectedTab === "manual"
            ? "border-primary bg-primary/5 shadow-xs"
            : "border-border/60 hover:border-border hover:bg-muted/30",
        )}
      >
        <div
          className={cn(
            "p-2.5 rounded-xl shrink-0 transition-colors",
            selectedTab === "manual"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Building2 className="size-5" />
        </div>

        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground">{t("manual")}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("manualSubtitle")}</p>
        </div>
      </Card>
    </div>
  );
}
