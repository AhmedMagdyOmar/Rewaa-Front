/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRedeemActivationCode } from "@/hooks/use-student-activation-code";
import { CheckCircle2, KeyRound, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import type { RedeemActivationCodeResponse } from "@/types/api-contracts";

interface StudentRedeemCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCode?: string;
}

export function StudentRedeemCodeDialog({
  open,
  onOpenChange,
  defaultCode = "",
}: StudentRedeemCodeDialogProps) {
  const t = useTranslations("studentDashboard.activationCodeRedemption");
  const locale = useLocale();
  const router = useRouter();

  const [code, setCode] = useState<string>(defaultCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redeemedResult, setRedeemedResult] = useState<RedeemActivationCodeResponse | null>(null);

  const redeemMutation = useRedeemActivationCode();

  React.useEffect(() => {
    if (open) {
      setCode(defaultCode);
      setErrorMessage(null);
      setRedeemedResult(null);
    }
  }, [open, defaultCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setErrorMessage(null);

    redeemMutation.mutate(
      { code: cleanCode },
      {
        onSuccess: (data) => {
          setRedeemedResult(data);
          toast.success(t("successTitle"));
        },
        onError: (err: unknown) => {
          // Extract field-specific error from Laravel validation errors (errors.code) or apiMessage
          const codeFieldError =
            (
              err as {
                validationErrors?: { code?: [string] };
              }
            )?.validationErrors?.code?.[0] ||
            (err as { response?: { data?: { errors?: { code?: [string] }; message?: string } } })
              ?.response?.data?.errors?.code?.[0];

          const generalError =
            (err as { apiMessage?: string })?.apiMessage ||
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as { message?: string })?.message ||
            t("genericError");

          const finalError = codeFieldError || generalError;
          setErrorMessage(finalError);
        },
      },
    );
  };

  const handleGoToCourse = () => {
    if (redeemedResult?.course_id) {
      onOpenChange(false);
      router.push(`/student-dashboard/courses/${redeemedResult.course_id}`);
    }
  };

  const resolveCourseTitle = (): string => {
    if (!redeemedResult?.course_title) return "";
    const titleObj = redeemedResult.course_title;
    if (typeof titleObj === "string") return titleObj;
    return titleObj[locale] || titleObj.ar || titleObj.en || Object.values(titleObj)[0] || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 sm:p-8">
        {!redeemedResult ? (
          <>
            <DialogHeader className="space-y-2 text-start">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-1">
                <KeyRound className="size-5.5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {t("dialogTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {t("dialogDescription")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label
                  htmlFor="activation-code"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("inputLabel")}
                </Label>
                <div className="relative">
                  <Input
                    id="activation-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t("inputPlaceholder")}
                    disabled={redeemMutation.isPending}
                    className={`h-12 text-center text-base sm:text-lg font-mono font-bold tracking-wider uppercase rounded-xl transition-all ${
                      errorMessage
                        ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5 text-destructive"
                        : "border-border/80 focus-visible:ring-primary/30"
                    }`}
                    autoFocus
                    required
                  />
                </div>

                {errorMessage ? (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground font-medium">{t("hint")}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={redeemMutation.isPending}
                  className="w-full sm:w-auto flex-1 rounded-xl h-11 border-border/80 font-semibold"
                >
                  {t("close")}
                </Button>
                <Button
                  type="submit"
                  disabled={redeemMutation.isPending || !code.trim()}
                  className="w-full sm:w-auto flex-1 rounded-xl h-11 font-bold gap-2 shadow-xs"
                >
                  {redeemMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t("submitting")}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 fill-current" />
                      <span>{t("submit")}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-foreground">{t("successTitle")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {t("successDescription", {
                  courseTitle: resolveCourseTitle() || "",
                })}
              </p>
            </div>

            <div className="w-full pt-4 space-y-2">
              <Button
                type="button"
                size="lg"
                onClick={handleGoToCourse}
                className="w-full font-bold rounded-xl h-12 gap-2 shadow-md"
              >
                <span>{t("goToCourse")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
