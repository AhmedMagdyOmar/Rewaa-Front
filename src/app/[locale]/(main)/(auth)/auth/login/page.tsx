"use client";

import { GenericForm } from "@/components/landing/layout/generic-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useRouter } from "@/i18n/routing";
import { getErrorMessage } from "@/lib/api-utils";
import { authService } from "@/lib/api/auth-service";
import { queryKeys } from "@/lib/api/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

type LoginFormValues = {
  identifier: string;
  password: string;
};

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tReg = useTranslations("auth.register");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");

  const loginSchema = useMemo(() => {
    return z.object({
      identifier: z
        .string()
        .min(1, tVal("phoneRequired"))
        .regex(/^[0-9+\s-]{8,15}$/, tVal("invalidPhone")),
      password: z.string().min(1, tVal("passwordRequired")),
    });
  }, [tVal]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.studentLogin({
        login: values.identifier,
        password: values.password,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.student.profile(),
      });

      toast.success(t("loginSuccess"));
      router.push("/student-dashboard");
      router.refresh();
    } catch (err) {
      const friendlyMsg = getErrorMessage(err);
      setErrorMessage(friendlyMsg || tCommon("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md my-auto">
      <Card className="w-full relative bg-white text-foreground rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-2xl animate-in fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <CardHeader className="text-center pb-4 pt-6">
          <CardTitle className="text-3xl font-bold tracking-tight">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          <GenericForm
            title={t("submitText")}
            schema={loginSchema}
            error={errorMessage}
            defaultValues={{
              identifier: "",
              password: "",
            }}
            onSubmit={handleSubmit}
            onReset={() => setErrorMessage(null)}
            submitText={t("submitText")}
            extraActions={
              <>
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none cursor-pointer select-none"
                  >
                    {t("rememberMe")}
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("forgotPasswordLink")}
                </Link>
              </>
            }
            fields={[
              {
                name: "identifier",
                label: t("phoneLabel"),
                type: "tel",
                placeholder: t("phonePlaceholder"),
              },
              {
                name: "password",
                label: t("passwordLabel"),
                type: "password",
                placeholder: t("passwordPlaceholder"),
              },
            ]}
          />
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center border-t bg-muted/20 py-4 text-center gap-2">
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              {tReg("signUpAsStudent")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
