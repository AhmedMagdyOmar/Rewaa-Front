/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Building2, Upload, Copy, Check, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSubmitManualPayment } from "@/hooks/use-student-orders";
import { getErrorMessage } from "@/lib/api-utils";
import type { BackendOrder, BackendPaymentAccount } from "@/types/api-contracts";

interface StudentManualPaymentFormProps {
  order: BackendOrder;
  paymentAccounts: BackendPaymentAccount[];
  currency: string;
}

export function StudentManualPaymentForm({
  order,
  paymentAccounts,
  currency,
}: StudentManualPaymentFormProps) {
  const locale = useLocale();
  const t = useTranslations("studentOrders.manualPay");

  const remainingAmount = Number(order.remaining_amount ?? order.total_amount);

  const [selectedAccountId, setSelectedAccountId] = React.useState<string>(
    paymentAccounts[0]?.id ? String(paymentAccounts[0].id) : "",
  );
  const [amount, setAmount] = React.useState<string>(String(remainingAmount));
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [submittedPhone, setSubmittedPhone] = React.useState<string>("");
  const [transactionRef, setTransactionRef] = React.useState<string>("");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Update selected account when accounts load
  React.useEffect(() => {
    if (!selectedAccountId && paymentAccounts.length > 0) {
      setSelectedAccountId(String(paymentAccounts[0].id));
    }
  }, [paymentAccounts, selectedAccountId]);

  const activeAccount = React.useMemo(() => {
    return paymentAccounts.find((acc) => String(acc.id) === selectedAccountId);
  }, [paymentAccounts, selectedAccountId]);

  const resolveTranslation = (field?: Record<string, string> | string | null): string => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.ar || field.en || Object.values(field)[0] || "";
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t("copiedToast"));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("fileSizeError"));
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error(t("fileTypeError"));
      return;
    }

    setProofFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const router = useRouter();
  const submitMutation = useSubmitManualPayment(order.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId) {
      toast.error(t("accountRequiredError"));
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t("amountInvalidError"));
      return;
    }

    if (!proofFile) {
      toast.error(t("receiptRequiredError"));
      return;
    }

    const idempotencyKey = crypto.randomUUID();

    submitMutation.mutate(
      {
        payment_account_id: parseInt(selectedAccountId, 10),
        amount: numAmount,
        proof: proofFile,
        submitted_phone: submittedPhone.trim() || undefined,
        transaction_reference: transactionRef.trim() || undefined,
        idempotency_key: idempotencyKey,
      },
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
            <Building2 className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">{t("title")}</h3>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        {/* Bank Account Selection */}
        {paymentAccounts.length === 0 ? (
          <div className="rounded-xl bg-muted/50 p-4 text-center text-sm text-muted-foreground border border-dashed border-border/80">
            {t("noAccounts")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("selectAccount")}</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder={t("selectAccountPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {paymentAccounts.map((account) => {
                    const accName = resolveTranslation(account.account_name);
                    const typeLabel = account.type_label || account.type;
                    return (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {accName} ({typeLabel})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Account Details Card */}
            {activeAccount && (
              <div className="rounded-xl bg-muted/40 border border-border/60 p-4 space-y-3 text-sm">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>{resolveTranslation(activeAccount.account_name)}</span>
                  <span className="text-xs font-normal text-muted-foreground uppercase">
                    {activeAccount.type_label || activeAccount.type}
                  </span>
                </div>

                {activeAccount.account_number && (
                  <div className="flex items-center justify-between text-xs bg-background/80 p-2.5 rounded-lg border border-border/40">
                    <span className="text-muted-foreground">{t("accountNumber")}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-foreground">
                        {activeAccount.account_number}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(activeAccount.account_number, "acc_num")}
                      >
                        {copiedKey === "acc_num" ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {activeAccount.instructions && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {resolveTranslation(activeAccount.instructions)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payment Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              {t("amount")}
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-11 pe-14"
              />
              <span className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                {currency}
              </span>
            </div>
          </div>

          {/* Sender Phone */}
          <div className="space-y-2">
            <Label htmlFor="sender_phone" className="text-sm font-medium">
              {t("senderPhone")}
            </Label>
            <Input
              id="sender_phone"
              type="tel"
              value={submittedPhone}
              onChange={(e) => setSubmittedPhone(e.target.value)}
              placeholder={t("senderPhonePlaceholder")}
              className="h-11"
            />
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="ref_number" className="text-sm font-medium">
              {t("reference")}
            </Label>
            <Input
              id="ref_number"
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder={t("referencePlaceholder")}
              className="h-11"
            />
          </div>

          {/* Receipt Proof Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("receipt")}</Label>

            <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-4 transition-colors text-center relative cursor-pointer bg-muted/20">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required={!proofFile}
              />

              {proofFile ? (
                <div className="flex flex-col items-center gap-2">
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="max-h-36 rounded-lg object-contain border border-border"
                    />
                  )}
                  <p className="text-xs font-medium text-foreground truncate max-w-xs">
                    {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                  </p>
                  <span className="text-[11px] text-primary underline">{t("changeImage")}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <Upload className="size-7 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">{t("uploadPrompt")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("uploadHint")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitMutation.isPending || !proofFile || !selectedAccountId}
            className="w-full h-11 text-base font-semibold gap-2 shadow-xs mt-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                {t("submitButton")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
