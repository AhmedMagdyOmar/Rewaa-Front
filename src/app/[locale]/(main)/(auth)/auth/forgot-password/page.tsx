"use client";

import { GenericForm } from "@/components/landing/layout/generic-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { Link } from "@/i18n/routing";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");

  const forgotPasswordSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(tVal("invalidEmail")),
      }),
    [tVal],
  );

  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      await api({
        url: "/api/auth/forgot-password",
        method: "POST",
        data: values,
      });

      setIsSubmitted(true);
      toast.success(t("forgotPassword.successTitle"));
    } catch (err: unknown) {
      console.error("Forgot password error:", err);
      setErrorMessage(tCommon("genericError"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-md my-auto">
      <Card className="w-full relative bg-white text-foreground rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {isPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-2xl animate-in fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <CardHeader className="text-center pt-6">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {t("forgotPassword.title")}
          </CardTitle>
          <CardDescription>{t("forgotPassword.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          {isSubmitted ? (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t("forgotPassword.successTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("forgotPassword.successDescription")}
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {t("forgotPassword.backToLogin")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <GenericForm
                title={t("forgotPassword.submitText")}
                schema={forgotPasswordSchema}
                error={errorMessage}
                defaultValues={{ email: "" }}
                onSubmit={handleSubmit}
                submitText={t("forgotPassword.submitText")}
                fields={[
                  {
                    name: "email",
                    label: t("login.emailLabel"),
                    type: "email",
                    placeholder: t("login.emailPlaceholder"),
                  },
                ]}
              />

              <div className="text-center pt-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {t("forgotPassword.backToLogin")}
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
