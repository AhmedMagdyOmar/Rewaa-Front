import React, { Suspense } from "react";
import { GovernoratesClient } from "@/components/dashboard/governorates/governorates-client";

export default function GovernoratesPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading...</div>}>
      <GovernoratesClient />
    </Suspense>
  );
}
