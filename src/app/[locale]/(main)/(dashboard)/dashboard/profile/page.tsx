import { getTranslations } from "next-intl/server";
import { ProviderProfileClient } from "@/components/dashboard/profile/provider-profile-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "providerProfile" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function ProviderProfilePage() {
  return <ProviderProfileClient />;
}
