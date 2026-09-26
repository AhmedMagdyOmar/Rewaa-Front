import { PaymentSuccessClient } from "@/components/dashboard/student/orders/PaymentSuccessClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentOrders.paymentSuccess");
  return {
    title: t("pageTitle"),
  };
}

export default function PaymentSuccessPage() {
  return <PaymentSuccessClient />;
}
