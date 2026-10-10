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
import { authService, TeacherTokenValidationResponse } from "@/lib/api/auth-service";
import { queryKeys } from "@/lib/api/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { notFound, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

type TeacherLoginFormValues = {
  email: string;
  password: string;
};

function TeacherLoginForm() {
  const t = useTranslations("auth.teacherLogin");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // If no token is provided in URL at all, immediately trigger 404
  if (!token) {
    notFound();
  }

  const {
    data: validationData,
    isLoading: isValidating,
    isError,
  } = useQuery<TeacherTokenValidationResponse>({
    queryKey: ["teacher-token-validation", token],
    queryFn: () => authService.validateTeacherToken(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isError) {
    notFound();
  }

  const loginSchema = useMemo(() => {
    return z.object({
      email: z.string().email(tVal("invalidEmail")),
      password: z.string().min(1, tVal("passwordRequired")),
    });
  }, [tVal]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: TeacherLoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.providerLogin({
        email: values.email,
        password: values.password,
        token: token ?? undefined,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.provider.profile(),
      });

      toast.success(t("loginSuccess"));
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const friendlyMsg = getErrorMessage(err);
      setErrorMessage(friendlyMsg || tCommon("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="w-full max-w-md flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("verifying")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full relative border-none shadow-none ring-0">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg animate-in fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold tracking-tight">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          <GenericForm
            title={t("submitText")}
            schema={loginSchema}
            error={errorMessage}
            defaultValues={{
              email: validationData?.email || "",
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
                name: "email",
                label: t("emailLabel"),
                type: "email",
                placeholder: t("emailPlaceholder"),
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
          <div className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {t("contactAdmin")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function TeacherLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TeacherLoginForm />
    </Suspense>
  );
}
