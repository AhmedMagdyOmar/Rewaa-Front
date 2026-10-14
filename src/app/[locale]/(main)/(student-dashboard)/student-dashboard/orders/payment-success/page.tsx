import { PaymentSuccessClient } from "@/components/dashboard/student/orders/PaymentSuccessClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentOrders.paymentSuccess");
  return {
    title: t("pageTitle"),
  };
}

import { Suspense } from "react";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
