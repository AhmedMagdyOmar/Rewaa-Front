"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Wallet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { usePayWithWallet } from "@/hooks/use-student-orders";
import { getErrorMessage } from "@/lib/api-utils";
import type { BackendOrder } from "@/types/api-contracts";

interface StudentWalletPayConfirmProps {
  order: BackendOrder;
  walletBalance: number;
  currency: string;
}

export function StudentWalletPayConfirm({
  order,
  walletBalance,
  currency,
}: StudentWalletPayConfirmProps) {
  const router = useRouter();
  const t = useTranslations("studentOrders.walletPay");

  const remainingAmount = Number(order.remaining_amount ?? order.total_amount);
  const hasSufficient = walletBalance >= remainingAmount && remainingAmount > 0;
  const balanceAfter = Math.max(0, walletBalance - remainingAmount);

  const payMutation = usePayWithWallet(order.id);

  const handlePay = () => {
    if (!hasSufficient) {
      toast.error(t("insufficientToast"));
      return;
    }

    const idempotencyKey = crypto.randomUUID();

    payMutation.mutate(
      { idempotency_key: idempotencyKey },
      {
        onSuccess: () => {
          router.push("/student-dashboard/orders/payment-success");
        },
        onError: (err: unknown) => {
          const message = getErrorMessage(err) || t("errorToast");
          toast.error(message);
        },
      },
    );
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">{t("title")}</h3>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{t("currentBalance")}</span>
            <span className="font-medium text-foreground">
              {walletBalance.toFixed(2)} {currency}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>{t("amountToDeduct")}</span>
            <span className="font-semibold text-primary">
              {remainingAmount.toFixed(2)} {currency}
            </span>
          </div>

          <div className="h-px bg-border/60 my-1" />

          <div className="flex items-center justify-between font-medium">
            <span className="text-foreground">{t("balanceAfter")}</span>
            <span
              className={hasSufficient ? "text-emerald-600 font-bold" : "text-muted-foreground"}
            >
              {hasSufficient ? `${balanceAfter.toFixed(2)} ${currency}` : "---"}
            </span>
          </div>
        </div>

        {/* Insufficient warning */}
        {!hasSufficient && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3 text-amber-800">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">{t("insufficientTitle")}</p>
              <p className="text-amber-700">
                {t("insufficientDesc", {
                  needed: (remainingAmount - walletBalance).toFixed(2),
                  currency,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handlePay}
          disabled={!hasSufficient || payMutation.isPending}
          className="w-full h-11 text-base font-semibold gap-2 shadow-xs"
        >
          {payMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("processing")}
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              {t("confirmButton", {
                amount: remainingAmount.toFixed(2),
                currency,
              })}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
