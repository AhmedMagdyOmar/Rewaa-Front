"use client";

import { GenericForm } from "@/components/landing/layout/generic-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/apiClient";
import { Link, useRouter } from "@/i18n/routing";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { useMemo } from "react";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");

  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, tVal("passwordMinLength")),
          confirmPassword: z.string().min(8, tVal("confirmPasswordRequired")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tVal("passwordsDoNotMatch"),
          path: ["confirmPassword"],
        }),
    [tVal],
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setErrorMessage(t("resetPassword.invalidToken"));
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      await api({
        url: "/api/auth/reset-password",
        method: "POST",
        data: {
          token,
          password: values.password,
        },
      });

      toast.success(t("resetPassword.successMessage"));
      router.push("/auth/login");
    } catch {
      setErrorMessage(tCommon("genericError"));
    } finally {
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <Card className="w-full border-none shadow-none ring-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t("resetPassword.title")}
            </CardTitle>
            <CardDescription className="text-destructive font-medium">
              {t("resetPassword.invalidToken")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/forgot-password">{t("resetPassword.requestNewLink")}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">{t("login.submitText")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full relative border-none shadow-none ring-0">
        {isPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg animate-in fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {t("resetPassword.title")}
          </CardTitle>
          <CardDescription>{t("resetPassword.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          <GenericForm
            title={t("resetPassword.submitText")}
            schema={resetPasswordSchema}
            error={errorMessage}
            defaultValues={{
              password: "",
              confirmPassword: "",
            }}
            onSubmit={handleSubmit}
            submitText={t("resetPassword.submitText")}
            fields={[
              {
                name: "password",
                label: t("resetPassword.newPasswordLabel"),
                type: "password",
                placeholder: t("register.passwordPlaceholder"),
              },
              {
                name: "confirmPassword",
                label: t("resetPassword.confirmPasswordLabel"),
                type: "password",
                placeholder: t("register.passwordPlaceholder"),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
