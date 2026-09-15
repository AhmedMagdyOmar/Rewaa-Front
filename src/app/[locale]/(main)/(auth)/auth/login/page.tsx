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
import { toast } from "sonner";
import * as z from "zod";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";

type LoginFormValues = {
  identifier: string;
  password: string;
};

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tRoles = useTranslations("auth.roles");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");

  const [selectedRole, setSelectedRole] = useState<"assistant" | "student">("assistant");

  const loginSchema = useMemo(() => {
    if (selectedRole === "student") {
      return z.object({
        identifier: z
          .string()
          .min(1, tVal("phoneRequired"))
          .regex(/^[0-9+\s-]{8,15}$/, tVal("invalidPhone")),
        password: z.string().min(1, tVal("passwordRequired")),
      });
    }
    return z.object({
      identifier: z.string().email(tVal("invalidEmail")),
      password: z.string().min(1, tVal("passwordRequired")),
    });
  }, [selectedRole, tVal]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (selectedRole === "student") {
        await authService.studentLogin({
          login: values.identifier,
          password: values.password,
        });
      } else {
        await authService.providerLogin({
          email: values.identifier,
          password: values.password,
        });
      }

      // Invalidate the role-specific profile query cache
      await queryClient.invalidateQueries({
        queryKey:
          selectedRole === "student" ? queryKeys.student.profile() : queryKeys.provider.profile(),
      });

      toast.success(t("loginSuccess"));
      if (selectedRole === "student") {
        router.push("/student-dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      const friendlyMsg = getErrorMessage(err);
      setErrorMessage(friendlyMsg || tCommon("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <div className="pt-4">
            <Tabs
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as "assistant" | "student")}
            >
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/70 rounded-xl">
                <TabsTrigger
                  value="assistant"
                  className="h-9 gap-2 text-xs font-semibold rounded-lg aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:shadow-sm transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  {tRoles("assistant")}
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="h-9 gap-2 text-xs font-semibold rounded-lg aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:shadow-sm transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                  {tRoles("student")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <GenericForm
            key={selectedRole}
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
                label: selectedRole === "student" ? t("phoneLabel") : t("emailLabel"),
                type: selectedRole === "student" ? "tel" : "email",
                placeholder:
                  selectedRole === "student" ? t("phonePlaceholder") : t("emailPlaceholder"),
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

        <CardFooter className="justify-center border-t-0 bg-transparent pt-2 pb-4 text-center">
          <div className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {t("contactAdmin")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
